// HONEYPOT TRAP - Fake Admin Users Endpoint
// This endpoint should NEVER be accessed by legitimate users

import { NextRequest } from 'next/server'
import { generateHoneypotResponse, isHoneypotPath } from '@/lib/honeypot-network'

export async function GET(request: NextRequest) {
  const trap = isHoneypotPath('/api/internal/admin-users')
  
  if (trap) {
    return await generateHoneypotResponse(request, trap)
  }

  // Fallback should never be reached
  return generateHoneypotResponse(request, {
    path: '/api/internal/admin-users',
    method: 'GET',
    description: 'Honeypot admin user trap',
    trapType: 'admin'
  })
}

export async function POST(request: NextRequest) {
  const trap = { 
    path: '/api/internal/admin-users', 
    method: 'POST', 
    description: 'Honeypot admin creation', 
    trapType: 'admin' as const
  }
  return await generateHoneypotResponse(request, trap)
}
