'use client'

import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { supabase } from '@/lib/supabase'

import StaticThreads from '@/components/StaticThreads'
import DashboardCommandPalette from '@/components/dashboard/DashboardCommandPalette'
import DashboardGlobalErrorBoundary from '@/components/dashboard/DashboardGlobalErrorBoundary'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import DashboardPageErrorBoundary from '@/components/dashboard/DashboardPageErrorBoundary'
import DesktopSidebar from '@/components/dashboard/DesktopSidebar'
import MobileSidebar from '@/components/dashboard/MobileSidebar'
import { pageLabelById, validPages } from '@/components/dashboard/navigation'
import QueryProvider from '@/components/providers/QueryProvider'
import { toast } from '@/hooks/use-toast'

const ROUTE_BACKED_PAGES = new Set<string>([
  'home',
  'abonnement',
  'ai-assistant',
  'agenda',
  'artikelen',
  'betalingen',
  'bedrijven',
  'contacten',
  'deals',
  'facturen',
  'inkomsten',
  'instellingen',
  'offertes',
  'projecten',
  'timesheets',
  'uitgaven',
  'admin',
  'admin/modules',
  'admin/integrations',
])

function getPageFromPath(pathname: string): string {
  const normalizedPath = pathname.replace(/^\/+/, '')
  if (!normalizedPath) return 'home'
  
  // Probeer eerst een exacte match (voor admin/modules etc)
  if (validPages.has(normalizedPath)) return normalizedPath
  
  // Probeer de eerste segment (fallback voor andere sub-paden)
  const firstSegment = normalizedPath.split('/')[0]
  if (validPages.has(firstSegment)) return firstSegment
  
  return 'home'
}

function getPathForPage(page: string): string {
  const normalizedPage = validPages.has(page) ? page : 'home'
  if (normalizedPage === 'home') return '/'
  
  // Als het een admin sub-pagina is die geen eigen route heeft, navigeer naar /admin met tab
  if (normalizedPage.startsWith('admin/') && !ROUTE_BACKED_PAGES.has(normalizedPage)) {
    const tab = normalizedPage.split('/')[1]
    return `/admin?tab=${tab}`
  }
  
  if (ROUTE_BACKED_PAGES.has(normalizedPage)) return `/${normalizedPage}`
  return `/?page=${normalizedPage}`
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [commandOpen, setCommandOpen] = useState(false)
  const [themeMounted, setThemeMounted] = useState(false)
  const [isRouteTransitionPending, startRouteTransition] = useTransition()
  const [isAdmin, setIsAdmin] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const { resolvedTheme, setTheme } = useTheme()

  const activePage = useMemo(() => {
    const page = getPageFromPath(pathname)
    // Als we op de admin pagina zijn, check of er een tab actief is voor de sidebar highlighting
    if (page === 'admin') {
      const tab = searchParams.get('tab')
      if (tab) return `admin/${tab}`
    }
    return page
  }, [pathname, searchParams])
  const activePageLabel = pageLabelById.get(activePage) ?? 'Dashboard'

  const toggleTheme = () => {
    const isDark =
      resolvedTheme === 'dark' ||
      (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))

    setTheme(isDark ? 'light' : 'dark')
  }
  const toggleDesktopSidebar = () => setDesktopSidebarOpen((open) => !open)

  const navigateTo = (page: string) => {
    const targetPath = getPathForPage(page)
    setSidebarOpen(false)
    setCommandOpen(false)
    startRouteTransition(() => {
      router.push(targetPath)
    })
  }

  const prefetchPage = (page?: string) => {
    if (!page) return
    void router.prefetch(getPathForPage(page))
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        toast({
          title: 'Fout bij uitloggen',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      // Clear local storage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('archonpro.activePage')
        window.localStorage.removeItem('archonpro.desktopSidebarOpen')
        window.sessionStorage.removeItem('archonpro.isAdmin')
      }

      // Harde redirect — wist de Next.js router-cache en alle client state
      window.location.href = '/login'
    } catch (error) {
      console.error('Unexpected logout error:', error)
      toast({
        title: 'Fout bij uitloggen',
        description: 'Er is een onverwachte fout opgetreden.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem('archonpro.desktopSidebarOpen')
    if (stored == null) return

    const next = stored === '1' || stored === 'true'
    if (next === true) return

    const id = requestAnimationFrame(() => setDesktopSidebarOpen(next))
    return () => cancelAnimationFrame(id)
  }, [])

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Use cached result from sessionStorage to avoid repeated API calls
        const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem('archonpro.isAdmin') : null
        if (cached !== null) {
          setIsAdmin(cached === '1')
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const response = await fetch('/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${session.access_token}` 
          }
        });

        if (response.ok) {
          const result = await response.json();
          const role = result.data?.role;
          const isAdminUser = role === 'admin' || role === 'ceo'
          setIsAdmin(isAdminUser)
          window.sessionStorage.setItem('archonpro.isAdmin', isAdminUser ? '1' : '0')

          const nextTrialEndsAt = result.data?.trial_ends_at ?? null
          setTrialEndsAt(typeof nextTrialEndsAt === 'string' ? nextTrialEndsAt : null)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
    }

    checkAdmin()
  }, [])

  const trialDaysLeft = useMemo(() => {
    if (!trialEndsAt) return null

    const end = new Date(trialEndsAt)
    if (Number.isNaN(end.getTime())) return null

    const now = new Date()
    const diffMs = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return diffDays
  }, [trialEndsAt])

  useEffect(() => {
    if (trialDaysLeft == null) return
    if (trialDaysLeft > 0) return
    if (pathname === '/upgrade') return
    router.push('/upgrade')
  }, [pathname, router, trialDaysLeft])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('archonpro.desktopSidebarOpen', desktopSidebarOpen ? '1' : '0')
  }, [desktopSidebarOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('archonpro.activePage', activePage)
  }, [activePage])

  useEffect(() => {
    const id = requestAnimationFrame(() => setThemeMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = activePageLabel ? `ArchonPro - ${activePageLabel}` : 'ArchonPro'
  }, [activePageLabel])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  useEffect(() => {
    if (!commandOpen) return
    const id = requestAnimationFrame(() => setSidebarOpen(false))
    return () => cancelAnimationFrame(id)
  }, [commandOpen])

  useEffect(() => {
    if (!sidebarOpen) return
    const id = requestAnimationFrame(() => setCommandOpen(false))
    return () => cancelAnimationFrame(id)
  }, [sidebarOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isMeta = event.metaKey || event.ctrlKey

      if (key === 'escape') {
        setCommandOpen(false)
        setSidebarOpen(false)
        return
      }

      if (isMeta && key === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
        return
      }

      if (isMeta && key === 'b') {
        event.preventDefault()
        toggleDesktopSidebar()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <DashboardGlobalErrorBoundary>
      <div className="min-h-screen relative" data-mounted={themeMounted ? 'true' : 'false'}>
        <DesktopSidebar
        open={desktopSidebarOpen}
        activePage={activePage}
        onToggleOpen={toggleDesktopSidebar}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        onPrefetch={prefetchPage}
        isAdmin={isAdmin}
      />

      <MobileSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activePage={activePage}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        onPrefetch={prefetchPage}
        isAdmin={isAdmin}
      />

      <div className={`min-h-screen relative z-10 transition-[margin-left] duration-300 ${desktopSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          commandOpen={commandOpen}
          onOpenCommand={() => setCommandOpen(true)}
          themeMounted={themeMounted}
          resolvedTheme={resolvedTheme}
          onToggleTheme={toggleTheme}
          activePageLabel={activePageLabel}
          pageSwitching={isRouteTransitionPending}
          onNavigate={navigateTo}
          onLogout={handleLogout}
        />

        {trialDaysLeft != null && trialDaysLeft > 0 && trialDaysLeft <= 4 && (
          <div className="px-4 lg:px-6">
            <div className="mx-auto w-full max-w-[1760px]">
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Uw proefperiode eindigt over <span className="font-semibold">{trialDaysLeft}</span>{' '}
                    dag{trialDaysLeft === 1 ? '' : 'en'}. Upgrade nu voor ononderbroken toegang.
                  </p>
                  <div className="shrink-0">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/40"
                      onClick={() => router.push('/upgrade')}
                    >
                      Upgrade nu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1760px]">
            <div className="flex items-start gap-6">
              <main
                className="flex-1 min-h-[calc(100dvh-10rem)]"
                aria-busy={isRouteTransitionPending}
                data-page-switching={isRouteTransitionPending ? 'true' : 'false'}
              >
                <DashboardPageErrorBoundary pageKey={pathname} pageLabel={activePageLabel}>
                  <QueryProvider>
                    {children}
                  </QueryProvider>
                </DashboardPageErrorBoundary>
              </main>

              {/* Hide StaticThreads on pages that need full width for better focus and data display */}
              {!['/whatsapp', '/ai-inbox', '/admin', '/projecten', '/facturen', '/offertes', '/agenda', '/inkomsten', '/uitgaven', '/betalingen', '/instellingen', '/abonnement'].some(path => pathname.includes(path)) && (
                <div className="hidden xl:block w-96 shrink-0 sticky top-24 self-start">
                  <StaticThreads />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DashboardCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        activePage={activePage}
        onNavigate={navigateTo}
        onPrefetch={prefetchPage}
        themeMounted={themeMounted}
        resolvedTheme={resolvedTheme}
        onToggleTheme={toggleTheme}
        onToggleDesktopSidebar={toggleDesktopSidebar}
        onLogout={handleLogout}
      />
      </div>
    </DashboardGlobalErrorBoundary>
  )
}
