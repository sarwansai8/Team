'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, MapPin, Phone, AlertTriangle, ShieldCheck, BookOpen, CheckCircle2, ArrowRight, Menu, X, Calendar, Heart } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top government banner */}
      <div className="bg-muted/50 border-b border-border px-4 py-2 text-center text-xs text-muted-foreground">
        <span className="font-semibold">🇺🇸</span> An official website of the United States Government
      </div>

      {/* Header Navigation - Government Style */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">+</span>
              </div>
              <div>
                <div className="font-bold text-primary text-lg">HealthGov</div>
                <div className="text-xs text-muted-foreground">Federal Health Services</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Services
              </a>
              <a href="#health-topics" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Health Topics
              </a>
              <a href="#news" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                News
              </a>
              <a href="#faq" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                FAQs
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/5">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary text-white hover:bg-primary/90">
                <Link href="/auth/register">Register</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-4 border-t border-border pt-4">
              <a href="#services" className="block text-sm font-medium text-foreground hover:text-primary">
                Services
              </a>
              <a href="#health-topics" className="block text-sm font-medium text-foreground hover:text-primary">
                Health Topics
              </a>
              <a href="#news" className="block text-sm font-medium text-foreground hover:text-primary">
                News
              </a>
              <a href="#faq" className="block text-sm font-medium text-foreground hover:text-primary">
                FAQs
              </a>
              <div className="pt-4 border-t border-border flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="flex-1 bg-primary text-white">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary text-white py-16 md:py-24 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/20">
                <ShieldCheck className="w-4 h-4" />
                <span>Secure & HIPAA Compliant</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your Health, <br />
                <span className="text-secondary-foreground">Digitally Empowered</span>
              </h1>
              <p className="text-lg text-white/90 max-w-xl">
                Access your complete medical records, schedule appointments, and manage your healthcare journey—all in one secure government portal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-xl btn-lift">
                  <Link href="/auth/register">
                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm btn-lift">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary-foreground" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary-foreground" />
                  <span>24/7 access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary-foreground" />
                  <span>Secure data</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block animate-slide-in-right">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-3xl transform rotate-6"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
                      <div className="p-3 bg-primary rounded-lg">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Next Appointment</p>
                        <p className="text-sm text-muted-foreground">Dr. Smith - Nov 20, 2:00 PM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-secondary/5 to-accent/5 rounded-xl">
                      <div className="p-3 bg-secondary rounded-lg">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Vaccinations</p>
                        <p className="text-sm text-muted-foreground">All up to date ✓</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl">
                      <div className="p-3 bg-accent rounded-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Medical Records</p>
                        <p className="text-sm text-muted-foreground">12 records available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links - Government Style */}
      <section id="services" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Popular Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Access Your Health Record',
                description: 'View your complete medical history, test results, and prescriptions',
                icon: ShieldCheck,
                link: '/medical-records'
              },
              {
                title: 'Schedule an Appointment',
                description: 'Find and book appointments with authorized healthcare providers',
                icon: Clock,
                link: '/appointments'
              },
              {
                title: 'Vaccination Records',
                description: 'View and manage your complete vaccination history',
                icon: CheckCircle2,
                link: '/vaccinations'
              },
              {
                title: 'Find Healthcare Providers',
                description: 'Search for hospitals, clinics, and healthcare professionals',
                icon: MapPin,
                link: '/appointments'
              }
            ].map((service, idx) => {
              const Icon = service.icon
              return (
                <Link key={idx} href={service.link}>
                  <Card className="h-full border-border/50 hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {service.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {service.description}
                          </CardDescription>
                        </div>
                        <Icon className="w-6 h-6 text-primary flex-shrink-0 ml-4" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Health Topics - Featured Content */}
      <section id="health-topics" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Health A to Z</h2>
          <p className="text-muted-foreground mb-8">
            Find health topics, diseases, conditions, and more.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
            {['Allergies', 'Diabetes', 'Heart Disease', 'Infections', 'Mental Health', 'Cancer', 'Vaccines', 'Nutrition'].map((topic) => (
              <button
                key={topic}
                className="px-4 py-2 border-2 border-primary text-primary font-medium rounded hover:bg-primary hover:text-white transition-colors text-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section id="news" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Latest Updates</h2>
            <Button variant="outline" asChild>
              <Link href="/health-updates">View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>

          <div className="space-y-4">
            {[
              {
                date: 'November 15, 2025',
                title: 'Flu Vaccination Clinics Now Available',
                category: 'Health Advisory',
                badge: 'Important'
              },
              {
                date: 'November 14, 2025',
                title: 'COVID-19 Updated Booster Recommendations',
                category: 'Vaccination',
                badge: 'Alert'
              },
              {
                date: 'November 13, 2025',
                title: 'System Maintenance Schedule',
                category: 'Update',
                badge: 'Notice'
              }
            ].map((news, idx) => (
              <Link key={idx} href="/health-updates">
                <Card className="border-border/50 hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground font-medium mb-1">{news.date}</div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {news.title}
                        </CardTitle>
                        <div className="flex gap-2 mt-3">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {news.category}
                          </span>
                          <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded font-semibold">
                            {news.badge}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'How do I register for an account?',
                a: 'Click "Register" at the top and provide your personal information. You will receive a verification email.'
              },
              {
                q: 'Is my health information secure?',
                a: 'Yes, we use government-grade encryption and comply with all HIPAA regulations to protect your data.'
              },
              {
                q: 'How can I schedule an appointment?',
                a: 'Log in to your account, go to Appointments, and select from available healthcare providers.'
              },
              {
                q: 'What if I forget my password?',
                a: 'Click "Forgot Password" on the login page and follow the instructions sent to your email.'
              }
            ].map((faq, idx) => (
              <Card key={idx} className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-border p-8 md:p-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">Need Help?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex gap-4">
                <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">Call Us</h3>
                  <p className="text-muted-foreground">9030118006</p>
                  <p className="text-xs text-muted-foreground mt-1">Monday–Friday, 8am–6pm ET</p>
                </div>
              </div>
              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">Visit Us</h3>
                  <p className="text-muted-foreground text-sm">KLU, Greenfields, Kunchanapalli Post</p>
                  <p className="text-muted-foreground text-sm">Vaddeswaram, Tadepalli, Guntur</p>
                  <p className="text-muted-foreground text-sm">Andhra Pradesh, India - 522502</p>
                  <a href="https://maps.google.com/?q=KLU+Vaddeswaram" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">View on Map</a>
                </div>
              </div>
              <div className="flex gap-4">
                <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">Emergency</h3>
                  <p className="text-muted-foreground">Call 911</p>
                  <p className="text-xs text-muted-foreground mt-1">For life-threatening emergencies only</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">About</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="/dashboard" className="hover:opacity-100">About Us</a></li>
                <li><a href="/dashboard" className="hover:opacity-100">Careers</a></li>
                <li><a href="/dashboard" className="hover:opacity-100">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="/medical-records" className="hover:opacity-100">My Health Record</a></li>
                <li><a href="/appointments" className="hover:opacity-100">Appointments</a></li>
                <li><a href="/vaccinations" className="hover:opacity-100">Vaccinations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="/dashboard" className="hover:opacity-100">Help Center</a></li>
                <li><a href="#faq" className="hover:opacity-100">FAQs</a></li>
                <li><a href="/dashboard" className="hover:opacity-100">Contact Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="/dashboard" className="hover:opacity-100">Privacy Policy</a></li>
                <li><a href="/dashboard" className="hover:opacity-100">Terms of Use</a></li>
                <li><a href="/dashboard" className="hover:opacity-100">Accessibility</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">More</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="/dashboard" className="hover:opacity-100">Sitemap</a></li>
                <li><a href="#" className="hover:opacity-100">No Fear Act</a></li>
                <li><a href="#" className="hover:opacity-100">Vulnerability Disclosure</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-foreground/20 pt-8">
            <p className="text-sm opacity-75 text-center">
              © 2025 HealthGov - Federal Government Healthcare Portal. Built for citizens by the U.S. Department of Health and Human Services.
            </p>
            <p className="text-xs opacity-50 text-center mt-2">
              This is an official U.S. government website. Learn more at <a href="#" className="underline hover:opacity-100">USA.gov</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
