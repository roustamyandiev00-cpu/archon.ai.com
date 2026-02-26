'use client'

import { useState, useEffect, useRef, useTransition } from'react'
import { useTheme } from'next-themes'
import dynamic from'next/dynamic'

import { toast } from'@/hooks/use-toast'
import { supabase } from'@/lib/supabase'

import DashboardHome from'@/components/dashboard/DashboardHome'
import DashboardHeader from'@/components/dashboard/DashboardHeader'
import DesktopSidebar from'@/components/dashboard/DesktopSidebar'
import MobileSidebar from'@/components/dashboard/MobileSidebar'
import DashboardCommandPalette from'@/components/dashboard/DashboardCommandPalette'
import DashboardPageErrorBoundary from'@/components/dashboard/DashboardPageErrorBoundary'
import { EmailVerificationBanner } from'@/components/ui/email-verification-banner'
import { EmailVerificationGuard } from'@/components/auth/email-verification-guard'
import { pageLabelById, validPages } from'@/components/dashboard/navigation'

function PageLoading() {
 return (
 <div
 role="status"
 aria-live="polite"
 className="rounded-2xl border border-border/50 bg-card shadow-sm p-6"
 >
 <span className="sr-only">Pagina laden...</span>
 <div className="flex items-center justify-between gap-4">
 <div className="h-4 w-28 rounded bg-muted animate-pulse"/>
 <div className="h-8 w-20 rounded bg-muted animate-pulse"/>
 </div>
 <div className="mt-4 space-y-2">
 <div className="h-3 w-3/4 rounded bg-muted animate-pulse"/>
 <div className="h-3 w-2/3 rounded bg-muted animate-pulse"/>
 </div>
 <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="h-24 rounded-xl bg-muted animate-pulse"/>
 <div className="h-24 rounded-xl bg-muted animate-pulse"/>
 </div>
 </div>
 )
}

const loadBedrijvenPage = () => import('@/components/pages/BedrijvenPage')
const BedrijvenPage = dynamic(
 () => loadBedrijvenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadContactenPage = () => import('@/components/pages/ContactenPage')
const ContactenPage = dynamic(
 () => loadContactenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadDealsPage = () => import('@/components/pages/DealsPage')
const DealsPage = dynamic(
 () => loadDealsPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadOffertesPage = () => import('@/components/pages/OffertesPage')
const OffertesPage = dynamic(
 () => loadOffertesPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadProjectenPage = () => import('@/components/pages/ProjectenPage')
const ProjectenPage = dynamic(
 () => loadProjectenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadAgendaPage = () => import('@/components/pages/AgendaPage')
const AgendaPage = dynamic(
 () => loadAgendaPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadInkomstenPage = () => import('@/components/pages/InkomstenPage')
const InkomstenPage = dynamic(
 () => loadInkomstenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadUitgavenPage = () => import('@/components/pages/UitgavenPage')
const UitgavenPage = dynamic(
 () => loadUitgavenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadArtikelenPage = () => import('@/components/pages/ArtikelenPage')
const ArtikelenPage = dynamic(
 () => loadArtikelenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadTimesheetsPage = () => import('@/components/pages/TimesheetsPage')
const TimesheetsPage = dynamic(
 () => loadTimesheetsPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadBetalingenPage = () => import('@/components/pages/BetalingenPage')
const BetalingenPage = dynamic(
 () => loadBetalingenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadAIAssistantPage = () => import('@/components/pages/AIAssistantPage')
const AIAssistantPage = dynamic(
 () => loadAIAssistantPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadAbonnementPage = () => import('@/components/pages/AbonnementPage')
const AbonnementPage = dynamic(
 () => loadAbonnementPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadInstellingenPage = () => import('@/components/pages/InstellingenPage')
const InstellingenPage = dynamic(
 () => loadInstellingenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)
const loadFacturenPage = () => import('@/components/pages/FacturenPage')
const FacturenPage = dynamic(
 () => loadFacturenPage().then((m) => m.default),
 { loading: () => <PageLoading />, ssr: false }
)

const pageLoaders: Record<string, () => Promise<unknown>> = {
 bedrijven: loadBedrijvenPage,
 contacten: loadContactenPage,
 deals: loadDealsPage,
 offertes: loadOffertesPage,
 projecten: loadProjectenPage,
 agenda: loadAgendaPage,
 inkomsten: loadInkomstenPage,
 uitgaven: loadUitgavenPage,
 artikelen: loadArtikelenPage,
 timesheets: loadTimesheetsPage,
 betalingen: loadBetalingenPage,
'ai-assistant': loadAIAssistantPage,
 abonnement: loadAbonnementPage,
 instellingen: loadInstellingenPage,
 facturen: loadFacturenPage,
}

const routeBackedPages = new Set<string>([
'abonnement',
'agenda',
'ai-assistant',
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
])

function getRoutePath(page: string): string {
 if (!validPages.has(page) || page ==='home') return'/'
 return `/${page}`
}

function prefetchPage(page?: string) {
 if (!page) return
 const loader = pageLoaders[page]
 if (!loader) return
 void loader().catch(() => {})
}

const getFormattedDate = () =>
 new Date().toLocaleDateString('nl-NL', {
 weekday:'long',
 year:'numeric',
 month:'long',
 day:'numeric',
 })

export default function Dashboard() {
 const [sidebarOpen, setSidebarOpen] = useState(false)
 const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
 const [activePage, setActivePage] = useState<string>('home')
 const [autoOpenCreatePage, setAutoOpenCreatePage] = useState<string | null>(null)
 const [commandOpen, setCommandOpen] = useState(false)
 const [themeMounted, setThemeMounted] = useState(false)
 const [pagePreloading, setPagePreloading] = useState(false)
 const [isPageTransitionPending, startPageTransition] = useTransition()
 const navTokenRef = useRef(0)
 const { resolvedTheme, setTheme } = useTheme()
 const formattedDate = themeMounted ? getFormattedDate() :''
 const activePageLabel = pageLabelById.get(activePage) ??'Dashboard'
 const pageSwitching = pagePreloading || isPageTransitionPending
 const toggleTheme = () => {
 const currentTheme = resolvedTheme
 const nextTheme = currentTheme ==='dark'?'light':'dark'
 console.log('Main page toggling theme from', currentTheme,'to', nextTheme)
 setTheme(nextTheme)
 }
 const toggleDesktopSidebar = () => setDesktopSidebarOpen((open) => !open)

 const navigateTo = (page: string) => {
 const nextPage = validPages.has(page) ? page :'home'

 if (nextPage !=='home'&& routeBackedPages.has(nextPage) && typeof window !=='undefined') {
 window.localStorage.setItem('archonpro.activePage', nextPage)
 window.location.assign(getRoutePath(nextPage))
 return
 }

 if (nextPage === activePage) {
 setSidebarOpen(false)
 setCommandOpen(false)
 return
 }

 setSidebarOpen(false)
 setCommandOpen(false)
 setAutoOpenCreatePage(null)

 const token = ++navTokenRef.current
 setPagePreloading(true)

 const loader = pageLoaders[nextPage]
 void (async () => {
 try {
 await loader?.()
 } catch {
 // If preloading fails, still navigate; the dynamic page will render its fallback.
 }

 if (navTokenRef.current !== token) return
 startPageTransition(() => setActivePage(nextPage))
 setPagePreloading(false)
 })()
 }

 const navigateToWithCreate = (page: string) => {
 setAutoOpenCreatePage(page)
 navigateTo(page)
 }

 const handleLogout = async () => {
 try {
 const { error } = await supabase.auth.signOut()
 if (error) {
 console.error('Logout error:', error)
 toast({
 title:'Fout bij uitloggen',
 description: error.message,
 variant:'destructive',
 })
 return
 }
 if (typeof window !=='undefined') {
 window.localStorage.removeItem('archonpro.activePage')
 window.localStorage.removeItem('archonpro.desktopSidebarOpen')
 }
 // Harde redirect — wist alle client state en Next.js router cache
 window.location.href ='/login'
 } catch (err) {
 console.error('Unexpected logout error:', err)
 toast({
 title:'Fout bij uitloggen',
 description:'Er is een onverwachte fout opgetreden.',
 variant:'destructive',
 })
 }
 }

 useEffect(() => {
 if (typeof window ==='undefined') return

 const params = new URLSearchParams(window.location.search)
 const rawUrlPage = params.get('page')
 const urlPage = rawUrlPage && validPages.has(rawUrlPage) ? rawUrlPage : null
 const storedPage = window.localStorage.getItem('archonpro.activePage')

 if (rawUrlPage && !validPages.has(rawUrlPage)) {
 const url = new URL(window.location.href)
 url.searchParams.delete('page')
 window.history.replaceState({},'', url.toString())
 }

 if (storedPage && !validPages.has(storedPage)) {
 window.localStorage.removeItem('archonpro.activePage')
 }

 const nextPage = urlPage ?? storedPage
 if (nextPage && validPages.has(nextPage) && routeBackedPages.has(nextPage)) {
 window.localStorage.setItem('archonpro.activePage', nextPage)
 window.location.replace(getRoutePath(nextPage))
 return
 }

 if (nextPage && validPages.has(nextPage) && nextPage !== activePage) {
 const token = ++navTokenRef.current
 const rafId = requestAnimationFrame(() => setPagePreloading(true))

 const loader = pageLoaders[nextPage]
 void (async () => {
 try {
 await loader?.()
 } catch {
 // fall through and still set the page
 }

 if (navTokenRef.current !== token) return
 startPageTransition(() => setActivePage(nextPage))
 setPagePreloading(false)
 })()
 return () => cancelAnimationFrame(rafId)
 }
 }, [])

 useEffect(() => {
 if (typeof window ==='undefined') return

 const warmPages = [
'bedrijven',
'contacten',
'deals',
'offertes',
'projecten',
'agenda',
'ai-assistant',
'facturen',
 ] as const

 const timers = warmPages.map((page, index) =>
 window.setTimeout(() => prefetchPage(page), 400 + index * 140)
 )

 return () => timers.forEach((id) => window.clearTimeout(id))
 }, [])

 useEffect(() => {
 if (typeof window ==='undefined') return

 const stored = window.localStorage.getItem('archonpro.desktopSidebarOpen')
 if (stored == null) return

 const next = stored ==='1'|| stored ==='true'
 if (next === true) return

 const id = requestAnimationFrame(() => setDesktopSidebarOpen(next))
 return () => cancelAnimationFrame(id)
 }, [])

 useEffect(() => {
 const id = requestAnimationFrame(() => setThemeMounted(true))
 return () => cancelAnimationFrame(id)
 }, [])

 useEffect(() => {
 if (typeof window ==='undefined') return
 window.localStorage.setItem('archonpro.desktopSidebarOpen', desktopSidebarOpen ?'1':'0')
 }, [desktopSidebarOpen])

 useEffect(() => {
 if (typeof window ==='undefined') return

 window.localStorage.setItem('archonpro.activePage', activePage)

 const url = new URL(window.location.href)
 if (activePage ==='home') url.searchParams.delete('page')
 else url.searchParams.set('page', activePage)
 window.history.replaceState({},'', url.toString())
 }, [activePage])

 useEffect(() => {
 if (typeof document ==='undefined') return
 const label = pageLabelById.get(activePage)
 document.title = label ? `ArchonPro — ${label}` :'ArchonPro'
 }, [activePage])

 useEffect(() => {
 if (typeof window ==='undefined') return
 window.scrollTo({ top: 0, behavior:'auto'})
 }, [activePage])

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
 const onKeyDown = (e: KeyboardEvent) => {
 const key = e.key.toLowerCase()
 const isMeta = e.metaKey || e.ctrlKey

 if (key ==='escape') {
 setCommandOpen(false)
 setSidebarOpen(false)
 return
 }

 if (isMeta && key ==='k') {
 e.preventDefault()
 setCommandOpen((open) => !open)
 return
 }

 if (isMeta && key ==='b') {
 e.preventDefault()
 toggleDesktopSidebar()
 }
 }

 window.addEventListener('keydown', onKeyDown)
 return () => window.removeEventListener('keydown', onKeyDown)
 }, [])

 const renderPageContent = () => {
 const autoOpenCreate = activePage === autoOpenCreatePage
 switch (activePage) {
 case'bedrijven':
 return <BedrijvenPage autoOpenCreate={autoOpenCreate} />
 case'contacten':
 return <ContactenPage autoOpenCreate={autoOpenCreate} />
 case'deals':
 return <DealsPage autoOpenCreate={autoOpenCreate} />
 case'offertes':
 return <OffertesPage autoOpenCreate={autoOpenCreate} />
 case'projecten':
 return <ProjectenPage autoOpenCreate={autoOpenCreate} />
 case'agenda':
 return <AgendaPage autoOpenCreate={autoOpenCreate} />
 case'inkomsten':
 return <InkomstenPage autoOpenCreate={autoOpenCreate} />
 case'uitgaven':
 return <UitgavenPage autoOpenCreate={autoOpenCreate} />
 case'artikelen':
 return <ArtikelenPage autoOpenCreate={autoOpenCreate} />
 case'timesheets':
 return <TimesheetsPage />
 case'betalingen':
 return <BetalingenPage />
 case'ai-assistant':
 return <AIAssistantPage />
 case'abonnement':
 return <AbonnementPage />
 case'instellingen':
 return <InstellingenPage />
 case'facturen':
 return <FacturenPage autoOpenCreate={autoOpenCreate} />
 default:
 return (
 <DashboardHome
 formattedDate={formattedDate}
 onNavigate={navigateTo}
 onNavigateWithCreate={navigateToWithCreate}
 onPrefetch={prefetchPage}
 />
 )
 }
 }

 return (
 <EmailVerificationGuard>
 <div
 className="min-h-screen relative"
 data-mounted={themeMounted ?'true':'false'}
 >
 <DesktopSidebar
 open={desktopSidebarOpen}
 activePage={activePage}
 onToggleOpen={toggleDesktopSidebar}
 onNavigate={navigateTo}
 onLogout={handleLogout}
 onPrefetch={prefetchPage}
 />

 <MobileSidebar
 open={sidebarOpen}
 onOpenChange={setSidebarOpen}
 activePage={activePage}
 onNavigate={navigateTo}
 onLogout={handleLogout}
 onPrefetch={prefetchPage}
 />

 <div className={`min-h-screen relative z-10 transition-[margin-left] duration-300 ${desktopSidebarOpen ?'lg:ml-64':'lg:ml-0'}`}>
 <DashboardHeader
 sidebarOpen={sidebarOpen}
 onOpenSidebar={() => setSidebarOpen(true)}
 commandOpen={commandOpen}
 onOpenCommand={() => setCommandOpen(true)}
 themeMounted={themeMounted}
 resolvedTheme={resolvedTheme}
 onToggleTheme={toggleTheme}
 activePageLabel={activePageLabel}
 pageSwitching={pageSwitching}
 onNavigate={navigateTo}
 onLogout={handleLogout}
 />

 <div className="p-4 lg:p-6">
 <div className="mx-auto w-full max-w-[1760px]">
 <EmailVerificationBanner />
 <div className="flex items-start gap-6">
 <main
 id="main-content"
 className="flex-1 min-h-[calc(100dvh-10rem)]"
 aria-busy={pageSwitching}
 data-page-switching={pageSwitching ?'true':'false'}
 >
 <DashboardPageErrorBoundary pageKey={activePage} pageLabel={activePageLabel}>
 {renderPageContent()}
 </DashboardPageErrorBoundary>
 </main>

 <div className="hidden xl:block w-96 shrink-0 sticky top-24 self-start">
 {/* Discussions panel removed */}
 </div>
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
 </EmailVerificationGuard>
 )
}
