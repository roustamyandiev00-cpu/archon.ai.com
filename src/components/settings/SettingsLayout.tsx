'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Building2,
  Users,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsSection {
  title: string
  items: {
    id: string
    label: string
    href: string
    icon: LucideIcon
    description?: string
  }[]
}

const settingsSections: SettingsSection[] = [
  {
    title: 'Mijn Account',
    items: [
      { id: 'profile', label: 'Persoonlijke voorkeuren', href: '/instellingen', icon: User, description: 'Naam, email, tijdzone' },
      { id: 'company', label: 'Uw bedrijven', href: '/instellingen/bedrijven', icon: Building2, description: 'Bedrijfsgegevens beheren' },
      { id: 'users', label: 'Gebruikersbeheer', href: '/instellingen/gebruikers', icon: Users, description: 'Teamleden uitnodigen' },
    ],
  },
  {
    title: 'Bedrijf',
    items: [
      { id: 'notifications', label: 'Notificaties', href: '/instellingen/notificaties', icon: Bell, description: 'Email en push notificaties' },
      { id: 'security', label: 'Beveiliging', href: '/instellingen/beveiliging', icon: Shield, description: 'Wachtwoord en 2FA' },
      { id: 'billing', label: 'Facturering', href: '/instellingen/facturering', icon: CreditCard, description: 'Abonnement en betalingen' },
    ],
  },
  {
    title: 'Voorkeuren',
    items: [
      { id: 'appearance', label: 'Uiterlijk', href: '/instellingen/uiterlijk', icon: Palette, description: 'Thema en kleuren' },
      { id: 'language', label: 'Taal en regio', href: '/instellingen/taal', icon: Globe, description: 'Taal, valuta, datumformaat' },
    ],
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function SettingsLayout({ children, title, description }: SettingsLayoutProps) {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar - Pipedrive Style */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-4 space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-primary" />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="bg-card rounded-xl border shadow-sm">
          {/* Header */}
          <div className="border-b px-6 py-4">
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  return (
    <div className="border-b mb-6">
      <nav className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
