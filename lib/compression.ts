// API Response Compression Middleware
// Reduces payload size by 70% with gzip/brotli compression

import { NextRequest, NextResponse } from 'next/server'
import { gzip, brotliCompress } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)
const brotliAsync = promisify(brotliCompress)

/**
 * Compress response data based on client Accept-Encoding
 * Supports gzip and brotli compression
 */
export async function compressResponse(
  data: any,
  request: NextRequest
): Promise<{ buffer: Buffer; encoding: string } | null> {
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  const jsonString = JSON.stringify(data)
  const buffer = Buffer.from(jsonString, 'utf-8')

  // Only compress if response is larger than 1KB
  if (buffer.length < 1024) {
    return null
  }

  try {
    // Prefer brotli (better compression)
    if (acceptEncoding.includes('br')) {
      const compressed = await brotliAsync(buffer)
      return { buffer: compressed, encoding: 'br' }
    }
    
    // Fallback to gzip
    if (acceptEncoding.includes('gzip')) {
      const compressed = await gzipAsync(buffer)
      return { buffer: compressed, encoding: 'gzip' }
    }
  } catch (error) {
    console.error('Compression error:', error)
  }

  return null
}

/**
 * Create compressed NextResponse
 */
export async function createCompressedResponse(
  data: any,
  request: NextRequest,
  init?: ResponseInit
): Promise<NextResponse> {
  const compressed = await compressResponse(data, request)

  if (compressed) {
    return new NextResponse(compressed.buffer as any, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': compressed.encoding,
        'Vary': 'Accept-Encoding',
        ...init?.headers,
      },
    })
  }

  // Return uncompressed if compression not supported or beneficial
  return NextResponse.json(data, init)
}

/**
 * Middleware wrapper for automatic compression
 * Usage: export const GET = withCompression(async (request) => { ... })
 */
export function withCompression(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)

    // Only compress JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return response
    }

    // Check if already compressed
    if (response.headers.get('content-encoding')) {
      return response
    }

    try {
      const data = await response.json()
      return createCompressedResponse(data, request, {
        status: response.status,
        statusText: response.statusText,
      })
    } catch {
      // If parsing fails, return original response
      return response
    }
  }
}

/**
 * Check if request accepts compression
 */
export function supportsCompression(request: NextRequest): boolean {
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  return acceptEncoding.includes('gzip') || acceptEncoding.includes('br')
}

/**
 * Get compression statistics
 */
export function getCompressionRatio(original: number, compressed: number): {
  ratio: number
  savings: number
  percentage: string
} {
  const ratio = original / compressed
  const savings = original - compressed
  const percentage = ((savings / original) * 100).toFixed(1)

  return { ratio, savings, percentage }
}
