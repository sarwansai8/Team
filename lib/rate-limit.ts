// Simple in-memory rate limiter for API routes
// In production, use Redis for distributed rate limiting

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Maximum requests per window
  message?: string
}

export function rateLimit(config: RateLimitConfig) {
  return async function checkRateLimit(identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    message?: string
  }> {
    const now = Date.now()
    const key = identifier

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }

    store[key].count++

    const allowed = store[key].count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - store[key].count)

    return {
      allowed,
      remaining,
      resetTime: store[key].resetTime,
      message: allowed ? undefined : (config.message || 'Too many requests. Please try again later.')
    }
  }
}

// Predefined rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'API rate limit exceeded. Please slow down.'
})

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  message: 'Rate limit exceeded. Please wait before trying again.'
})

// Helper to get client identifier from request
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (proxy-aware)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // Also include user agent to make it slightly harder to bypass
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return `${ip}:${userAgent.substring(0, 50)}`
}
