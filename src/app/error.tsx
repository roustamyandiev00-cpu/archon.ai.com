'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-7 w-7 text-red-500" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">
          Er ging iets mis
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          De app kon niet laden. Probeer de pagina te vernieuwen. Als het probleem blijft, controleer of de dev-server draait op http://localhost:3000
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCcw className="h-4 w-4" />
        Pagina vernieuwen
      </Button>
    </div>
  )
}
