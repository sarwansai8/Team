// Security Headers Middleware
// Implements CSP, XSS protection, frame protection, and other security headers

import { NextRequest, NextResponse } from 'next/server'

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy - Prevents XSS attacks
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval for dev
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'", // Prevent clickjacking
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
  ].join(', '),

  // HSTS - Force HTTPS (only in production)
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const headers = new Headers(response.headers)

  // Add each security header
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value)
    }
  })

  // Add HSTS only in production
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Middleware wrapper to add security headers
 * Usage: export const GET = withSecurityHeaders(async (request) => { ... })
 */
export function withSecurityHeaders(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)
    return addSecurityHeaders(response)
  }
}

/**
 * Create response with security headers
 */
export function secureResponse(
  body: any,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(body, init)
  return addSecurityHeaders(response)
}

/**
 * CORS configuration for API routes
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
}

/**
 * Add CORS headers to response
 */
export function addCORSHeaders(response: NextResponse): NextResponse {
  const headers = new Headers(response.headers)

  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    headers.set(key, value)
  })

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCORSPreflight(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

/**
 * Combined security and CORS middleware
 */
export function withSecurityAndCORS(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return handleCORSPreflight()
    }

    const response = await handler(request)
    const withSecurity = addSecurityHeaders(response)
    return addCORSHeaders(withSecurity)
  }
}
