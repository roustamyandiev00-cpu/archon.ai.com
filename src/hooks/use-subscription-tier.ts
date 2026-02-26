import { useEffect, useState } from'react'
import { supabase } from'@/lib/supabase'

export type SubscriptionTier ='basis'|'groei'|'premium'| null

export function useSubscriptionTier() {
 const [tier, setTier] = useState<SubscriptionTier>(null)
 const [loading, setLoading] = useState(true)
 const [isAdmin, setIsAdmin] = useState(false)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 const fetchTier = async () => {
 try {
 const { data: { session } } = await supabase.auth.getSession()
 
 if (!session?.user) {
 setLoading(false)
 return
 }

 // Get user's subscription tier from JWT metadata or database
 const response = await fetch('/api/auth/me', {
 headers: {
'Authorization': `Bearer ${session.access_token}`
 }
 })

 if (response.ok) {
 const result = await response.json()
 const subscription_tier = result.data?.subscription_tier || null
 const userRole = result.data?.role || null
 setTier(subscription_tier as SubscriptionTier)
 setIsAdmin(userRole ==='admin'|| userRole ==='ceo')
 } else {
 setError('Failed to fetch subscription tier')
 }
 } catch (err) {
 setError(err instanceof Error ? err.message :'Unknown error')
 } finally {
 setLoading(false)
 }
 }

 fetchTier()
 }, [])

 return { tier, loading, isAdmin, error }
}
