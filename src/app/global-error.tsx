'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global app error:', error)
  }, [error])

  return (
    <html lang="nl-NL">
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="text-xl font-semibold">ArchonPro kon niet starten</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Vernieuw de pagina of start de dev-server opnieuw (npm run dev).
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
        >
          Opnieuw proberen
        </button>
      </body>
    </html>
  )
}
