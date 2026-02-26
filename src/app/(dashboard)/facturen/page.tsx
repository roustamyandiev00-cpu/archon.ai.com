'use client'

import { useMemo } from'react'
import { useSearchParams } from'next/navigation'
import { Loader2 } from'lucide-react'

import FacturenPage from'@/components/pages/FacturenPage'
import { useProtectedRoute } from'@/hooks/use-protected-route'
import { parseFactuurPrefillData } from'@/lib/ai-assistant-actions'

export default function FacturenRoutePage() {
 const { loading, hasAccess } = useProtectedRoute('groei')
 const searchParams = useSearchParams()

 const prefillRaw = searchParams.get('prefill')
 const prefillData = useMemo(() => parseFactuurPrefillData(prefillRaw), [prefillRaw])
 const autoOpenCreate = searchParams.get('create') ==='1'|| Boolean(prefillData)

 if (loading) {
 return (
 <div className="flex items-center justify-center h-96">
 <Loader2 className="w-8 h-8 animate-spin text-primary"/>
 </div>
 )
 }

 if (!hasAccess) {
 return null
 }

 return <FacturenPage autoOpenCreate={autoOpenCreate} prefillData={prefillData} />
}
