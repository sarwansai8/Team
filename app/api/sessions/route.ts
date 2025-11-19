import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/db'
import { 
  getUserSessions, 
  logoutSession, 
  logoutAllSessionsExcept,
  logoutAllSessions
} from '@/lib/session-manager'
import { logAudit } from '@/lib/audit-logger'

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

// GET - Get active sessions
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const sessions = await getUserSessions(user.userId)

    // Add current session marker
    const currentToken = request.cookies.get('auth-token')?.value
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.token === currentToken,
    }))

    return NextResponse.json({
      success: true,
      sessions: sessionsWithCurrent,
      count: sessions.length,
    })

  } catch (error: any) {
    console.error('Fetch sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Logout sessions
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { action, sessionToken } = body

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const currentToken = request.cookies.get('auth-token')?.value

    let result: any = {}

    switch (action) {
      case 'logout-session': {
        // Logout specific session
        if (!sessionToken) {
          return NextResponse.json({ error: 'sessionToken required' }, { status: 400 })
        }

        await logoutSession(sessionToken)

        await logAudit({
          userId: user.userId,
          action: 'logout',
          resource: 'session',
          resourceId: sessionToken,
          details: { method: 'single-session', reason: 'user-initiated' },
          ipAddress,
          userAgent,
          complianceCategory: 'authentication',
          severity: 'info',
        })

        result = {
          action: 'logout-session',
          message: 'Session logged out successfully',
        }
        break
      }

      case 'logout-all-except-current': {
        // Logout all other sessions
        if (!currentToken) {
          return NextResponse.json({ error: 'No active session' }, { status: 400 })
        }

        const count = await logoutAllSessionsExcept(user.userId, currentToken)

        await logAudit({
          userId: user.userId,
          action: 'logout',
          resource: 'session',
          details: { 
            method: 'logout-all-except-current', 
            sessionsLoggedOut: count,
            reason: 'user-initiated' 
          },
          ipAddress,
          userAgent,
          complianceCategory: 'authentication',
          severity: 'warning',
        })

        result = {
          action: 'logout-all-except-current',
          message: `${count} session(s) logged out`,
          count,
        }
        break
      }

      case 'logout-all': {
        // Logout all sessions including current
        const count = await logoutAllSessions(user.userId)

        await logAudit({
          userId: user.userId,
          action: 'logout',
          resource: 'session',
          details: { 
            method: 'logout-all', 
            sessionsLoggedOut: count,
            reason: 'user-initiated' 
          },
          ipAddress,
          userAgent,
          complianceCategory: 'authentication',
          severity: 'critical',
        })

        // Clear current session cookie
        const response = NextResponse.json({
          action: 'logout-all',
          message: `${count} session(s) logged out`,
          count,
        })

        response.cookies.set('auth-token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
        })

        return response
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: logout-session, logout-all-except-current, or logout-all' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      ...result,
    })

  } catch (error: any) {
    console.error('Session logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout session', details: error.message },
      { status: 500 }
    )
  }
}
