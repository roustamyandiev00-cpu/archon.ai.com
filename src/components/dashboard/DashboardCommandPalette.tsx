'use client'

import { useState, useEffect } from'react'
import { LogOut, Menu, Moon, Sun, Building2, Users, DollarSign, FolderKanban, FileText } from'lucide-react'

import {
 CommandDialog,
 CommandEmpty,
 CommandGroup,
 CommandInput,
 CommandItem,
 CommandList,
 CommandSeparator,
 CommandShortcut,
} from'@/components/ui/command'
import { bottomNavItems, navigationItems } from'@/components/dashboard/navigation'
import { searchRecords } from'@/hooks/use-supabase'
import type { Database } from'@/lib/supabase'

export default function DashboardCommandPalette({
 open,
 onOpenChange,
 activePage,
 onNavigate,
 onPrefetch,
 themeMounted,
 resolvedTheme,
 onToggleTheme,
 onToggleDesktopSidebar,
 onLogout,
}: {
 open: boolean
 onOpenChange: (open: boolean) => void
 activePage: string
 onNavigate: (page: string) => void
 onPrefetch: (page?: string) => void
 themeMounted: boolean
 resolvedTheme: string | undefined
 onToggleTheme: () => void
 onToggleDesktopSidebar: () => void
 onLogout: () => void | Promise<void>
}) {
 const [searchQuery, setSearchQuery] = useState('')
 const [searchResults, setSearchResults] = useState<{
 bedrijven: Database['public']['Tables']['bedrijven']['Row'][]
 contacten: Database['public']['Tables']['contacten']['Row'][]
 deals: Database['public']['Tables']['deals']['Row'][]
 projecten: Database['public']['Tables']['projecten']['Row'][]
 offertes: Database['public']['Tables']['offertes']['Row'][]
 }>({
 bedrijven: [],
 contacten: [],
 deals: [],
 projecten: [],
 offertes: [],
 })
 const [isSearching, setIsSearching] = useState(false)

 useEffect(() => {
 const performSearch = async () => {
 if (searchQuery.length < 2) {
 setSearchResults({
 bedrijven: [],
 contacten: [],
 deals: [],
 projecten: [],
 offertes: [],
 })
 return
 }

 setIsSearching(true)
 try {
 const [bedrijvenRes, contactenRes, dealsRes, projectenRes, offertesRes] = await Promise.all([
 searchRecords('bedrijven','naam', searchQuery),
 searchRecords('contacten','achternaam', searchQuery),
 searchRecords('deals','titel', searchQuery),
 searchRecords('projecten','naam', searchQuery),
 searchRecords('offertes','nummer', searchQuery),
 ])

 setSearchResults({
 bedrijven: (bedrijvenRes.data || []) as Database['public']['Tables']['bedrijven']['Row'][],
 contacten: (contactenRes.data || []) as Database['public']['Tables']['contacten']['Row'][],
 deals: (dealsRes.data || []) as Database['public']['Tables']['deals']['Row'][],
 projecten: (projectenRes.data || []) as Database['public']['Tables']['projecten']['Row'][],
 offertes: (offertesRes.data || []) as Database['public']['Tables']['offertes']['Row'][],
 })
 } catch (error) {
 console.error('Search error:', error)
 } finally {
 setIsSearching(false)
 }
 }

 const debounceTimer = setTimeout(performSearch, 300)
 return () => clearTimeout(debounceTimer)
 }, [searchQuery])

 const hasSearchResults =
 searchResults.bedrijven.length > 0 ||
 searchResults.contacten.length > 0 ||
 searchResults.deals.length > 0 ||
 searchResults.projecten.length > 0 ||
 searchResults.offertes.length > 0

 return (
 <CommandDialog
 open={open}
 onOpenChange={onOpenChange}
 title="Zoeken"
 description="Zoek een pagina of voer een actie uit."
 >
 <CommandInput
 placeholder="Typ om te zoeken..."
 value={searchQuery}
 onValueChange={setSearchQuery}
 />
 <CommandList>
 {isSearching ? (
 <div className="py-4 text-center text-sm text-muted-foreground">
 Zoeken...
 </div>
 ) : hasSearchResults ? (
 <>
 {searchResults.bedrijven.length > 0 && (
 <>
 <CommandSeparator />
 <CommandGroup heading="Bedrijven">
 {searchResults.bedrijven.slice(0, 5).map((bedrijf) => (
 <CommandItem
 key={bedrijf.id}
 value={`bedrijf-${bedrijf.id}`}
 onSelect={() => {
 onNavigate('bedrijven')
 onOpenChange(false)
 }}
 >
 <Building2 className="w-4 h-4"/>
 <span>{bedrijf.naam}</span>
 <CommandShortcut>{bedrijf.stad}</CommandShortcut>
 </CommandItem>
 ))}
 </CommandGroup>
 </>
 )}

 {searchResults.contacten.length > 0 && (
 <>
 <CommandSeparator />
 <CommandGroup heading="Contacten">
 {searchResults.contacten.slice(0, 5).map((contact) => (
 <CommandItem
 key={contact.id}
 value={`contact-${contact.id}`}
 onSelect={() => {
 onNavigate('contacten')
 onOpenChange(false)
 }}
 >
 <Users className="w-4 h-4"/>
 <span>{contact.voornaam} {contact.achternaam}</span>
 <CommandShortcut>{contact.functie}</CommandShortcut>
 </CommandItem>
 ))}
 </CommandGroup>
 </>
 )}

 {searchResults.deals.length > 0 && (
 <>
 <CommandSeparator />
 <CommandGroup heading="Deals">
 {searchResults.deals.slice(0, 5).map((deal) => (
 <CommandItem
 key={deal.id}
 value={`deal-${deal.id}`}
 onSelect={() => {
 onNavigate('deals')
 onOpenChange(false)
 }}
 >
 <DollarSign className="w-4 h-4"/>
 <span>{deal.titel}</span>
 <CommandShortcut>€{deal.waarde.toLocaleString()}</CommandShortcut>
 </CommandItem>
 ))}
 </CommandGroup>
 </>
 )}

 {searchResults.projecten.length > 0 && (
 <>
 <CommandSeparator />
 <CommandGroup heading="Projecten">
 {searchResults.projecten.slice(0, 5).map((project) => (
 <CommandItem
 key={project.id}
 value={`project-${project.id}`}
 onSelect={() => {
 onNavigate('projecten')
 onOpenChange(false)
 }}
 >
 <FolderKanban className="w-4 h-4"/>
 <span>{project.naam}</span>
 <CommandShortcut>{project.status}</CommandShortcut>
 </CommandItem>
 ))}
 </CommandGroup>
 </>
 )}

 {searchResults.offertes.length > 0 && (
 <>
 <CommandSeparator />
 <CommandGroup heading="Offertes">
 {searchResults.offertes.slice(0, 5).map((offerte) => (
 <CommandItem
 key={offerte.id}
 value={`offerte-${offerte.id}`}
 onSelect={() => {
 onNavigate('offertes')
 onOpenChange(false)
 }}
 >
 <FileText className="w-4 h-4"/>
 <span>{offerte.nummer}</span>
 <CommandShortcut>€{offerte.bedrag.toLocaleString()}</CommandShortcut>
 </CommandItem>
 ))}
 </CommandGroup>
 </>
 )}
 </>
 ) : (
 <CommandEmpty>
 {searchQuery.length > 0 ?'Geen resultaten gevonden.':'Typ om te zoeken...'}
 </CommandEmpty>
 )}

 {!hasSearchResults && (
 <>
 <CommandGroup heading="Navigatie">
 {navigationItems.map((item) => (
 <CommandItem
 key={item.page ?? item.label}
 value={`${item.label} ${item.page ??''}`.trim()}
 onMouseEnter={() => onPrefetch(item.page)}
 onFocus={() => onPrefetch(item.page)}
 onSelect={() => onNavigate(item.page ||'home')}
 >
 <item.icon className="w-4 h-4"/>
 <span>{item.label}</span>
 {activePage === item.page ? <CommandShortcut>Actief</CommandShortcut> : null}
 </CommandItem>
 ))}
 </CommandGroup>

 <CommandSeparator />

 <CommandGroup heading="Tools">
 {bottomNavItems
 .filter((item) => item.page)
 .map((item) => (
 <CommandItem
 key={item.page as string}
 value={`${item.label} ${item.page as string}`.trim()}
 onMouseEnter={() => onPrefetch(item.page)}
 onFocus={() => onPrefetch(item.page)}
 onSelect={() => onNavigate(item.page as string)}
 >
 <item.icon className="w-4 h-4"/>
 <span>{item.label}</span>
 {activePage === item.page ? <CommandShortcut>Actief</CommandShortcut> : null}
 </CommandItem>
 ))}
 </CommandGroup>

 <CommandSeparator />

 <CommandGroup heading="Systeem">
 <CommandItem
 value="Thema wisselen theme"
 onSelect={() => {
 onToggleTheme()
 onOpenChange(false)
 }}
 >
 {themeMounted && resolvedTheme ==='dark'? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
 <span>Thema wisselen</span>
 </CommandItem>

 <CommandItem
 value="Zijbalk tonen verbergen sidebar"
 onSelect={() => {
 onToggleDesktopSidebar()
 onOpenChange(false)
 }}
 >
 <Menu className="w-4 h-4"/>
 <span>Zijbalk tonen/verbergen</span>
 <CommandShortcut>Ctrl+B</CommandShortcut>
 </CommandItem>

 <CommandItem value="Uitloggen logout"onSelect={onLogout}>
 <LogOut className="w-4 h-4"/>
 <span>Uitloggen</span>
 </CommandItem>
 </CommandGroup>
 </>
 )}
 </CommandList>
 </CommandDialog>
 )
}
