'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface SearchWithAutocompleteProps {
  placeholder?: string
  onSearch: (query: string) => void
  suggestions?: string[]
  recentSearches?: string[]
}

export function SearchWithAutocomplete({
  placeholder = 'Search...',
  onSearch,
  suggestions = [],
  recentSearches = [],
}: SearchWithAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [localRecentSearches, setLocalRecentSearches] = useState<string[]>(recentSearches)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches')
    if (stored) {
      setLocalRecentSearches(JSON.parse(stored))
    }
  }, [])

  const handleSearch = (query: string) => {
    if (!query.trim()) return

    // Save to recent searches
    const updated = [query, ...localRecentSearches.filter(s => s !== query)].slice(0, 10)
    setLocalRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    setValue(query)
    onSearch(query)
    setOpen(false)
  }

  const handleSelect = (searchValue: string) => {
    handleSearch(searchValue)
  }

  const clearRecentSearches = () => {
    setLocalRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 5)

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(value)
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          onFocus={() => setOpen(true)}
          className="pl-10"
        />
      </div>

      {open && (value || localRecentSearches.length > 0 || filteredSuggestions.length > 0) && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-0 shadow-md z-50">
          <Command>
            <CommandList>
              {!value && localRecentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {localRecentSearches.map((search, i) => (
                    <CommandItem
                      key={i}
                      onSelect={() => handleSelect(search)}
                      className="cursor-pointer"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {search}
                    </CommandItem>
                  ))}
                  <CommandItem
                    onSelect={clearRecentSearches}
                    className="cursor-pointer text-muted-foreground"
                  >
                    Clear recent searches
                  </CommandItem>
                </CommandGroup>
              )}

              {filteredSuggestions.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {filteredSuggestions.map((suggestion, i) => (
                    <CommandItem
                      key={i}
                      onSelect={() => handleSelect(suggestion)}
                      className="cursor-pointer"
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {value && filteredSuggestions.length === 0 && localRecentSearches.length === 0 && (
                <CommandEmpty>
                  Press Enter to search for "{value}"
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
