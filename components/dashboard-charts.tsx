'use client'

import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Activity, Heart, Calendar } from 'lucide-react'

const appointmentData = [
  { month: 'Jun', count: 2 },
  { month: 'Jul', count: 3 },
  { month: 'Aug', count: 1 },
  { month: 'Sep', count: 4 },
  { month: 'Oct', count: 2 },
  { month: 'Nov', count: 3 },
]

const healthMetricsData = [
  { week: 'Week 1', bloodPressure: 120, heartRate: 72 },
  { week: 'Week 2', bloodPressure: 118, heartRate: 70 },
  { week: 'Week 3', bloodPressure: 122, heartRate: 75 },
  { week: 'Week 4', bloodPressure: 119, heartRate: 71 },
]

const vaccinationData = [
  { name: 'Completed', value: 8, color: 'hsl(var(--secondary))' },
  { name: 'Pending', value: 2, color: 'hsl(var(--muted))' },
]

const recordTypeData = [
  { type: 'Lab Tests', count: 12 },
  { type: 'Prescriptions', count: 8 },
  { type: 'Imaging', count: 4 },
  { type: 'Diagnoses', count: 6 },
]

export function AppointmentTrendChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Appointment Trends
        </CardTitle>
        <CardDescription>Your appointments over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={appointmentData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1} 
              fill="url(#colorCount)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function HealthMetricsChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-secondary" />
          Health Metrics
        </CardTitle>
        <CardDescription>Blood pressure and heart rate trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={healthMetricsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="bloodPressure" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--secondary))', r: 4 }}
              name="Blood Pressure (mmHg)"
            />
            <Line 
              type="monotone" 
              dataKey="heartRate" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--accent))', r: 4 }}
              name="Heart Rate (bpm)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function VaccinationProgress() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-accent" />
          Vaccination Status
        </CardTitle>
        <CardDescription>Your immunization completion</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={vaccinationData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {vaccinationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold text-foreground">80%</span>
          <span className="text-xs text-muted-foreground">Complete</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function RecordTypesChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Medical Records
        </CardTitle>
        <CardDescription>Records by type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={recordTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
