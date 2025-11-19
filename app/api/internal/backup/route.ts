// HONEYPOT TRAP - Fake Backup Endpoint
// This endpoint should NEVER be accessed by legitimate users

import { NextRequest } from 'next/server'
import { generateHoneypotResponse } from '@/lib/honeypot-network'

export async function GET(request: NextRequest) {
  const trap = {
    path: '/api/internal/backup',
    method: 'GET',
    description: 'Honeypot backup trap',
    trapType: 'data' as const
  }
  
  return await generateHoneypotResponse(request, trap)
}
