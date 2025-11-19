// Advanced Session Management
// Track active sessions, devices, IP geolocation, logout all devices

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId
  token: string
  deviceInfo: {
    userAgent: string
    platform: string
    browser: string
    os: string
  }
  ipAddress: string
  location?: {
    country?: string
    city?: string
    region?: string
    timezone?: string
  }
  loginTime: Date
  lastActivity: Date
  expiresAt: Date
  isActive: boolean
  logoutTime?: Date
  createdAt: Date
}

const SessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String,
    os: String,
  },
  ipAddress: { type: String, required: true },
  location: {
    country: String,
    city: String,
    region: String,
    timezone: String,
  },
  loginTime: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  logoutTime: Date,
}, { timestamps: true })

// Index for cleanup of expired sessions
SessionSchema.index({ expiresAt: 1, isActive: 1 })

// Compound index for user session queries
SessionSchema.index({ userId: 1, isActive: 1, lastActivity: -1 })

export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)

// Session Management Functions

/**
 * Create new session
 */
export async function createSession(
  userId: string,
  token: string,
  deviceInfo: any,
  ipAddress: string,
  expiresAt: Date
): Promise<ISession> {
  const location = await getLocationFromIP(ipAddress)

  return await Session.create({
    userId,
    token,
    deviceInfo: {
      userAgent: deviceInfo.userAgent || 'Unknown',
      platform: deviceInfo.platform || 'Unknown',
      browser: parseBrowser(deviceInfo.userAgent),
      os: parseOS(deviceInfo.userAgent),
    },
    ipAddress,
    location,
    expiresAt,
    isActive: true,
  })
}

/**
 * Get all active sessions for user
 */
export async function getUserSessions(userId: string): Promise<ISession[]> {
  return await Session.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastActivity: -1 })
    .lean() as any
}

/**
 * Update session activity
 */
export async function updateSessionActivity(token: string): Promise<void> {
  await Session.updateOne(
    { token, isActive: true },
    { lastActivity: new Date() }
  )
}

/**
 * Logout single session
 */
export async function logoutSession(token: string): Promise<void> {
  await Session.updateOne(
    { token },
    {
      isActive: false,
      logoutTime: new Date(),
    }
  )
}

/**
 * Logout all sessions for user (except current)
 */
export async function logoutAllSessionsExcept(
  userId: string,
  currentToken: string
): Promise<number> {
  const result = await Session.updateMany(
    {
      userId,
      token: { $ne: currentToken },
      isActive: true,
    },
    {
      isActive: false,
      logoutTime: new Date(),
    }
  )

  return result.modifiedCount
}

/**
 * Logout all sessions for user
 */
export async function logoutAllSessions(userId: string): Promise<number> {
  const result = await Session.updateMany(
    { userId, isActive: true },
    {
      isActive: false,
      logoutTime: new Date(),
    }
  )

  return result.modifiedCount
}

/**
 * Check if session is valid
 */
export async function validateSession(token: string): Promise<ISession | null> {
  const session = await Session.findOne({
    token,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).lean()

  if (session) {
    // Update last activity in background
    updateSessionActivity(token).catch(console.error)
  }

  return session as any
}

/**
 * Cleanup expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await Session.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false, logoutTime: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // 30 days old
    ],
  })

  return result.deletedCount
}

/**
 * Detect suspicious login
 */
export async function detectSuspiciousLogin(
  userId: string,
  ipAddress: string,
  location: any
): Promise<boolean> {
  // Get recent sessions
  const recentSessions = await Session.find({
    userId,
    loginTime: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
  })
    .limit(10)
    .lean()

  if (recentSessions.length === 0) return false

  // Check if location is new
  const knownCountries = new Set(
    recentSessions.map(s => s.location?.country).filter(Boolean)
  )

  if (location?.country && !knownCountries.has(location.country)) {
    return true // New country
  }

  // Check if IP is new
  const knownIPs = new Set(recentSessions.map(s => s.ipAddress))
  if (!knownIPs.has(ipAddress)) {
    // New IP but same country - medium risk
    return knownCountries.size > 0 && location?.country !== recentSessions[0]?.location?.country
  }

  return false
}

// Helper functions

function parseBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown'
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Other'
}

function parseOS(userAgent: string): string {
  if (!userAgent) return 'Unknown'
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS'
  return 'Other'
}

async function getLocationFromIP(ipAddress: string): Promise<any> {
  // Skip for localhost/private IPs
  if (
    ipAddress === '::1' ||
    ipAddress === '127.0.0.1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.')
  ) {
    return {
      country: 'Local',
      city: 'Development',
      region: 'N/A',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }

  // In production, integrate with IP geolocation service (ipapi.co, ipinfo.io, etc.)
  // For now, return placeholder
  return {
    country: 'Unknown',
    city: 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}
