'use client'

import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Heart, LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export function Navigation() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/medical-records', label: 'Records' },
    { href: '/vaccinations', label: 'Vaccinations' },
    { href: '/health-updates', label: 'Updates' },
    { href: '/profile', label: 'Profile' }
  ]

  return (
    <nav className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-lg" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg" aria-label="Health Portal home">
            <Heart className="w-6 h-6" aria-hidden="true" />
            <span>Health Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1" role="menubar" aria-label="Main menu">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary-foreground/20'
                    : 'hover:bg-primary-foreground/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm" aria-label="User information">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs opacity-75">{user.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden pb-4 space-y-2" role="menu" aria-label="Mobile menu">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                aria-current={pathname === link.href ? 'page' : undefined}
                className="block px-3 py-2 rounded-md text-sm hover:bg-primary-foreground/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/20"
              role="menuitem"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
