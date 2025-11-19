import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/db'
import { 
  getUserAuditLogs, 
  searchAuditLogs, 
  generateComplianceReport 
} from '@/lib/audit-logger'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) return null
  
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

// GET - Fetch audit logs
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'user' // user, search, report

    // User's own audit logs
    if (type === 'user') {
      const action = searchParams.get('action') || undefined
      const resource = searchParams.get('resource') || undefined
      const limit = parseInt(searchParams.get('limit') || '50')

      const logs = await getUserAuditLogs(user.userId, {
        action,
        resource,
        limit,
      })

      return NextResponse.json({
        success: true,
        logs,
        count: logs.length,
      })
    }

    // Admin-only: Search all audit logs
    if (type === 'search') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const userId = searchParams.get('userId') || undefined
      const action = searchParams.get('action') || undefined
      const resource = searchParams.get('resource') || undefined
      const complianceCategory = searchParams.get('category') || undefined
      const severity = searchParams.get('severity') || undefined
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')

      const { logs, total } = await searchAuditLogs({
        userId,
        action,
        resource,
        complianceCategory,
        severity,
        limit,
        skip: (page - 1) * limit,
      })

      return NextResponse.json({
        success: true,
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    }

    // Admin-only: Generate compliance report
    if (type === 'report') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const startDate = searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days

      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : new Date()

      const report = await generateComplianceReport(startDate, endDate)

      return NextResponse.json({
        success: true,
        report,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })

  } catch (error: any) {
    console.error('Audit logs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    )
  }
}
