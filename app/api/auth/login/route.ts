import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/db'
import { User } from '@/lib/models'
import { loginSchema, validateRequest } from '@/lib/validations'
import { authRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { 
  recordLoginAttempt, 
  isAccountLocked, 
  generateCSRFToken, 
  generateSessionId,
  generateRefreshToken,
  sanitizeUserInput
} from '@/lib/advanced-security'
import { createSession } from '@/lib/session-manager'
import { logAudit } from '@/lib/audit-logger'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - strict for login attempts
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await authRateLimit(clientId)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      )
    }

    await connectDB()
    
    const body = await request.json()
    
    // Sanitize input to prevent NoSQL injection
    const sanitizedBody = sanitizeUserInput(body)
    
    // Check if account is locked from brute force attempts
    const accountLocked = isAccountLocked(clientId)
    if (accountLocked) {
      return NextResponse.json(
        { error: 'Account temporarily locked due to too many failed login attempts. Please try again in 30 minutes.' },
        { status: 423 } // 423 Locked
      )
    }
    
    // Validate input
    const validation = validateRequest(loginSchema, sanitizedBody)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }
    
    const { email, password } = validation.data

    // Get client IP and User Agent early
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Record failed attempt
      const attempt = recordLoginAttempt(clientId, false)
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          attemptsLeft: attempt.attemptsLeft
        },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      // Record failed attempt
      const attempt = recordLoginAttempt(clientId, false)
      
      // Log failed login audit
      await logAudit({
        userId: (user as any)._id.toString(),
        action: 'login',
        resource: 'authentication',
        details: {
          method: 'POST',
          endpoint: '/api/auth/login',
          success: false,
          reason: 'Invalid password'
        },
        ipAddress: clientIP,
        userAgent,
        complianceCategory: 'authentication',
        severity: 'warning',
      })
      
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          attemptsLeft: attempt.attemptsLeft
        },
        { status: 401 }
      )
    }
    
    // Clear failed attempts on successful login
    recordLoginAttempt(clientId, true)

    // Generate session ID
    const sessionId = generateSessionId()
    
    // Generate CSRF token
    const csrfToken = generateCSRFToken(sessionId)
    
    // Generate JWT access token
    const token = jwt.sign(
      { 
        userId: (user as any)._id,
        email: user.email,
        role: user.role,
        sessionId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    // Generate refresh token
    const refreshToken = generateRefreshToken((user as any)._id.toString())
    
    // Create session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await createSession(
      (user as any)._id.toString(),
      token,
      { userAgent, platform: 'web' },
      clientIP,
      expiresAt
    )
    
    // Log successful login audit
    await logAudit({
      userId: (user as any)._id.toString(),
      action: 'login',
      resource: 'authentication',
      details: {
        method: 'POST',
        endpoint: '/api/auth/login',
        success: true,
        sessionId
      },
      ipAddress: clientIP,
      userAgent,
      complianceCategory: 'authentication',
      severity: 'info',
    })

    // Remove password from response
    const userObject = user.toObject()
    const { password: _, ...userResponse } = userObject

    // Set cookies
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userResponse._id,
        email: userResponse.email,
        firstName: userResponse.firstName,
        lastName: userResponse.lastName,
        dateOfBirth: userResponse.dateOfBirth,
        gender: userResponse.gender,
        phone: userResponse.phone,
        address: userResponse.address,
        city: userResponse.city,
        state: userResponse.state,
        zipCode: userResponse.zipCode,
        bloodType: userResponse.bloodType,
        emergencyContact: userResponse.emergencyContact,
        registeredDate: userResponse.createdAt
      },
      token,
      refreshToken,
      csrfToken,
      sessionId
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-CSRF-Token': csrfToken
      }
    })

    // Set auth token cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed to strict for better CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    // Set refresh token cookie (longer expiry)
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/api/auth/refresh'
    })
    
    // Set session ID cookie (for CSRF protection)
    response.cookies.set('session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    )
  }
}
