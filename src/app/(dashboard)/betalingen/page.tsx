'use client'

import BetalingenPage from '@/components/pages/BetalingenPage'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Loader2 } from 'lucide-react'

export default function BetalingenRoutePage() {
  const { loading, hasAccess } = useProtectedRoute('groei')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return <BetalingenPage />
}
