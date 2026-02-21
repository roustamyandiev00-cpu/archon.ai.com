import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSubscriptionTier } from '@/hooks/use-subscription-tier'
import { canAccessModule, type SubscriptionTier } from '@/components/dashboard/navigation'

/**
 * Hook to protect pages based on subscription tier
 * Redirects to upgrade page if user doesn't have required tier
 *
 * Usage:
 *   useProtectedRoute('groei')  // Require at least Groei plan
 */
export function useProtectedRoute(requiredTier: SubscriptionTier = 'basis') {
  const router = useRouter()
  const { tier, loading, isAdmin } = useSubscriptionTier()

  useEffect(() => {
    if (loading) return

    if (isAdmin) return

    if (!canAccessModule(tier, requiredTier)) {
      // Redirect to upgrade page with current page as redirect
      const redirectTo = typeof window !== 'undefined' ? window.location.pathname : '/'
      router.push(`/abonnement?upgrade_from=${encodeURIComponent(redirectTo)}`)
    }
  }, [tier, loading, requiredTier, router])

  return { loading, hasAccess: canAccessModule(tier, requiredTier) }
}
