'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

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

export default function AdminHealthUpdatesPage() {
  const [updates, setUpdates] = useState<HealthUpdate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'advisory' as const,
    severity: 'high' as const,
    region: 'National'
  })

  useEffect(() => {
    const stored = localStorage.getItem('portalHealthUpdates')
    if (stored) {
      setUpdates(JSON.parse(stored))
    }
  }, [])

  const handleSave = () => {
    if (!formData.title || !formData.summary) {
      alert('Please fill in required fields')
      return
    }

    if (editingId) {
      // Update existing
      const updated = updates.map(u =>
        u.id === editingId
          ? { ...u, ...formData, publishedDate: u.publishedDate }
          : u
      )
      setUpdates(updated)
      localStorage.setItem('portalHealthUpdates', JSON.stringify(updated))
    } else {
      // Create new
      const newUpdate: HealthUpdate = {
        id: `update_${Date.now()}`,
        ...formData,
        publishedDate: new Date().toISOString().split('T')[0],
        views: 0,
        savedCount: 0
      }
      const updated = [newUpdate, ...updates]
      setUpdates(updated)
      localStorage.setItem('portalHealthUpdates', JSON.stringify(updated))
    }

    setFormData({
      title: '',
      summary: '',
      content: '',
      category: 'advisory',
      severity: 'high',
      region: 'National'
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (update: HealthUpdate) => {
    setFormData({
      title: update.title,
      summary: update.summary,
      content: update.content,
      category: update.category as 'advisory',
      severity: update.severity as 'high',
      region: update.region
    })
    setEditingId(update.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this update?')) {
      const updated = updates.filter(u => u.id !== id)
      setUpdates(updated)
      localStorage.setItem('portalHealthUpdates', JSON.stringify(updated))
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-destructive/10 text-destructive',
      high: 'bg-accent/10 text-accent',
      medium: 'bg-primary/10 text-primary',
      low: 'bg-secondary/10 text-secondary'
    }
    return colors[severity] || colors.low
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Health Updates</h1>
          <p className="text-muted-foreground mt-1">Create and manage health advisories</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setFormData({
              title: '',
              summary: '',
              content: '',
              category: 'advisory',
              severity: 'high',
              region: 'National'
            })
            setIsDialogOpen(true)
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Update
        </Button>
      </div>

      {/* Updates Table */}
      <div className="space-y-4">
        {updates.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No health updates yet</p>
            </CardContent>
          </Card>
        ) : (
          updates.map(update => (
            <Card key={update.id} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-foreground line-clamp-2">{update.title}</h3>
                      <Badge className={getSeverityColor(update.severity)}>
                        {update.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{update.summary}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {update.views} views
                      </div>
                      <div>{update.region}</div>
                      <div>{new Date(update.publishedDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(update)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(update.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Create'} Health Update</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the health advisory details' : 'Add a new health update or advisory'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Update title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief summary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Full content"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(val: any) => setFormData(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advisory">Advisory</SelectItem>
                    <SelectItem value="prevention">Prevention</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="outbreak">Outbreak</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select value={formData.severity} onValueChange={(val: any) => setFormData(prev => ({ ...prev, severity: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region} onValueChange={(val) => setFormData(prev => ({ ...prev, region: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National">National</SelectItem>
                  <SelectItem value="Regional">Regional</SelectItem>
                  <SelectItem value="International">International</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground">
              {editingId ? 'Update' : 'Create'} Update
            </Button>
            <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
