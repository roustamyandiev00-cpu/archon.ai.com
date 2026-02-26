'use client'

import { useState } from 'react'
import { Download, X, FileSpreadsheet, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function ImportBanner({ onImport }: { onImport?: () => void }) {
  const [dismissed, setDismissed] = useState(false)
  const [importing, setImporting] = useState(false)

  if (dismissed) return null

  const handleImport = async () => {
    setImporting(true)
    try {
      // Fetch deals from Pipedrive
      const response = await fetch('/api/pipedrive/deals?status=open&limit=50')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Kon geen data ophalen uit Pipedrive')
      }

      // Import to ArchonPro
      const importResponse = await fetch('/api/pipedrive/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deals: result.data.deals,
          syncMode: 'import'
        })
      })

      const importResult = await importResponse.json()
      
      if (importResult.success) {
        toast({
          title: 'Import voltooid',
          description: `${importResult.data.imported} deals geïmporteerd, ${importResult.data.updated} bijgewerkt`,
        })
        onImport?.()
      } else {
        throw new Error(importResult.error)
      }
    } catch (error: any) {
      toast({
        title: 'Import mislukt',
        description: error.message || 'Kon deals niet importeren uit Pipedrive',
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="bg-linear-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-200/50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg shrink-0">
            <Database className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Importeer uw contact- en verkoopdata</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Breng uw Pipedrive data over naar ArchonPro om uw operaties te stroomlijnen. 
              Ontgrendel het volledige potentieel van wat ArchonPro voor uw bedrijf kan doen.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDismissed(true)}
            className="hidden sm:flex"
          >
            <X className="w-4 h-4 mr-1" />
            Negeren
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={importing}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            {importing ? 'Bezig...' : 'Data importeren'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="sm:hidden h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
