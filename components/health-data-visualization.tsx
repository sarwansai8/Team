'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, Activity, TrendingUp } from 'lucide-react'

interface HealthDataVisualizationProps {
  appointments?: any[]
  records?: any[]
  vaccinations?: any[]
}

export function HealthDataVisualization({
  appointments = [],
  records = [],
  vaccinations = [],
}: HealthDataVisualizationProps) {
  
  // Prepare appointment trend data (last 6 months)
  const appointmentTrend = prepareAppointmentTrend(appointments)
  
  // Prepare medical records by type
  const recordsByType = prepareRecordsByType(records)
  
  // Prepare vaccination timeline
  const vaccinationTimeline = prepareVaccinationTimeline(vaccinations)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  return (
    <div className="space-y-6">
      {/* Appointment Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Trend
          </CardTitle>
          <CardDescription>Your appointments over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={appointmentTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Appointments"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Medical Records by Type */}
      {recordsByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Medical Records by Type
            </CardTitle>
            <CardDescription>Distribution of your medical records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={recordsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {recordsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col justify-center space-y-2">
                {recordsByType.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">
                      {item.name}: <span className="font-semibold">{item.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vaccination Timeline */}
      {vaccinationTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vaccination Timeline
            </CardTitle>
            <CardDescription>Your vaccination history</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vaccinationTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="Vaccinations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions
function prepareAppointmentTrend(appointments: any[]) {
  const months = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleString('default', { month: 'short' })
    const count = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate.getMonth() === date.getMonth() && 
             aptDate.getFullYear() === date.getFullYear()
    }).length
    
    months.push({ month: monthName, count })
  }
  
  return months
}

function prepareRecordsByType(records: any[]) {
  const typeCounts: Record<string, number> = {}
  
  records.forEach(record => {
    const type = record.type || 'other'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  
  return Object.entries(typeCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))
}

function prepareVaccinationTimeline(vaccinations: any[]) {
  const yearCounts: Record<string, number> = {}
  
  vaccinations.forEach(vac => {
    const year = new Date(vac.date).getFullYear().toString()
    yearCounts[year] = (yearCounts[year] || 0) + 1
  })
  
  return Object.entries(yearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year))
    .slice(-5) // Last 5 years
}
