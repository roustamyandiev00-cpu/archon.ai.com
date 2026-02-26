'use client'

import { useEffect, useState } from'react'
import { Menu, Sparkles, ChevronLeft, Shield, Loader2, Settings } from'lucide-react'
import { supabase } from'@/lib/supabase'
import { useSubscriptionTier } from'@/hooks/use-subscription-tier'

import { cn } from'@/lib/utils'
import { bottomNavItems, navigationItems, adminNavItems, canAccessModule, type NavigationItem } from'@/components/dashboard/navigation'
import SidebarEditor from'./SidebarEditor'

interface EditableNavigationItem extends NavigationItem {
 id: string
 visible: boolean
 order: number
}

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
 const [editorOpen, setEditorOpen] = useState(false)
 const [customNavItems, setCustomNavItems] = useState<EditableNavigationItem[]>([])
 const [customBottomItems, setCustomBottomItems] = useState<EditableNavigationItem[]>([])

 // Load custom order and visibility from localStorage
 useEffect(() => {
 const savedOrder = localStorage.getItem('sidebar-order')
 const savedVisibility = localStorage.getItem('sidebar-visibility')
 
 let parsedOrder: string[] = []
 let parsedVisibility: Record<string, boolean> = {}
 
 try {
 if (savedOrder) parsedOrder = JSON.parse(savedOrder)
 if (savedVisibility) parsedVisibility = JSON.parse(savedVisibility)
 } catch (error) {
 console.error('Error parsing saved sidebar config:', error)
 }

 // Process navigation items
 const processedNavItems = navigationItems.map((item, index) => ({
 ...item,
 id: item.page || item.label.toLowerCase().replace(/\s+/g,'-'),
 visible: parsedVisibility[item.page || item.label] !== false,
 order: parsedOrder.indexOf(item.page || item.label) !== -1 
 ? parsedOrder.indexOf(item.page || item.label) 
 : index
 })).sort((a, b) => a.order - b.order)

 // Process bottom items
 const processedBottomItems = bottomNavItems.map((item, index) => ({
 ...item,
 id: item.page || item.label.toLowerCase().replace(/\s+/g,'-'),
 visible: parsedVisibility[item.page || item.label] !== false,
 order: parsedOrder.indexOf(item.page || item.label) !== -1 
 ? parsedOrder.indexOf(item.page || item.label) 
 : navigationItems.length + index
 })).sort((a, b) => a.order - b.order)

 // eslint-disable-next-line react-hooks/set-state-in-effect
 setCustomNavItems(processedNavItems)
 setCustomBottomItems(processedBottomItems)
 }, [])

 useEffect(() => {
 // Simulate module loading delay for consistency
 if (!tierLoading) {
 const timer = setTimeout(() => setLoadingModules(false), 300)
 return () => clearTimeout(timer)
 }
 }, [tierLoading])

 // Filter navigatie op basis van subscription tier en custom visibility
 // Admins zien ALTIJD alle items voor beheerdoeleinden
 const filteredNavItems = (customNavItems.length > 0 ? customNavItems : navigationItems).filter(item => {
 if (!item.visible && customNavItems.length > 0) return false
 if (isAdmin) return true
 return canAccessModule(tier, item.minTier)
 })

 const filteredBottomItems = (customBottomItems.length > 0 ? customBottomItems : bottomNavItems).filter(item => {
 if (!item.visible && customBottomItems.length > 0) return false
 // Logout button always visible
 if (!item.page) return true
 // Filter by tier
 if (isAdmin) return true
 return canAccessModule(tier, item.minTier)
 })

 const handleSaveEditor = (items: EditableNavigationItem[]) => {
 // Separate nav and bottom items
 const navItems = items.filter(item => 
 navigationItems.some(navItem => navItem.page === item.page || navItem.label === item.label)
 )
 const bottomItems = items.filter(item => 
 bottomNavItems.some(bottomItem => bottomItem.page === item.page || bottomItem.label === item.label)
 )

 setCustomNavItems(navItems)
 setCustomBottomItems(bottomItems)
 setEditorOpen(false)
 }

 return (
 <>
 <button
 type="button"
 onClick={onToggleOpen}
 aria-controls="desktop-sidebar"
 aria-expanded={open}
 aria-label={open ?'Zijbalk inklappen':'Zijbalk uitklappen'}
 title={open ?'Zijbalk inklappen':'Zijbalk uitklappen'}
 className={cn(
'hidden lg:flex fixed left-4 top-4 z-50 p-2 rounded-lg bg-card shadow-sm border border-border/50 hover:bg-card shadow-sm transition-all duration-200 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
 open &&'hidden'
 )}
 >
 <Menu className="w-5 h-5"/>
 </button>

 <aside
 id="desktop-sidebar"
 aria-hidden={!open}
 className={cn(
'hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex-col z-40 transition-transform duration-300 ease-in-out',
 open ?'translate-x-0':'-translate-x-full pointer-events-none'
 )}
 >
 <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
 <Sparkles className="w-5 h-5 text-white"/>
 </div>
 <div>
 <h1 className="font-bold text-lg">ArchonPro</h1>
 <p className="text-xs text-sidebar-foreground/60">Business Suite</p>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => setEditorOpen(true)}
 className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
 aria-label="Sidebar bewerken"
 title="Sidebar bewerken"
 >
 <Settings className="w-4 h-4"/>
 </button>
 <button
 type="button"
 onClick={onToggleOpen}
 className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
 aria-label="Zijbalk inklappen"
 >
 <ChevronLeft className="w-5 h-5"/>
 </button>
 </div>
 </div>

 <nav aria-label="Hoofdnavigatie"className="flex-1 p-3 overflow-y-auto custom-scrollbar">
 <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-sidebar-foreground/45 flex items-center justify-between">
 <span>Navigatie</span>
 {loadingModules && <Loader2 className="w-3 h-3 animate-spin opacity-50"/>}
 </p>
 <div className="space-y-1">
 {filteredNavItems.map((item) => (
 <button
 key={item.label}
 type="button"
 tabIndex={open ? 0 : -1}
 onMouseEnter={() => onPrefetch(item.page)}
 onFocus={() => onPrefetch(item.page)}
 onClick={() => onNavigate(item.page ||'home')}
 aria-current={activePage === item.page ?'page': undefined}
 className={cn(
'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
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
 tabIndex={open ? 0 : -1}
 onMouseEnter={() => onPrefetch(item.page)}
 onFocus={() => onPrefetch(item.page)}
 onClick={() => onNavigate(item.page ||'admin')}
 aria-current={activePage === item.page || (activePage.startsWith('admin/') && item.page ==='admin') ?'page': undefined}
 className={cn(
'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
 activePage === item.page || (activePage.startsWith('admin/') && item.page ==='admin')
 ?'bg-amber-500/20 text-amber-500 shadow-lg border-amber-500/30'
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

 <div className="p-3 border-t border-sidebar-border">
 <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-sidebar-foreground/45">
 Tools
 </p>
 <div className="space-y-1">
 {filteredBottomItems.map((item) => (
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
 aria-current={item.page && activePage === item.page ?'page': undefined}
 className={cn(
'relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent transition-[background-color,color,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
 item.page && activePage === item.page
 ?'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border'
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
 </div>

 <SidebarEditor
 open={editorOpen}
 onOpenChange={setEditorOpen}
 onSave={handleSaveEditor}
 />
 </aside>
 </>
 )
}
