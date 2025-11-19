'use client'

import { useEffect, useState } from 'react'
import { Command } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function KeyboardHint() {
  const [isVisible, setIsVisible] = useState(true)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    
    // Hide hint after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-6 z-40 hidden md:block"
        >
          <div className="bg-background border border-border rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
            <Command className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Press{' '}
              <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                {isMac ? '⌘' : 'Ctrl'}
              </kbd>
              {' + '}
              <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                K
              </kbd>
              {' '}for quick search
            </span>
            <button
              onClick={() => setIsVisible(false)}
              className="ml-2 text-muted-foreground hover:text-foreground"
              aria-label="Close hint"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
