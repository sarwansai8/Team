import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/db'
import { User, Appointment, MedicalRecord, Vaccination, SecurityEvent } from '@/lib/models'
import { AuditLog } from '@/lib/audit-logger'
import mongoose from 'mongoose'

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

// GET - System analytics (Admin only)
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
    const type = searchParams.get('type') || 'overview' // overview, users, appointments, security

    if (type === 'overview') {
      // Parallel queries for better performance
      const [
        totalUsers,
        totalAppointments,
        totalRecords,
        totalVaccinations,
        totalSecurityEvents,
        totalAuditLogs,
        recentUsers,
        upcomingAppointments,
        criticalSecurityEvents
      ] = await Promise.all([
        User.countDocuments(),
        Appointment.countDocuments(),
        MedicalRecord.countDocuments(),
        Vaccination.countDocuments(),
        SecurityEvent.countDocuments(),
        AuditLog.countDocuments(),
        User.countDocuments({ 
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        }),
        Appointment.countDocuments({ 
          date: { $gte: new Date() },
          status: 'scheduled' 
        }),
        SecurityEvent.countDocuments({ 
          severity: { $in: ['high', 'critical'] } 
        })
      ])

      return NextResponse.json({
        success: true,
        overview: {
          totalUsers,
          totalAppointments,
          totalRecords,
          totalVaccinations,
          totalSecurityEvents,
          totalAuditLogs,
          recentUsers,
          upcomingAppointments,
          criticalSecurityEvents
        }
      })
    }

    if (type === 'users') {
      // User growth over time
      const usersByDay = await User.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ])

      // Users by role
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])

      // Verified vs unverified
      const usersByVerification = await User.aggregate([
        {
          $group: {
            _id: '$verified',
            count: { $sum: 1 }
          }
        }
      ])

      return NextResponse.json({
        success: true,
        users: {
          growth: usersByDay,
          byRole: usersByRole,
          byVerification: usersByVerification
        }
      })
    }

    if (type === 'appointments') {
      // Appointments by status
      const appointmentsByStatus = await Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])

      // Appointments by specialty
      const appointmentsBySpecialty = await Appointment.aggregate([
        {
          $group: {
            _id: '$specialty',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])

      // Appointments over time (last 30 days)
      const appointmentsByDay = await Appointment.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])

      return NextResponse.json({
        success: true,
        appointments: {
          byStatus: appointmentsByStatus,
          bySpecialty: appointmentsBySpecialty,
          trend: appointmentsByDay
        }
      })
    }

    if (type === 'security') {
      // Security events by type
      const eventsByType = await SecurityEvent.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])

      // Events by severity
      const eventsBySeverity = await SecurityEvent.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ])

      // Recent critical events
      const recentCritical = await SecurityEvent.find({
        severity: { $in: ['high', 'critical'] }
      })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean()

      // Events over time (last 7 days)
      const eventsByDay = await SecurityEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])

      return NextResponse.json({
        success: true,
        security: {
          byType: eventsByType,
          bySeverity: eventsBySeverity,
          recentCritical,
          trend: eventsByDay
        }
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })

  } catch (error: any) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}
