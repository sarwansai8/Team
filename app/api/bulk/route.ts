import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/db'
import { Appointment, MedicalRecord, Vaccination } from '@/lib/models'
import { apiRateLimit } from '@/lib/rate-limit'
import { invalidateUserCache } from '@/lib/cache'
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

// POST - Bulk operations (delete, export, update)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await apiRateLimit(clientIp)
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

    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const body = await request.json()
    const { operation, resource, ids } = body

    // Validate input
    if (!operation || !resource || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Required: operation, resource, ids[]' },
        { status: 400 }
      )
    }

    // Limit bulk operations to 100 items
    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Bulk operation limited to 100 items at a time' },
        { status: 400 }
      )
    }

    // Get model based on resource
    let Model: any
    switch (resource) {
      case 'appointments':
        Model = Appointment
        break
      case 'medical-records':
        Model = MedicalRecord
        break
      case 'vaccinations':
        Model = Vaccination
        break
      default:
        return NextResponse.json(
          { error: 'Invalid resource. Must be: appointments, medical-records, or vaccinations' },
          { status: 400 }
        )
    }

    let result: any = {}

    // Handle different operations
    switch (operation) {
      case 'delete': {
        const deleteResult = await Model.deleteMany({
          _id: { $in: ids },
          userId: user.userId, // Security: only delete user's own data
        })

        result = {
          operation: 'delete',
          resource,
          deleted: deleteResult.deletedCount,
          requested: ids.length,
        }

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'delete',
          resource,
          details: {
            method: 'POST',
            endpoint: '/api/bulk',
            bulk: true,
            count: deleteResult.deletedCount,
          },
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          complianceCategory: 'data_modification',
          severity: 'warning',
        })

        // Invalidate cache
        invalidateUserCache(user.userId)
        break
      }

      case 'export': {
        const items = await Model.find({
          _id: { $in: ids },
          userId: user.userId,
        })
          .select('-__v')
          .lean()

        result = {
          operation: 'export',
          resource,
          count: items.length,
          data: items,
        }

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'export',
          resource,
          details: {
            method: 'POST',
            endpoint: '/api/bulk',
            bulk: true,
            count: items.length,
          },
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          complianceCategory: 'export',
          severity: 'info',
        })

        break
      }

      case 'update': {
        const { updates } = body

        if (!updates || typeof updates !== 'object') {
          return NextResponse.json(
            { error: 'Updates object required for bulk update' },
            { status: 400 }
          )
        }

        const updateResult = await Model.updateMany(
          {
            _id: { $in: ids },
            userId: user.userId,
          },
          { $set: updates }
        )

        result = {
          operation: 'update',
          resource,
          modified: updateResult.modifiedCount,
          requested: ids.length,
        }

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'update',
          resource,
          details: {
            method: 'POST',
            endpoint: '/api/bulk',
            bulk: true,
            count: updateResult.modifiedCount,
            changes: updates,
          },
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          complianceCategory: 'data_modification',
          severity: 'info',
        })

        // Invalidate cache
        invalidateUserCache(user.userId)
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Must be: delete, export, or update' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      ...result,
    })

  } catch (error: any) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: 'Bulk operation failed', details: error.message },
      { status: 500 }
    )
  }
}
