import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/db'
import { User } from '@/lib/models'
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

// GET - Fetch all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const verified = searchParams.get('verified')
    const search = searchParams.get('search')
    
    // Build query
    const query: any = {}
    
    if (role) query.role = role
    if (verified !== null) query.verified = verified === 'true'
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }
    
    const users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .lean()

    // Log audit
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logAudit({
      userId: user.userId,
      action: 'read',
      resource: 'users',
      details: {
        method: 'GET',
        endpoint: '/api/admin/users',
        query: { role, verified, search },
        count: users.length
      },
      ipAddress,
      userAgent,
      complianceCategory: 'phi_access',
      severity: 'info',
    })

    return NextResponse.json({ 
      success: true, 
      users,
      count: users.length
    })

  } catch (error: any) {
    console.error('Fetch users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update user (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    
    const body = await request.json()
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Prevent password updates through this endpoint
    delete updates.password

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, select: '-password -__v' }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log audit
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logAudit({
      userId: user.userId,
      action: 'update',
      resource: 'users',
      resourceId: userId,
      details: {
        method: 'PATCH',
        endpoint: '/api/admin/users',
        changes: updates
      },
      ipAddress,
      userAgent,
      complianceCategory: 'data_modification',
      severity: 'warning',
    })

    return NextResponse.json({ success: true, user: updatedUser })

  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (userId === user.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const deletedUser = await User.findByIdAndDelete(userId)

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log audit
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logAudit({
      userId: user.userId,
      action: 'delete',
      resource: 'users',
      resourceId: userId,
      details: {
        method: 'DELETE',
        endpoint: '/api/admin/users',
        deletedEmail: deletedUser.email
      },
      ipAddress,
      userAgent,
      complianceCategory: 'data_modification',
      severity: 'critical',
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    })

  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    )
  }
}
