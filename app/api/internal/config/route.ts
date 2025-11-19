// HONEYPOT TRAP - Fake Config Endpoint
// This endpoint should NEVER be accessed by legitimate users

import { NextRequest } from 'next/server'
import { generateHoneypotResponse } from '@/lib/honeypot-network'

export async function GET(request: NextRequest) {
  const trap = {
    path: '/api/internal/config',
    method: 'GET',
    description: 'Honeypot config trap',
    trapType: 'config' as const
  }
  
  return await generateHoneypotResponse(request, trap)
}
