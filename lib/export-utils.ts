// Data export utilities for CSV and PDF generation

export function generateCSV(data: any[], headers: string[]): string {
  const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) return ''
    const str = String(field)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerRow = headers.join(',')
  const dataRows = data.map(row =>
    headers.map(header => escapeCSV(row[header])).join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Format appointments for export
export function formatAppointmentsForExport(appointments: any[]) {
  return appointments.map(apt => ({
    Doctor: apt.doctorName,
    Specialty: apt.specialty,
    Date: new Date(apt.date).toLocaleDateString(),
    Time: apt.time,
    Location: apt.location || 'N/A',
    Status: apt.status,
    Phone: apt.phone || 'N/A',
    Notes: apt.notes || 'N/A'
  }))
}

// Format medical records for export
export function formatMedicalRecordsForExport(records: any[]) {
  return records.map(rec => ({
    Title: rec.title,
    Type: rec.type,
    Date: new Date(rec.date).toLocaleDateString(),
    Provider: rec.provider,
    Description: rec.description || 'N/A',
    FileSize: rec.fileSize || 'N/A',
    Confidential: rec.confidential ? 'Yes' : 'No'
  }))
}

// Format vaccinations for export
export function formatVaccinationsForExport(vaccinations: any[]) {
  return vaccinations.map(vac => ({
    Vaccine: vac.vaccineName || vac.name,
    Date: new Date(vac.date).toLocaleDateString(),
    Provider: vac.provider,
    BatchNumber: vac.batchNumber || 'N/A',
    NextDue: vac.nextDueDate || vac.nextDue ? new Date(vac.nextDueDate || vac.nextDue).toLocaleDateString() : 'N/A',
    Status: vac.status,
    Notes: vac.notes || 'N/A'
  }))
}

// Generate health summary report
export function generateHealthSummary(data: {
  user: any
  appointments: any[]
  records: any[]
  vaccinations: any[]
}): string {
  const { user, appointments, records, vaccinations } = data
  
  const lines = [
    '='.repeat(80),
    'HEALTH PORTAL - MEDICAL SUMMARY REPORT',
    '='.repeat(80),
    '',
    'Patient Information:',
    '-'.repeat(80),
    `Name: ${user.firstName} ${user.lastName}`,
    `Date of Birth: ${user.dateOfBirth}`,
    `Blood Type: ${user.bloodType}`,
    `Email: ${user.email}`,
    `Phone: ${user.phone}`,
    `Address: ${user.address}, ${user.city}, ${user.state} ${user.zipCode}`,
    `Emergency Contact: ${user.emergencyContact}`,
    `Member Since: ${new Date(user.registeredDate).toLocaleDateString()}`,
    '',
    '='.repeat(80),
    'SUMMARY STATISTICS',
    '='.repeat(80),
    `Total Appointments: ${appointments.length}`,
    `Upcoming Appointments: ${appointments.filter((a: any) => new Date(a.date) > new Date() && a.status === 'scheduled').length}`,
    `Medical Records: ${records.length}`,
    `Vaccinations: ${vaccinations.length}`,
    '',
    '='.repeat(80),
    'RECENT APPOINTMENTS',
    '='.repeat(80),
    ''
  ]

  const recentAppointments = appointments.slice(0, 5)
  if (recentAppointments.length === 0) {
    lines.push('No appointments recorded.')
  } else {
    recentAppointments.forEach((apt: any) => {
      lines.push(`- ${apt.doctorName} (${apt.specialty})`)
      lines.push(`  Date: ${new Date(apt.date).toLocaleDateString()} at ${apt.time}`)
      lines.push(`  Status: ${apt.status}`)
      if (apt.location) lines.push(`  Location: ${apt.location}`)
      lines.push('')
    })
  }

  lines.push('='.repeat(80))
  lines.push('RECENT MEDICAL RECORDS')
  lines.push('='.repeat(80))
  lines.push('')

  const recentRecords = records.slice(0, 5)
  if (recentRecords.length === 0) {
    lines.push('No medical records.')
  } else {
    recentRecords.forEach((rec: any) => {
      lines.push(`- ${rec.title} (${rec.type})`)
      lines.push(`  Date: ${new Date(rec.date).toLocaleDateString()}`)
      lines.push(`  Provider: ${rec.provider}`)
      if (rec.description) lines.push(`  Notes: ${rec.description}`)
      lines.push('')
    })
  }

  lines.push('='.repeat(80))
  lines.push('VACCINATION HISTORY')
  lines.push('='.repeat(80))
  lines.push('')

  if (vaccinations.length === 0) {
    lines.push('No vaccinations recorded.')
  } else {
    vaccinations.forEach((vac: any) => {
      lines.push(`- ${vac.vaccineName || vac.name}`)
      lines.push(`  Date: ${new Date(vac.date).toLocaleDateString()}`)
      lines.push(`  Provider: ${vac.provider}`)
      if (vac.nextDueDate || vac.nextDue) {
        lines.push(`  Next Due: ${new Date(vac.nextDueDate || vac.nextDue).toLocaleDateString()}`)
      }
      lines.push('')
    })
  }

  lines.push('='.repeat(80))
  lines.push(`Report Generated: ${new Date().toLocaleString()}`)
  lines.push('='.repeat(80))

  return lines.join('\n')
}
