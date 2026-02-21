import type { ElementType } from 'react'
import {
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  Crown,
  FileSpreadsheet,
  FolderKanban,
  Home,
  LogOut,
  Package,
  Receipt,
  Settings,
  Shield,
  Timer,
  TrendingUp,
  Users,
  Wallet,
  LayoutDashboard,
  CreditCard,
  Tag,
  Mail,
  Ticket,
  Bell,
  BarChart3,
  MessageSquare,
  FolderClosed,
} from 'lucide-react'

export type SubscriptionTier = 'basis' | 'groei' | 'premium'

export type NavigationItem = {
  icon: ElementType
  label: string
  page?: string
  adminOnly?: boolean
  module?: string
  minTier?: SubscriptionTier // Minimum subscription tier required (default: 'basis')
}

// Module availability per subscription tier
const TIER_MODULES: Record<SubscriptionTier, string[]> = {
  basis: [
    'home', 'bedrijven', 'contacten', 'deals', 'offertes', 'artikelen', 'agenda'
  ],
  groei: [
    'home', 'bedrijven', 'contacten', 'deals', 'offertes', 'artikelen', 'agenda',
    'projecten', 'facturen', 'inkomsten', 'betalingen'
  ],
  premium: [
    'home', 'bedrijven', 'contacten', 'deals', 'offertes', 'artikelen', 'agenda',
    'projecten', 'facturen', 'inkomsten', 'betalingen',
    'uitgaven', 'ai-assistant', 'timesheets'
  ]
}

export const navigationItems: NavigationItem[] = [
  { icon: Home, label: 'Dashboard', page: 'home', minTier: 'basis' },
  { icon: Building2, label: 'Bedrijven', page: 'bedrijven', module: 'bedrijven', minTier: 'basis' },
  { icon: Users, label: 'Contacten', page: 'contacten', module: 'contacten', minTier: 'basis' },
  { icon: Briefcase, label: 'Deals', page: 'deals', module: 'deals', minTier: 'basis' },
  { icon: FileSpreadsheet, label: 'Offertes', page: 'offertes', module: 'offertes', minTier: 'basis' },
  { icon: Receipt, label: 'Facturen', page: 'facturen', module: 'facturen', minTier: 'groei' },
  { icon: FolderKanban, label: 'Projecten', page: 'projecten', module: 'projecten', minTier: 'groei' },
  { icon: CalendarDays, label: 'Agenda', page: 'agenda', module: 'agenda', minTier: 'basis' },
  { icon: TrendingUp, label: 'Inkomsten', page: 'inkomsten', module: 'inkomsten', minTier: 'groei' },
  { icon: Wallet, label: 'Ausgaven', page: 'uitgaven', module: 'uitgaven', minTier: 'premium' },
  { icon: Package, label: 'Artikelen', page: 'artikelen', module: 'artikelen', minTier: 'basis' },
  { icon: Timer, label: 'Timesheets', page: 'timesheets', module: 'timesheets', minTier: 'premium' },
  { icon: Receipt, label: 'Betalingen', page: 'betalingen', module: 'betalingen', minTier: 'groei' },
  { icon: Mail, label: 'AI Inbox', page: 'ai-inbox', module: 'ai-email' },
  { icon: MessageSquare, label: 'WhatsApp', page: 'whatsapp', module: 'whatsapp-integration' },
  { icon: FolderClosed, label: 'Documenten', page: 'documenten', minTier: 'basis' },
]

export function getTierRank(tier: SubscriptionTier | undefined | null): number {
  if (!tier) return 0
  const ranks: Record<SubscriptionTier, number> = { basis: 1, groei: 2, premium: 3 }
  return ranks[tier]
}

export function canAccessModule(tierOrTiers: SubscriptionTier | SubscriptionTier[] | undefined | null, minTier: SubscriptionTier = 'basis'): boolean {
  if (!tierOrTiers) return minTier === 'basis'
  const tierArray = Array.isArray(tierOrTiers) ? tierOrTiers : [tierOrTiers]
  return tierArray.some(t => getTierRank(t) >= getTierRank(minTier))
}

// Admin navigation items - only visible for admin/ceo users
export const adminNavItems: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Admin Dashboard', page: 'admin', adminOnly: true },
  { icon: Package, label: 'Modules', page: 'admin/modules', adminOnly: true },
  { icon: Users, label: 'Gebruikers', page: 'admin/users', adminOnly: true },
  { icon: CreditCard, label: 'Abonnementen', page: 'admin/subscriptions', adminOnly: true },
  { icon: Receipt, label: 'Betalingen', page: 'admin/payments', adminOnly: true },
  { icon: Tag, label: 'Kortingen', page: 'admin/discounts', adminOnly: true },
  { icon: Mail, label: 'Sjablonen', page: 'admin/templates', adminOnly: true },
  { icon: Ticket, label: 'Support', page: 'admin/tickets', adminOnly: true },
  { icon: Bell, label: 'Meldingen', page: 'admin/notifications', adminOnly: true },
  { icon: BarChart3, label: 'Analytics', page: 'admin/analytics', adminOnly: true },
]

export const bottomNavItems: NavigationItem[] = [
  { icon: Bot, label: 'AI Assistant', page: 'ai-assistant', minTier: 'groei' },
  { icon: Crown, label: 'Abonnement', page: 'abonnement', minTier: 'basis' },
  { icon: Settings, label: 'Instellingen', page: 'instellingen', minTier: 'basis' },
  { icon: LogOut, label: 'Uitloggen', page: undefined },
]

export const validPages = new Set<string>([
  ...(navigationItems.map((i) => i.page).filter(Boolean) as string[]),
  ...(bottomNavItems.map((i) => i.page).filter(Boolean) as string[]),
  ...(adminNavItems.map((i) => i.page).filter(Boolean) as string[]),
])

export const pageLabelById = new Map<string, string>(
  [...navigationItems, ...bottomNavItems, ...adminNavItems]
    .filter((i) => i.page)
    .map((i) => [i.page as string, i.label])
)

