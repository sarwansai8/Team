'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar, FileText, Heart, User, Home, Activity, Search, Settings } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigate = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/appointments')}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Appointments</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/medical-records')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Medical Records</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/vaccinations')}>
            <Heart className="mr-2 h-4 w-4" />
            <span>Vaccinations</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/health-updates')}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Health Updates</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate('/appointments?action=schedule')}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Schedule Appointment</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/medical-records?action=add')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Add Medical Record</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/vaccinations?action=add')}>
            <Heart className="mr-2 h-4 w-4" />
            <span>Add Vaccination</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
