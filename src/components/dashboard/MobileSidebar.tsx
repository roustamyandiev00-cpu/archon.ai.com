'use client'

import { useEffect, useState } from'react'
import { Sparkles, X, Shield, Loader2 } from'lucide-react'
import { supabase } from'@/lib/supabase'
import { useSubscriptionTier } from'@/hooks/use-subscription-tier'

import { cn } from'@/lib/utils'
import { bottomNavItems, navigationItems, adminNavItems, canAccessModule } from'@/components/dashboard/navigation'
import {
 Sheet,
 SheetClose,
 SheetContent,
 SheetDescription,
 SheetHeader,
 SheetTitle,
} from'@/components/ui/sheet'

export default function MobileSidebar({
 open,
 onOpenChange,
 activePage,
 onNavigate,
 onLogout,
 onPrefetch,
 isAdmin = false,
}: {
 open: boolean
 onOpenChange: (open: boolean) => void
 activePage: string
 onNavigate: (page: string) => void
 onLogout: () => void | Promise<void>
 onPrefetch: (page?: string) => void
 isAdmin?: boolean
}) {
 const { tier, loading: tierLoading } = useSubscriptionTier()
 const [loadingModules, setLoadingModules] = useState(true)

 useEffect(() => {
 if (!tierLoading && open) {
 const timer = setTimeout(() => setLoadingModules(false), 300)
 return () => clearTimeout(timer)
 }
 }, [tierLoading, open])

 const filteredNavItems = navigationItems.filter(item => {
 if (isAdmin) return true
 return canAccessModule(tier, item.minTier)
 })

 return (
 <Sheet open={open} onOpenChange={onOpenChange}>
 <SheetContent
 id="mobile-sidebar"
 side="left"
 className="bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col w-[min(88vw,20rem)] max-w-[20rem] p-0 lg:hidden overscroll-contain [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)] [&>button]:hidden"
 >
 <SheetHeader className="sr-only">
 <SheetTitle>Navigatie</SheetTitle>
 <SheetDescription>Hoofdnavigatie van ArchonPro.</SheetDescription>
 </SheetHeader>

 <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
 <Sparkles className="w-5 h-5 text-white"/>
 </div>
 <div>
 <div className="font-bold text-lg">ArchonPro</div>
 <p className="text-xs text-sidebar-foreground/60">Business Suite</p>
 </div>
 </div>
 <SheetClose asChild>
 <button
 type="button"
 aria-label="Menu sluiten"
 className="p-2 rounded-lg hover:bg-sidebar-accent outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
 >
 <X className="w-5 h-5 text-sidebar-foreground/70"/>
 </button>
 </SheetClose>
 </div>

 <nav aria-label="Hoofdnavigatie"className="relative z-0 flex-1 min-h-0 p-3 overflow-y-auto custom-scrollbar">
 <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-sidebar-foreground/45 flex items-center justify-between">
 <span>Navigatie</span>
 {loadingModules && <Loader2 className="w-3 h-3 animate-spin opacity-50"/>}
 </p>
 <div className="space-y-1">
 {filteredNavItems.map((item) => (
 <button
 key={item.label}
 type="button"
 onMouseEnter={() => onPrefetch(item.page)}
 onFocus={() => onPrefetch(item.page)}
 onTouchStart={() => onPrefetch(item.page)}
 onClick={() => onNavigate(item.page ||'home')}
 aria-current={activePage === item.page ?'page': undefined}
 className={cn(
'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
 activePage === item.page
 ?'bg-sidebar-primary/15 text-sidebar-foreground shadow-lg border-sidebar-primary/30'
 :'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-border/60'
 )}
 >
 <span
 aria-hidden="true"
 className={cn(
'absolute left-1.5 h-5 w-0.5 rounded-full transition-opacity duration-200',
 activePage === item.page ?'opacity-100 bg-sidebar-primary':'opacity-0'
 )}
 />
 <item.icon
 className={cn(
'w-5 h-5',
 activePage === item.page ?'text-sidebar-primary':'text-sidebar-foreground/70'
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
 <Shield className="w-3 h-3"/>
 Admin
 </p>
 <div className="space-y-1">
 {adminNavItems.map((item) => (
 <button
 key={item.label}
 type="button"
 onMouseEnter={() => onPrefetch(item.page)}
 onFocus={() => onPrefetch(item.page)}
 onTouchStart={() => onPrefetch(item.page)}
 onClick={() => onNavigate(item.page ||'admin')}
 aria-current={activePage === item.page || (activePage.startsWith('admin/') && item.page ==='admin') ?'page': undefined}
 className={cn(
'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
 activePage === item.page || (activePage.startsWith('admin/') && item.page ==='admin')
 ?'bg-amber-500/20 text-amber-500 border-amber-500/30'
 :'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-border/60'
 )}
 >
 <span
 aria-hidden="true"
 className={cn(
'absolute left-1.5 h-5 w-0.5 rounded-full transition-opacity duration-200',
 activePage === item.page || (activePage.startsWith('admin/') && item.page ==='admin') ?'opacity-100 bg-amber-500':'opacity-0'
 )}
 />
 <item.icon
 className={cn(
'w-5 h-5',
 activePage === item.page || (activePage.startsWith('admin/') && item.page ==='admin') ?'text-amber-500':'text-sidebar-foreground/70'
 )}
 />
 {item.label}
 </button>
 ))}
 </div>
 </div>
 )}

 <div className="relative z-10 shrink-0 p-3 border-t border-sidebar-border bg-sidebar/95">
 <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-sidebar-foreground/45">
 Tools
 </p>
 {bottomNavItems
 .filter(item => {
 if (!item.page) return true
 if (isAdmin) return true
 return canAccessModule(tier, item.minTier)
 })
 .map((item) => (
 <button
 key={item.label}
 type="button"
 onMouseEnter={() => item.page && onPrefetch(item.page)}
 onFocus={() => item.page && onPrefetch(item.page)}
 onTouchStart={() => item.page && onPrefetch(item.page)}
 onClick={() => {
 if (item.page) {
 onNavigate(item.page)
 } else {
 onLogout()
 }
 }}
 aria-current={item.page && activePage === item.page ?'page': undefined}
 className={cn(
'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
 item.page && activePage === item.page
 ?'bg-sidebar-primary/15 text-sidebar-foreground shadow-lg border-sidebar-primary/30'
 :'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-border/60'
 )}
 >
 <span
 aria-hidden="true"
 className={cn(
'absolute left-1.5 h-5 w-0.5 rounded-full transition-opacity duration-200',
 item.page && activePage === item.page ?'opacity-100 bg-sidebar-primary':'opacity-0'
 )}
 />
 <item.icon
 className={cn(
'w-5 h-5',
 item.page && activePage === item.page ?'text-sidebar-primary':'text-sidebar-foreground/70'
 )}
 />
 {item.label}
 </button>
 ))}
 </div>
 </SheetContent>
 </Sheet>
 )
}
