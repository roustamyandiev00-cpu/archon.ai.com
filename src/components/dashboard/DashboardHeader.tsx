'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Bell,
  Briefcase,
  CalendarDays,
  Crown,
  FileText,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Plus,
  Receipt,
  Search,
  Settings,
  Sun,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const notificationItems = [
  {
    id: 'notifications-open-offertes',
    title: 'Openstaande offertes',
    description: 'Controleer opvolging van nieuwe offertes.',
    page: 'offertes',
  },
  {
    id: 'notifications-today-agenda',
    title: 'Afspraken vandaag',
    description: 'Bekijk uw planning en tijden voor vandaag.',
    page: 'agenda',
  },
  {
    id: 'notifications-followup-deals',
    title: 'Deals in opvolging',
    description: 'Werk de volgende dealstappen bij.',
    page: 'deals',
  },
] as const

function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timeoutId = 0
    let intervalId = 0

    const tick = () => setNow(new Date())
    const initial = new Date()
    const msToNextMinute = (60 - initial.getSeconds()) * 1000 - initial.getMilliseconds()

    timeoutId = window.setTimeout(() => {
      tick()
      intervalId = window.setInterval(tick, 60_000)
    }, msToNextMinute)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <span data-testid="live-clock" className={className}>
      {now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

export default function DashboardHeader({
  sidebarOpen,
  onOpenSidebar,
  commandOpen,
  onOpenCommand,
  themeMounted,
  resolvedTheme,
  onToggleTheme,
  activePageLabel,
  pageSwitching,
  onNavigate,
  onLogout,
}: {
  sidebarOpen: boolean
  onOpenSidebar: () => void
  commandOpen: boolean
  onOpenCommand: () => void
  themeMounted: boolean
  resolvedTheme: string | undefined
  onToggleTheme: () => void
  activePageLabel: string
  pageSwitching: boolean
  onNavigate: (page: string) => void
  onLogout: () => void | Promise<void>
}) {
  const [unreadNotifications, setUnreadNotifications] = useState<number>(notificationItems.length)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [isDarkUi, setIsDarkUi] = useState(false)
  const { resolvedTheme: resolvedThemeFromHook, setTheme } = useTheme()

  useEffect(() => {
    const id = requestAnimationFrame(() => setThemeReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (!themeReady && !themeMounted) return

    const currentResolvedTheme = resolvedThemeFromHook ?? resolvedTheme
    const isDark =
      currentResolvedTheme === 'dark' ||
      (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
    setIsDarkUi(Boolean(isDark))
  }, [resolvedTheme, resolvedThemeFromHook, themeMounted, themeReady])

  const handleToggleTheme = () => {
    const nextTheme = isDarkUi ? 'light' : 'dark'
    setTheme(nextTheme)
    setIsDarkUi(nextTheme === 'dark')
    onToggleTheme() // Call parent callback

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('theme', nextTheme)
      } catch {
        // ignore
      }
    }
  }

  const navigateFromMenu = (page: string) => {
    onNavigate(page)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-background/30 backdrop-blur-xl border-b border-border/20">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              aria-label="Menu openen"
              aria-controls="mobile-sidebar"
              aria-expanded={sidebarOpen}
              aria-haspopup="dialog"
              onClick={onOpenSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-card/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              data-testid="active-page-label-desktop"
              className="hidden md:flex h-9 w-44 items-center rounded-md border border-border/30 bg-card/60 backdrop-blur-xl px-3"
            >
              <span className="truncate text-sm font-medium text-foreground">{activePageLabel}</span>
            </div>

            <div
              data-testid="active-page-label-mobile"
              className="md:hidden h-9 max-w-[42vw] shrink-0 items-center rounded-md border border-border/30 bg-card/60 backdrop-blur-xl px-3 flex"
            >
              <span className="truncate text-sm font-medium text-foreground">{activePageLabel}</span>
            </div>

            <div className="relative min-w-0 flex-1 max-w-xl" role="search" aria-label="Zoek">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={commandOpen}
                aria-label="Open zoeken"
                title="Zoeken (Ctrl+K)"
                onClick={onOpenCommand}
                className="w-full h-9 rounded-md border border-border/30 bg-card/60 backdrop-blur-xl pl-10 pr-3 text-sm text-left text-muted-foreground hover:bg-card/75 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span className="flex items-center gap-3">
                  <span className="truncate">Zoek pagina, klant of actie...</span>
                  <span aria-hidden="true" className="ml-auto hidden lg:flex items-center gap-1 text-xs text-muted-foreground/80">
                    <kbd className="rounded border border-border/40 bg-background/40 px-1.5 py-0.5 font-mono">Ctrl</kbd>
                    <kbd className="rounded border border-border/40 bg-background/40 px-1.5 py-0.5 font-mono">K</kbd>
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              aria-hidden="true"
              data-testid="page-loading-indicator"
              className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-border/30 bg-card/60 backdrop-blur-xl transition-opacity duration-200 ${pageSwitching ? 'opacity-100' : 'opacity-0'}`}
            >
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>

            {themeMounted ? (
              <LiveClock className="hidden sm:block text-sm font-medium text-foreground bg-card/60 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-border/30" />
            ) : (
              <span
                className="hidden sm:block text-sm font-medium text-foreground bg-card/60 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-border/30"
                data-testid="live-clock"
                aria-hidden="true"
              >
                --:--
              </span>
            )}

            <button
              type="button"
              aria-label="Thema wisselen"
              onClick={handleToggleTheme}
              title="Wissel thema"
              className="p-2 rounded-lg transition-all duration-200 border border-border/30 bg-card/60 backdrop-blur-xl hover:bg-card/75 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {(themeReady || themeMounted) && isDarkUi ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <DropdownMenu
              onOpenChange={(open) => {
                if (open && unreadNotifications > 0) {
                  setUnreadNotifications(0)
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Meldingen"
                  title="Meldingen"
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-card/60"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-border/30"
                    />
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between gap-3">
                  <span>Meldingen</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {notificationItems.length} items
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationItems.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="flex flex-col items-start gap-0.5 py-2"
                    onSelect={() => navigateFromMenu(item.page)}
                  >
                    <span className="font-medium text-sm">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigateFromMenu('instellingen')}>
                  <Settings className="w-4 h-4" />
                  Meldingen-instellingen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Account"
                  title="Account"
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex hover:bg-card/60"
                >
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigateFromMenu('instellingen')}>
                  <Settings className="w-4 h-4" />
                  Instellingen
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigateFromMenu('abonnement')}>
                  <Crown className="w-4 h-4" />
                  Abonnement
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  {isLoggingOut ? 'Bezig met uitloggen...' : 'Uitloggen'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            className="hidden sm:flex bg-linear-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-200"
            title="Upgrade"
            onClick={() => onNavigate('abonnement')}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Nieuwe actie"
                title="Nieuwe actie"
                variant="ghost"
                size="icon"
                className="bg-card/60 hover:bg-card/75 text-foreground border border-border/30 shadow-lg transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Snelle acties</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  onOpenCommand()
                }}
              >
                <Search className="w-4 h-4" />
                Zoeken of commando
                <DropdownMenuShortcut>Ctrl+K</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigateFromMenu('deals')}>
                <Briefcase className="w-4 h-4" />
                Nieuwe deal
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigateFromMenu('offertes')}>
                <FileText className="w-4 h-4" />
                Nieuwe offerte
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigateFromMenu('agenda')}>
                <CalendarDays className="w-4 h-4" />
                Nieuwe afspraak
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigateFromMenu('inkomsten')}>
                <Receipt className="w-4 h-4" />
                Nieuwe factuur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
