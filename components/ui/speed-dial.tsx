'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SpeedDialAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

interface SpeedDialProps {
  actions: SpeedDialAction[]
}

export function SpeedDial({ actions }: SpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-3 mb-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm font-medium bg-background border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                  {action.label}
                </span>
                <Button
                  size="icon"
                  onClick={() => {
                    action.onClick()
                    setIsOpen(false)
                  }}
                  className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-secondary hover:bg-secondary/90"
                >
                  {action.icon}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </Button>
    </div>
  )
}
