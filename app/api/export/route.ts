import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/db'
import { User, Appointment, MedicalRecord, Vaccination } from '@/lib/models'
import { 
  generateCSV, 
  formatAppointmentsForExport, 
  formatMedicalRecordsForExport, 
  formatVaccinationsForExport,
  generateHealthSummary 
} from '@/lib/export-utils'

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

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'appointments', 'records', 'vaccinations', 'summary'
    const format = searchParams.get('format') || 'csv' // 'csv' or 'txt'

    // Fetch user data
    const userData = await User.findById(user.userId).select('-password').lean()
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let content: string
    let filename: string
    let contentType: string

    switch (type) {
      case 'appointments': {
        const appointments = await Appointment.find({ userId: user.userId }).sort({ date: -1 }).lean()
        const formatted = formatAppointmentsForExport(appointments)
        content = generateCSV(formatted, Object.keys(formatted[0] || {}))
        filename = `appointments_${new Date().toISOString().split('T')[0]}.csv`
        contentType = 'text/csv'
        break
      }

      case 'records': {
        const records = await MedicalRecord.find({ userId: user.userId }).sort({ date: -1 }).lean()
        const formatted = formatMedicalRecordsForExport(records)
        content = generateCSV(formatted, Object.keys(formatted[0] || {}))
        filename = `medical_records_${new Date().toISOString().split('T')[0]}.csv`
        contentType = 'text/csv'
        break
      }

      case 'vaccinations': {
        const vaccinations = await Vaccination.find({ userId: user.userId }).sort({ date: -1 }).lean()
        const formatted = formatVaccinationsForExport(vaccinations)
        content = generateCSV(formatted, Object.keys(formatted[0] || {}))
        filename = `vaccinations_${new Date().toISOString().split('T')[0]}.csv`
        contentType = 'text/csv'
        break
      }

      case 'summary': {
        const [appointments, records, vaccinations] = await Promise.all([
          Appointment.find({ userId: user.userId }).sort({ date: -1 }).lean(),
          MedicalRecord.find({ userId: user.userId }).sort({ date: -1 }).lean(),
          Vaccination.find({ userId: user.userId }).sort({ date: -1 }).lean()
        ])

        content = generateHealthSummary({
          user: {
            ...userData,
            registeredDate: userData.createdAt
          },
          appointments,
          records,
          vaccinations
        })
        filename = `health_summary_${new Date().toISOString().split('T')[0]}.txt`
        contentType = 'text/plain'
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed', details: error.message },
      { status: 500 }
    )
  }
}
