// HONEYPOT TRAP - Fake Patient Data Endpoint
// This endpoint should NEVER be accessed by legitimate users

import { NextRequest } from 'next/server'
import { generateHoneypotResponse } from '@/lib/honeypot-network'

export async function GET(request: NextRequest) {
  const trap = {
    path: '/api/internal/patient-data',
    method: 'GET',
    description: 'Honeypot patient data trap',
    trapType: 'data' as const
  }
  
  return await generateHoneypotResponse(request, trap)
}

export async function POST(request: NextRequest) {
  const trap = {
    path: '/api/internal/patient-data',
    method: 'POST',
    description: 'Honeypot patient data creation',
    trapType: 'data' as const
  }
  
  return await generateHoneypotResponse(request, trap)
}
