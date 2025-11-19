'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Honeypot } from '@/components/honeypot'
import { getSecurityMonitor } from '@/lib/security-monitor'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male' as const,
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bloodType: 'O+',
    emergencyContact: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [honeypotTriggered, setHoneypotTriggered] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const { register } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const monitor = getSecurityMonitor()
      monitor.logEvent('login_attempt', 'low', 'User visited registration page')
    }
  }, [])

  const handleHoneypotTrigger = (suspicionScore: number) => {
    // Only block if suspicion score is very high (75%+)
    if (suspicionScore >= 75) {
      setHoneypotTriggered(true)
      console.warn('🚨 Honeypot triggered on registration! Score:', suspicionScore)
    } else {
      // Just log it but don't block
      console.log('⚠️ Low suspicion score:', suspicionScore)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Real-time password validation
    if (name === 'password') {
      validatePassword(value)
    }
  }

  const validatePassword = (password: string) => {
    const errors: string[] = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character (!@#$%^&*)')
    setPasswordErrors(errors)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // Check password strength before submitting
      if (passwordErrors.length > 0) {
        throw new Error(`Password requirements not met: ${passwordErrors.join(', ')}`)
      }

      const { confirmPassword, ...profileData } = formData
      await register(formData.email, formData.password, profileData as any)
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      console.error('Registration error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-md">
        <CardHeader className="border-b border-border pb-6">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Register to access HealthGov services</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot fields - invisible to users */}
            <Honeypot onTrigger={handleHoneypotTrigger} />

            {/* Personal Information Section */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xs bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center">1</span>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="border-border"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(val) => handleSelectChange('gender', val)}>
                    <SelectTrigger className="border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType" className="text-sm font-medium">Blood Type</Label>
                  <Select value={formData.bloodType} onValueChange={(val) => handleSelectChange('bloodType', val)}>
                    <SelectTrigger className="border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="border-border"
                  />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xs bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center">2</span>
                Address Information
              </h3>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="address" className="text-sm font-medium">Street Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="border-border"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-medium">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 12345 or ABC123"
                    className="border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-sm font-medium">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  required
                  className="border-border"
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xs bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center">3</span>
                Security
              </h3>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="border-border"
                />
                <div className="text-xs space-y-1 mt-2">
                  <p className="font-medium text-foreground">Password must contain:</p>
                  <ul className="space-y-0.5 ml-4">
                    <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                      {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-muted-foreground'}>
                      {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-muted-foreground'}>
                      {/[a-z]/.test(formData.password) ? '✓' : '○'} One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-muted-foreground'}>
                      {/[0-9]/.test(formData.password) ? '✓' : '○'} One number
                    </li>
                    <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : 'text-muted-foreground'}>
                      {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '○'} One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="border-border"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Alert className="border-primary/30 bg-primary/5">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                Your information is protected under HIPAA regulations and encrypted with government-grade security.
              </AlertDescription>
            </Alert>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-semibold">
                Sign in here
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
