'use client'

import { useEffect, useMemo, useState } from'react'
import { useRouter, useSearchParams } from'next/navigation'
import { CheckCircle2, Loader2 } from'lucide-react'

import { Button } from'@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card'
import { supabase } from'@/lib/supabase'

type ModulePlan = {
 id: string
 name: string
 slug: string
 description: string | null
 price: number
 stripe_price_id: string | null
 features: string
 is_active: boolean
 sort_order: number
}

function formatPrice(value: number) {
 return new Intl.NumberFormat('nl-NL', {
 style:'currency',
 currency:'EUR',
 }).format(value)
}

export default function UpgradePage() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const [loading, setLoading] = useState(true)
 const [plans, setPlans] = useState<ModulePlan[]>([])
 const [error, setError] = useState<string | null>(null)
 const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null)

 const highlightedPlan = searchParams.get('plan')?.toLowerCase() ?? null

 useEffect(() => {
 const loadPlans = async () => {
 setLoading(true)
 setError(null)
 try {
 const response = await fetch('/api/modules?active=true', { cache:'no-store'})
 const payload = await response.json().catch(() => null)

 if (!response.ok || !payload?.success) {
 throw new Error(payload?.error ??'Kon plannen niet laden.')
 }

 const items = Array.isArray(payload.data) ? payload.data : []
 const normalized = items
 .filter((item: any) => item?.id)
 .map((item: any) => ({
 id: String(item.id),
 name: String(item.name ??''),
 slug: String(item.slug ??''),
 description: item.description ?? null,
 price: Number(item.price ?? 0),
 stripe_price_id: item.stripe_price_id ?? null,
 features: String(item.features ??'[]'),
 is_active: Boolean(item.is_active ?? true),
 sort_order: Number(item.sort_order ?? 0),
 })) as ModulePlan[]

 setPlans(normalized.slice(0, 3))
 } catch (e: any) {
 setError(e?.message ??'Kon plannen niet laden.')
 setPlans([])
 } finally {
 setLoading(false)
 }
 }

 void loadPlans()
 }, [])

 const planCards = useMemo(() => {
 return plans.map((plan) => {
 let features: string[] = []
 try {
 const parsed = JSON.parse(plan.features)
 if (Array.isArray(parsed)) features = parsed.map((v) => String(v))
 } catch {
 features = []
 }

 const isHighlighted = highlightedPlan
 ? plan.slug.toLowerCase().includes(highlightedPlan) || plan.name.toLowerCase().includes(highlightedPlan)
 : false

 return {
 plan,
 features,
 isHighlighted,
 }
 })
 }, [highlightedPlan, plans])

 const startCheckout = async (plan: ModulePlan) => {
 setCheckoutLoadingId(plan.id)

 try {
 const { data } = await supabase.auth.getSession()
 const session = data.session

 if (!session?.user?.id || !session.user.email) {
 router.push('/login')
 return
 }

 if (!plan.stripe_price_id) {
 throw new Error('Dit plan heeft geen Stripe prijs-ID. Neem contact op met support.')
 }

 const response = await fetch('/api/stripe/checkout', {
 method:'POST',
 headers: {
'Content-Type':'application/json',
 },
 body: JSON.stringify({
 userId: session.user.id,
 email: session.user.email,
 moduleId: plan.id,
 moduleName: plan.name,
 priceId: plan.stripe_price_id,
 }),
 })

 const payload = await response.json().catch(() => null)

 if (!response.ok || !payload?.url) {
 throw new Error(payload?.error ??'Kon checkout niet starten.')
 }

 window.location.href = payload.url
 } catch (e: any) {
 setError(e?.message ??'Kon checkout niet starten.')
 } finally {
 setCheckoutLoadingId(null)
 }
 }

 return (
 <div className="min-h-[calc(100dvh-4rem)] p-6">
 <div className="mx-auto w-full max-w-5xl space-y-6">
 <div className="space-y-2">
 <h1 className="text-3xl font-bold text-foreground">Upgrade uw abonnement</h1>
 <p className="text-muted-foreground">
 Kies een plan om uw toegang te behouden en alle modules te blijven gebruiken.
 </p>
 </div>

 {error && (
 <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-foreground">
 {error}
 </div>
 )}

 {loading ? (
 <div className="flex items-center justify-center py-16">
 <Loader2 className="h-8 w-8 animate-spin text-primary"/>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
 {planCards.map(({ plan, features, isHighlighted }) => (
 <Card
 key={plan.id}
 className={
 isHighlighted
 ?'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
 :'border-border/50'
 }
 >
 <CardHeader>
 <CardTitle className="flex items-center justify-between">
 <span>{plan.name}</span>
 {isHighlighted && (
 <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
 Aanbevolen
 </span>
 )}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-1">
 <p className="text-3xl font-bold text-foreground">{formatPrice(plan.price)}</p>
 <p className="text-sm text-muted-foreground">per maand</p>
 {plan.description && (
 <p className="text-sm text-muted-foreground">{plan.description}</p>
 )}
 </div>

 <div className="space-y-2">
 {features.length > 0 ? (
 features.map((feature) => (
 <div key={feature} className="flex items-start gap-2 text-sm">
 <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600"/>
 <span className="text-foreground">{feature}</span>
 </div>
 ))
 ) : (
 <p className="text-sm text-muted-foreground">Geen details beschikbaar.</p>
 )}
 </div>

 <Button
 className="w-full"
 onClick={() => void startCheckout(plan)}
 disabled={checkoutLoadingId === plan.id}
 >
 {checkoutLoadingId === plan.id ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
 Doorsturen...
 </>
 ) : (
'Naar checkout'
 )}
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>
 )}

 {!loading && plans.length === 0 && !error && (
 <div className="rounded-xl border border-border/50 bg-card shadow-sm px-6 py-8 text-center text-sm text-muted-foreground">
 Er zijn momenteel geen plannen beschikbaar.
 </div>
 )}
 </div>
 </div>
 )
}
