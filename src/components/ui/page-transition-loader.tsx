'use client'

import { motion } from 'framer-motion'

export function PageTransitionLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">Pagina laden...</p>
      </div>
    </motion.div>
  )
}