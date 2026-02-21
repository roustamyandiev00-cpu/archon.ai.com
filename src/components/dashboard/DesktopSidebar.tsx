'use client'

import { useEffect, useState } from 'react'
import { Menu, Sparkles, ChevronLeft, Shield, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSubscriptionTier } from '@/hooks/use-subscription-tier'

import { cn } from '@/lib/utils'
import { bottomNavItems, navigationItems, adminNavItems, canAccessModule } from '@/components/dashboard/navigation'

export default function DesktopSidebar({
  open,
  activePage,
  onToggleOpen,
  onNavigate,
  onLogout,
  onPrefetch,
  isAdmin = false,
}: {
  open: boolean
  activePage: string
  onToggleOpen: () => void
  onNavigate: (page: string) => void
  onLogout: () => void | Promise<void>
  onPrefetch: (page?: string) => void
  isAdmin?: boolean
}) {
  const { tier, loading: tierLoading } = useSubscriptionTier()
  const [loadingModules, setLoadingModules] = useState(true)

  useEffect(() => {
    // Simulate module loading delay for consistency
    if (!tierLoading) {
      const timer = setTimeout(() => setLoadingModules(false), 300)
      return () => clearTimeout(timer)
    }
  }, [tierLoading])

  // Filter navigatie op basis van subscription tier
  // Admins zien ALTIJD alle items voor beheerdoeleinden
  const filteredNavItems = navigationItems.filter(item => {
    if (isAdmin) return true
    return canAccessModule(tier, item.minTier)
  })

  return (
    <>
      <button
        type="button"
        onClick={onToggleOpen}
        aria-controls="desktop-sidebar"
        aria-expanded={open}
        aria-label={open ? 'Zijbalk inklappen' : 'Zijbalk uitklappen'}
        title={open ? 'Zijbalk inklappen' : 'Zijbalk uitklappen'}
        className={cn(
          'hidden lg:flex fixed left-4 top-4 z-50 p-2 rounded-lg bg-card/60 backdrop-blur-xl border border-border/30 hover:bg-card/75 transition-all duration-200 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          open && 'hidden'
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside
        id="desktop-sidebar"
        aria-hidden={!open}
        className={cn(
          'hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar backdrop-blur-xl border-r border-sidebar-border text-sidebar-foreground flex-col z-40 transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ArchonPro</h1>
              <p className="text-xs text-sidebar-foreground/60">Business Suite</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleOpen}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
            aria-label="Zijbalk inklappen"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav aria-label="Hoofdnavigatie" className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-sidebar-foreground/45 flex items-center justify-between">
            <span>Navigatie</span>
            {loadingModules && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
          </p>
          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <button
                key={item.label}
                type="button"
                tabIndex={open ? 0 : -1}
                onMouseEnter={() => onPrefetch(item.page)}
                onFocus={() => onPrefetch(item.page)}
                onClick={() => onNavigate(item.page || 'home')}
                aria-current={activePage === item.page ? 'page' : undefined}
                className={cn(
                  'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
                  activePage === item.page
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-lg border-sidebar-border'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-border/60'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-1.5 h-5 w-0.5 rounded-full transition-opacity duration-200',
                    activePage === item.page ? 'opacity-100 bg-sidebar-foreground/85' : 'opacity-0'
                  )}
                />
                <item.icon
                  className={cn(
                    'w-5 h-5',
                    activePage === item.page ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground/70'
                  )}
                />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Admin Section - Only visible for admin/ceo users */}
        {isAdmin && (
          <div className="p-3 border-t border-sidebar-border">
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-amber-500/80 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Admin
            </p>
            <div className="space-y-1">
              {adminNavItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onMouseEnter={() => onPrefetch(item.page)}
                  onFocus={() => onPrefetch(item.page)}
                  onClick={() => onNavigate(item.page || 'admin')}
                  aria-current={activePage === item.page || (activePage.startsWith('admin/') && item.page === 'admin') ? 'page' : undefined}
                  className={cn(
                    'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
                    activePage === item.page || (activePage.startsWith('admin/') && item.page === 'admin')
                      ? 'bg-amber-500/20 text-amber-500 shadow-lg border-amber-500/30'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-border/60'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-1.5 h-5 w-0.5 rounded-full transition-opacity duration-200',
                      activePage === item.page || (activePage.startsWith('admin/') && item.page === 'admin') ? 'opacity-100 bg-amber-500' : 'opacity-0'
                    )}
                  />
                  <item.icon
                    className={cn(
                      'w-5 h-5',
                      activePage === item.page || (activePage.startsWith('admin/') && item.page === 'admin') ? 'text-amber-500' : 'text-sidebar-foreground/70'
                    )}
                  />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-sidebar-border">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-sidebar-foreground/45">
            Tools
          </p>
          <div className="space-y-1">
            {bottomNavItems
              .filter(item => {
                // Logout button always visible
                if (!item.page) return true
                // Filter by tier
                if (isAdmin) return true
                return canAccessModule(tier, item.minTier)
              })
              .map((item) => (
              <button
                key={item.label}
                type="button"
                tabIndex={open ? 0 : -1}
                onMouseEnter={() => item.page && onPrefetch(item.page)}
                onFocus={() => item.page && onPrefetch(item.page)}
                onClick={() => {
                  if (item.page) {
                    onNavigate(item.page)
                  } else {
                    onLogout()
                  }
                }}
                aria-current={item.page && activePage === item.page ? 'page' : undefined}
                className={cn(
                  'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
                  item.page && activePage === item.page
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-border/60'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-1.5 h-5 w-0.5 rounded-full transition-opacity duration-200',
                    item.page && activePage === item.page ? 'opacity-100 bg-sidebar-foreground/85' : 'opacity-0'
                  )}
                />
                <item.icon
                  className={cn(
                    'w-5 h-5',
                    item.page && activePage === item.page ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground/70'
                  )}
                />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

