'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Search, Filter, Bookmark, Share2, TrendingUp, Info, Clock, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { toast } from 'sonner'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { EmptyState } from '@/components/ui/empty-state'

interface HealthUpdate {
  id: string
  title: string
  summary: string
  content: string
  category: 'advisory' | 'prevention' | 'research' | 'outbreak' | 'vaccination'
  severity: 'critical' | 'high' | 'medium' | 'low'
  publishedDate: string
  views: number
  savedCount: number
  region: string
}

export default function HealthUpdatesPage() {
  const [updates, setUpdates] = useState<HealthUpdate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [savedUpdates, setSavedUpdates] = useState<string[]>([])

  useEffect(() => {
    // Load saved updates from localStorage
    const saved = localStorage.getItem('savedHealthUpdates')
    if (saved) {
      setSavedUpdates(JSON.parse(saved))
    }

    // Load or create health updates
    const stored = localStorage.getItem('portalHealthUpdates')
    if (stored) {
      setUpdates(JSON.parse(stored))
    } else {
      const samples: HealthUpdate[] = [
        {
          id: 'update_1',
          title: 'Flu Season 2025: Prevention and Vaccination Guide',
          summary: 'As flu season approaches, health officials recommend vaccination for all individuals over 6 months old.',
          content: 'The 2025 flu season is expected to be moderate. The CDC recommends annual influenza vaccination for everyone 6 months and older. Vaccination can reduce flu illness, hospitalization, and death.',
          category: 'prevention',
          severity: 'high',
          publishedDate: '2025-11-15',
          views: 5230,
          savedCount: 342,
          region: 'National'
        },
        {
          id: 'update_2',
          title: 'Important: Blood Pressure Screening Available',
          summary: 'Free community health screening event scheduled for next week at all regional health centers.',
          content: 'The National Health Portal is offering free blood pressure and basic health screenings. These screenings are important for early detection of hypertension and cardiovascular diseases.',
          category: 'advisory',
          severity: 'medium',
          publishedDate: '2025-11-14',
          views: 3120,
          savedCount: 215,
          region: 'Regional'
        },
        {
          id: 'update_3',
          title: 'New COVID-19 Variant Detected: What You Should Know',
          summary: 'Health authorities confirm detection of new COVID-19 variant. Updated vaccination strategy in place.',
          content: 'A new COVID-19 variant has been detected. Preliminary data suggests currently available vaccines remain effective. Boosters are recommended for eligible populations.',
          category: 'outbreak',
          severity: 'high',
          publishedDate: '2025-11-13',
          views: 8945,
          savedCount: 567,
          region: 'National'
        },
        {
          id: 'update_4',
          title: 'Research: Mediterranean Diet Benefits for Heart Health',
          summary: 'New study confirms Mediterranean diet reduces cardiovascular disease risk by 30%.',
          content: 'Recent research published in the Journal of Medical Sciences demonstrates that adherence to a Mediterranean diet pattern is associated with a 30% reduction in cardiovascular disease risk over 10 years.',
          category: 'research',
          severity: 'low',
          publishedDate: '2025-11-12',
          views: 4560,
          savedCount: 289,
          region: 'International'
        },
        {
          id: 'update_5',
          title: 'RSV Vaccine Now Available for Eligible Adults',
          summary: 'CDC approves new RSV vaccine for adults 60 and older. Protect yourself and your loved ones.',
          content: 'The CDC has approved a new respiratory syncytial virus (RSV) vaccine for adults aged 60 and older. This vaccine offers protection against RSV, which can cause severe respiratory illness in older adults.',
          category: 'vaccination',
          severity: 'medium',
          publishedDate: '2025-11-11',
          views: 2340,
          savedCount: 178,
          region: 'National'
        },
        {
          id: 'update_6',
          title: 'Heat-Related Illness Prevention Tips',
          summary: 'As temperatures rise, learn how to protect yourself from heat exhaustion and heat stroke.',
          content: 'During periods of extreme heat, it is important to stay hydrated, avoid prolonged sun exposure, and check on elderly neighbors and friends. Signs of heat exhaustion include heavy sweating, weakness, and dizziness.',
          category: 'prevention',
          severity: 'medium',
          publishedDate: '2025-11-10',
          views: 1890,
          savedCount: 112,
          region: 'Regional'
        }
      ]
      setUpdates(samples)
      localStorage.setItem('portalHealthUpdates', JSON.stringify(samples))
    }
  }, [])

  const toggleSaveUpdate = (id: string) => {
    const isSaved = savedUpdates.includes(id)
    const updated = isSaved
      ? savedUpdates.filter(uid => uid !== id)
      : [...savedUpdates, id]
    
    setSavedUpdates(updated)
    localStorage.setItem('savedHealthUpdates', JSON.stringify(updated))

    // Update view count
    const updatedUpdates = updates.map(u =>
      u.id === id && !savedUpdates.includes(id)
        ? { ...u, savedCount: u.savedCount + 1 }
        : u
    )
    setUpdates(updatedUpdates)
    
    // Show toast notification
    if (isSaved) {
      toast.info('Update removed from saved items')
    } else {
      toast.success('Update saved!', { description: 'You can find it in your saved health updates.' })
    }
  }

  const filteredUpdates = updates.filter(update => {
    const matchesSearch = update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.summary.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || update.category === filterCategory
    const matchesSeverity = filterSeverity === 'all' || update.severity === filterSeverity
    return matchesSearch && matchesCategory && matchesSeverity
  })

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-destructive text-destructive-foreground',
      high: 'bg-accent text-accent-foreground',
      medium: 'bg-primary text-primary-foreground',
      low: 'bg-secondary text-secondary-foreground'
    }
    return variants[severity] || variants.low
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      advisory: 'bg-blue-500/10 text-blue-600',
      prevention: 'bg-green-500/10 text-green-600',
      research: 'bg-purple-500/10 text-purple-600',
      outbreak: 'bg-red-500/10 text-red-600',
      vaccination: 'bg-cyan-500/10 text-cyan-600'
    }
    return colors[category] || colors.advisory
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      advisory: 'Advisory',
      prevention: 'Prevention',
      research: 'Research',
      outbreak: 'Outbreak',
      vaccination: 'Vaccination'
    }
    return labels[category] || 'Other'
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Health Updates' }]} />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Updates & Advisories</h1>
        <p className="text-muted-foreground mt-1">Official health information and guidance from government health agencies</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search health updates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <Filter className="w-4 h-4 text-muted-foreground md:mt-2" />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="advisory">Advisory</SelectItem>
              <SelectItem value="prevention">Prevention</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="outbreak">Outbreak</SelectItem>
              <SelectItem value="vaccination">Vaccination</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Featured Critical Alerts */}
      {updates.some(u => u.severity === 'critical') && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-destructive">Critical Health Alert</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There are critical health alerts that require your immediate attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Updates List */}
      {filteredUpdates.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No updates found"
          description="No health updates match your current search and filter criteria. Try adjusting your filters or search term."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchTerm('')
              setFilterCategory('all')
              setFilterSeverity('all')
              toast.success('Filters cleared')
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredUpdates.map(update => (
            <Card key={update.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-foreground line-clamp-2">{update.title}</h3>
                        <Badge className={getSeverityBadge(update.severity)} variant="default">
                          {update.severity.charAt(0).toUpperCase() + update.severity.slice(1)}
                        </Badge>
                      </div>
                      <Badge className={`${getCategoryColor(update.category)} mt-2`} variant="outline">
                        {getCategoryLabel(update.category)}
                      </Badge>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-muted-foreground line-clamp-2">{update.summary}</p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(update.publishedDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {update.views.toLocaleString()} views
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {update.region}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
                      <Link href="#">Read Full Article</Link>
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSaveUpdate(update.id)}
                        className={savedUpdates.includes(update.id) ? 'text-accent' : ''}
                      >
                        <Bookmark className={`w-4 h-4 ${savedUpdates.includes(update.id) ? 'fill-accent' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Saved Updates Summary */}
      {savedUpdates.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm">
              <span className="font-semibold text-primary">{savedUpdates.length}</span> update{savedUpdates.length !== 1 ? 's' : ''} saved for later reading.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
