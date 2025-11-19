// Export Honeypot & Security Data to JSON Files
// Run: node export-security-data.mjs

import { MongoClient } from 'mongodb'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Read MongoDB URI from .env.local
function getMongoURI() {
  try {
    const envContent = readFileSync('.env.local', 'utf-8')
    const match = envContent.match(/MONGODB_URI=(.+)/)
    return match ? match[1].trim() : null
  } catch (error) {
    console.error('❌ Error reading .env.local:', error.message)
    return null
  }
}

async function exportSecurityData() {
  const uri = getMongoURI()
  
  if (!uri) {
    console.error('❌ MongoDB URI not found in .env.local')
    process.exit(1)
  }

  console.log('🔗 Connecting to MongoDB...')
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db = client.db('healthportal')
    
    // 1. Export Security Events
    console.log('📊 Exporting security events...')
    const securityEvents = await db.collection('securityevents')
      .find({})
      .sort({ timestamp: -1 })
      .limit(1000) // Last 1000 events
      .toArray()
    
    const honeypotEvents = securityEvents.filter(e => 
      e.type === 'honeypot_triggered' || e.honeypotData
    )
    
    const securityStats = {
      exportDate: new Date().toISOString(),
      totalEvents: securityEvents.length,
      honeypotTriggers: honeypotEvents.length,
      eventTypes: {},
      severityDistribution: {},
      topIPs: {}
    }

    // Calculate statistics
    securityEvents.forEach(event => {
      // Count by type
      securityStats.eventTypes[event.type] = (securityStats.eventTypes[event.type] || 0) + 1
      
      // Count by severity
      securityStats.severityDistribution[event.severity] = 
        (securityStats.severityDistribution[event.severity] || 0) + 1
      
      // Count by IP
      if (event.ipAddress) {
        securityStats.topIPs[event.ipAddress] = (securityStats.topIPs[event.ipAddress] || 0) + 1
      }
    })

    // Sort top IPs
    const sortedIPs = Object.entries(securityStats.topIPs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .reduce((acc, [ip, count]) => {
        acc[ip] = count
        return acc
      }, {})
    securityStats.topIPs = sortedIPs

    // 2. Export Honeypot Events
    console.log('🍯 Exporting honeypot events...')
    const honeypotData = {
      exportDate: new Date().toISOString(),
      totalHoneypotTriggers: honeypotEvents.length,
      events: honeypotEvents.map(e => ({
        timestamp: e.timestamp,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
        honeypotData: e.honeypotData,
        severity: e.severity,
        blocked: e.metadata?.blocked || false
      }))
    }

    // 3. Export Blocked IPs
    console.log('🚫 Exporting blocked IPs...')
    const blockedIPs = securityEvents
      .filter(e => e.metadata?.blocked || e.severity === 'critical')
      .map(e => e.ipAddress)
      .filter((ip, index, self) => ip && self.indexOf(ip) === index)
    
    const blockedIPsData = {
      exportDate: new Date().toISOString(),
      totalBlocked: blockedIPs.length,
      ips: blockedIPs.map(ip => ({
        ip,
        firstSeen: securityEvents.find(e => e.ipAddress === ip)?.timestamp,
        reason: 'Honeypot triggered or critical security event',
        threatLevel: 'high'
      }))
    }

    // 4. Export Threat Analysis
    console.log('🔍 Generating threat analysis...')
    const threatAnalysis = {
      exportDate: new Date().toISOString(),
      period: '90 days',
      summary: {
        totalThreats: securityEvents.length,
        criticalThreats: securityEvents.filter(e => e.severity === 'critical').length,
        honeypotTriggers: honeypotEvents.length,
        blockedIPs: blockedIPs.length,
        botDetections: securityEvents.filter(e => e.type === 'bot_detected').length,
        failedAuthAttempts: securityEvents.filter(e => e.type === 'failed_auth').length
      },
      topThreats: [
        {
          type: 'honeypot_field_filled',
          count: honeypotEvents.filter(e => 
            e.honeypotData?.trapsTriggered?.some(t => t.type === 'field_filled')
          ).length,
          severity: 'critical'
        },
        {
          type: 'bot_detection',
          count: securityEvents.filter(e => e.type === 'bot_detected').length,
          severity: 'high'
        },
        {
          type: 'failed_authentication',
          count: securityEvents.filter(e => e.type === 'failed_auth').length,
          severity: 'medium'
        }
      ],
      recommendations: [
        'Continue monitoring honeypot fields',
        'Review blocked IPs regularly',
        'Update bot detection signatures',
        'Analyze failed auth patterns for account takeover attempts'
      ]
    }

    // 5. Write to files
    const outputDir = 'security-logs'
    
    console.log('\n💾 Writing data to files...')
    
    writeFileSync(
      join(outputDir, 'security-events.json'),
      JSON.stringify({ ...securityStats, events: securityEvents }, null, 2)
    )
    console.log('  ✅ security-events.json')

    writeFileSync(
      join(outputDir, 'honeypot-events.json'),
      JSON.stringify(honeypotData, null, 2)
    )
    console.log('  ✅ honeypot-events.json')

    writeFileSync(
      join(outputDir, 'blocked-ips.json'),
      JSON.stringify(blockedIPsData, null, 2)
    )
    console.log('  ✅ blocked-ips.json')

    writeFileSync(
      join(outputDir, 'threat-analysis.json'),
      JSON.stringify(threatAnalysis, null, 2)
    )
    console.log('  ✅ threat-analysis.json')

    // Print summary
    console.log('\n📊 EXPORT SUMMARY:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Total Security Events: ${securityEvents.length}`)
    console.log(`Honeypot Triggers: ${honeypotEvents.length}`)
    console.log(`Blocked IPs: ${blockedIPs.length}`)
    console.log(`Bot Detections: ${threatAnalysis.summary.botDetections}`)
    console.log(`Failed Auth Attempts: ${threatAnalysis.summary.failedAuthAttempts}`)
    console.log('\n✅ All security data exported successfully!')
    console.log(`📁 Location: ${outputDir}/\n`)

  } catch (error) {
    console.error('❌ Export failed:', error.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

exportSecurityData()
