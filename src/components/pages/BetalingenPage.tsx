'use client'
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useDashboardQueryEnum } from '@/hooks/use-dashboard-query-state'

// Sample Data
const teOntvangenBetalingen = [
  { id: 1, factuurNr: "2025-001", bedrijf: "ACME BV", bedrag: 8500, vervaldatum: "15 Feb 2025", status: "Openstaand", dagenOver: 3 },
  { id: 2, factuurNr: "2025-002", bedrijf: "Global Solutions", bedrag: 4200, vervaldatum: "12 Feb 2025", status: "Vervallen", dagenOver: -1 },
  { id: 3, factuurNr: "2025-003", bedrijf: "TechStart NV", bedrag: 12000, vervaldatum: "20 Feb 2025", status: "Openstaand", dagenOver: 8 },
  { id: 4, factuurNr: "2025-004", bedrijf: "DigitalPro", bedrag: 3700, vervaldatum: "22 Feb 2025", status: "Openstaand", dagenOver: 10 },
  { id: 5, factuurNr: "2025-005", bedrijf: "WebCraft BV", bedrag: 5200, vervaldatum: "25 Feb 2025", status: "Openstaand", dagenOver: 13 },
]

const teBetalenBetalingen = [
  { id: 1, factuurNr: "INV-8821", leverancier: "AWS", bedrag: 1250, vervaldatum: "14 Feb 2025", status: "Openstaand", dagenOver: 2 },
  { id: 2, factuurNr: "INV-8832", leverancier: "Google Ads", bedrag: 3500, vervaldatum: "18 Feb 2025", status: "Openstaand", dagenOver: 6 },
  { id: 3, factuurNr: "INV-8845", leverancier: "Microsoft", bedrag: 890, vervaldatum: "20 Feb 2025", status: "Openstaand", dagenOver: 8 },
  { id: 4, factuurNr: "INV-8856", leverancier: "Slack", bedrag: 450, vervaldatum: "22 Feb 2025", status: "Openstaand", dagenOver: 10 },
]

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Betaald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    Openstaand: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Vervallen: "bg-red-500/10 text-red-600 border-red-500/20",
  }

  return (
    <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium", styles[status])}>
      {status}
    </span>
  )
}

// Days Left Badge
function DaysLeftBadge({ dagenOver }: { dagenOver: number }) {
  if (dagenOver < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-2 py-1 rounded-full">
        <AlertTriangle className="w-3 h-3" />
        {Math.abs(dagenOver)} dag(en) te laat
      </span>
    )
  } else if (dagenOver <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">
        <Clock className="w-3 h-3" />
        {dagenOver} dag(en)
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
      <Clock className="w-3 h-3" />
      {dagenOver} dag(en)
    </span>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  gradient,
  alert = false
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
  gradient: string
  alert?: boolean
}) {
  return (
    <div className="group relative">
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        gradient
      )} />
      <div className={cn(
        "relative bg-card/60 backdrop-blur-xl border rounded-2xl p-5 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300",
        alert ? "border-red-500/20 hover:shadow-red-500/10" : "border-border/30"
      )}>
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl shadow-lg", `bg-linear-to-br ${gradient}`)}>
            <Icon className="w-5 h-5" style={{ color: color }} />
          </div>
          {alert && (
            <div className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-600 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">€{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

// Payment Card Component
function PaymentCard({
  item,
  type
}: {
  item: typeof teOntvangenBetalingen[0] | typeof teBetalenBetalingen[0]
  type: 'in' | 'out'
}) {
  const isTeOntvangen = type === 'in'
  const bedrijf = isTeOntvangen ? (item as typeof teOntvangenBetalingen[0]).bedrijf : (item as typeof teBetalenBetalingen[0]).leverancier

  return (
    <div className="group h-full bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-5 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            isTeOntvangen ? "bg-emerald-500/10" : "bg-red-500/10"
          )}>
            {isTeOntvangen ? (
              <ArrowDownRight className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">{bedrijf}</p>
            <p className="text-sm text-muted-foreground">Factuur #{item.factuurNr}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-lg font-bold",
            isTeOntvangen ? "text-emerald-600" : "text-red-600"
          )}>
            {isTeOntvangen ? '+' : '-'}€{item.bedrag.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Vervalt: {item.vervaldatum}
        </div>
        <DaysLeftBadge dagenOver={item.dagenOver} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <StatusBadge status={item.status} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-card/60 hover:bg-card/75 border-border/30"
            onClick={() =>
              toast({
                title: 'Betaling Details',
                description: `Details voor factuur ${item.factuurNr} worden geopend.`,
              })
            }
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Details
          </Button>
          <Button
            size="sm"
            className={cn(
              "h-8 text-xs text-white shadow-lg transition-all duration-200",
              isTeOntvangen
                ? "bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25"
                : "bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25"
            )}
            onClick={() =>
              toast({
                title: isTeOntvangen ? 'Markeer Betaald' : 'Betaal Nu',
                description: `Actie voor factuur ${item.factuurNr} wordt verwerkt.`,
              })
            }
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {isTeOntvangen ? 'Markeer betaald' : 'Betaal nu'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function BetalingenPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [activeTab, setActiveTab] = useDashboardQueryEnum(
    'betalingen_tab',
    'te-ontvangen',
    ['te-ontvangen', 'te-betalen'] as const
  )
  const [statusFilter, setStatusFilter] = useDashboardQueryEnum(
    'betalingen_status',
    'alle',
    ['alle', 'openstaand', 'vervallen', 'betaald'] as const
  )
  const [periodeFilter, setPeriodeFilter] = useDashboardQueryEnum(
    'betalingen_periode',
    'deze-maand',
    ['deze-maand', 'vorige-maand', 'dit-kwartaal', 'dit-jaar'] as const
  )
  const referenceDate = new Date('2025-02-13T12:00:00')

  const isInSelectedPeriod = (rawDate: string) => {
    const parsedDate = new Date(rawDate)
    if (Number.isNaN(parsedDate.getTime())) return false

    const sameMonth =
      parsedDate.getFullYear() === referenceDate.getFullYear() &&
      parsedDate.getMonth() === referenceDate.getMonth()

    if (periodeFilter === 'deze-maand') return sameMonth

    if (periodeFilter === 'vorige-maand') {
      const previousMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1)
      return (
        parsedDate.getFullYear() === previousMonth.getFullYear() &&
        parsedDate.getMonth() === previousMonth.getMonth()
      )
    }

    if (periodeFilter === 'dit-kwartaal') {
      const currentQuarter = Math.floor(referenceDate.getMonth() / 3)
      return (
        parsedDate.getFullYear() === referenceDate.getFullYear() &&
        Math.floor(parsedDate.getMonth() / 3) === currentQuarter
      )
    }

    return parsedDate.getFullYear() === referenceDate.getFullYear()
  }

  const applyFilters = <T extends { status: string; vervaldatum: string }>(items: T[]) => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'alle' || item.status.toLowerCase() === statusFilter
      return matchesStatus && isInSelectedPeriod(item.vervaldatum)
    })
  }

  const filteredTeOntvangenBetalingen = applyFilters(teOntvangenBetalingen)
  const filteredTeBetalenBetalingen = applyFilters(teBetalenBetalingen)
  const totalTeOntvangen = filteredTeOntvangenBetalingen.reduce((sum, item) => sum + item.bedrag, 0)
  const totalTeBetalen = filteredTeBetalenBetalingen.reduce((sum, item) => sum + item.bedrag, 0)
  const vandaagVervallenTotaal = [...filteredTeOntvangenBetalingen, ...filteredTeBetalenBetalingen]
    .filter((item) => item.dagenOver < 0)
    .reduce((sum, item) => sum + item.bedrag, 0)
  const dezeWeekTotaal = [...filteredTeOntvangenBetalingen, ...filteredTeBetalenBetalingen]
    .filter((item) => item.dagenOver >= 0 && item.dagenOver <= 7)
    .reduce((sum, item) => sum + item.bedrag, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Betalingen</h1>
          <p className="text-muted-foreground text-sm mt-1">Beheer inkomende en uitgaande betalingen</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'alle' | 'openstaand' | 'vervallen' | 'betaald')
            }
            className="px-3 py-2 text-sm bg-card/60 backdrop-blur-xl border border-border/30 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="alle">Alle statussen</option>
            <option value="openstaand">Openstaand</option>
            <option value="vervallen">Vervallen</option>
            <option value="betaald">Betaald</option>
          </select>

          {/* Periode Filter */}
          <select
            value={periodeFilter}
            onChange={(e) =>
              setPeriodeFilter(e.target.value as 'deze-maand' | 'vorige-maand' | 'dit-kwartaal' | 'dit-jaar')
            }
            className="px-3 py-2 text-sm bg-card/60 backdrop-blur-xl border border-border/30 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="deze-maand">Deze maand</option>
            <option value="vorige-maand">Vorige maand</option>
            <option value="dit-kwartaal">Dit kwartaal</option>
            <option value="dit-jaar">Dit jaar</option>
          </select>

          <Button
            variant="outline"
            className="bg-card/60 backdrop-blur-xl border-border/30 hover:bg-card/75"
            onClick={() =>
              toast({
                title: 'Exporteren',
                description: 'Export wordt voorbereid.',
              })
            }
          >
            <Download className="w-4 h-4 mr-2" />
            Exporteren
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Te ontvangen"
          value={totalTeOntvangen}
          icon={ArrowDownRight}
          color="#10b981"
          gradient="from-emerald-500/20 to-emerald-600/10"
        />
        <StatCard
          title="Te betalen"
          value={totalTeBetalen}
          icon={ArrowUpRight}
          color="#ef4444"
          gradient="from-red-500/20 to-red-600/10"
        />
        <StatCard
          title="Vandaag vervallen"
          value={vandaagVervallenTotaal}
          icon={AlertTriangle}
          color="#f59e0b"
          gradient="from-amber-500/20 to-amber-600/10"
          alert
        />
        <StatCard
          title="Deze week"
          value={dezeWeekTotaal}
          icon={Calendar}
          color="#3b82f6"
          gradient="from-blue-500/20 to-blue-600/10"
        />
      </div>

      {/* Tabs Section */}
      <div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'te-ontvangen' | 'te-betalen')}
          className="w-full"
        >
          <TabsList className="bg-card/60 backdrop-blur-xl border border-border/30 p-1 mb-6">
            <TabsTrigger
              value="te-ontvangen"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Te ontvangen
              <Badge variant="secondary" className="ml-2 bg-inverse/20 text-inherit">
                {filteredTeOntvangenBetalingen.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="te-betalen"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Te betalen
              <Badge variant="secondary" className="ml-2 bg-inverse/20 text-inherit">
                {filteredTeBetalenBetalingen.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="te-ontvangen" className="space-y-4">
            {filteredTeOntvangenBetalingen.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {filteredTeOntvangenBetalingen.map((item) => (
                  <PaymentCard key={item.id} item={item} type="in" />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/30 bg-card/60 p-8 text-center text-sm text-muted-foreground">
                Geen te ontvangen betalingen voor de gekozen filters.
              </div>
            )}
          </TabsContent>

          <TabsContent value="te-betalen" className="space-y-4">
            {filteredTeBetalenBetalingen.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {filteredTeBetalenBetalingen.map((item) => (
                  <PaymentCard key={item.id} item={item} type="out" />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/30 bg-card/60 p-8 text-center text-sm text-muted-foreground">
                Geen te betalen posten voor de gekozen filters.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Summary Card */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Betaaloverzicht</h3>
            <p className="text-white/80 text-sm">
              U heeft <span className="text-emerald-400 font-semibold">€{totalTeOntvangen.toLocaleString()}</span> te ontvangen en <span className="text-red-400 font-semibold">€{totalTeBetalen.toLocaleString()}</span> te betalen
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-inverse/10 rounded-xl">
              <p className="text-2xl font-bold text-emerald-400">
                €{(totalTeOntvangen - totalTeBetalen).toLocaleString()}
              </p>
              <p className="text-xs text-white/70">Netto positief</p>
            </div>
            <Button
              className="bg-inverse text-inverse-foreground hover:bg-inverse/90 shadow-lg transition-all duration-200"
              onClick={() =>
                toast({
                  title: 'Betaaloverzicht',
                  description: 'Betaaloverzicht wordt geopend.',
                })
              }
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Betaaloverzicht
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
