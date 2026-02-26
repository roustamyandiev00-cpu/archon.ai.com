'use client'

import { useMemo, useState } from'react'
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
 Loader2,
 Receipt,
} from'lucide-react'
import { Button } from'@/components/ui/button'
import { Badge } from'@/components/ui/badge'
import { toast } from'@/hooks/use-toast'
import { cn } from'@/lib/utils'
import { usePayments, type Betaling } from'@/hooks/use-payments'

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
 const statusMap: Record<string, { style: string; label: string }> = {
 paid: { style:'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label:'Betaald'},
 pending: { style:'bg-blue-500/10 text-blue-600 border-blue-500/20', label:'In behandeling'},
 open: { style:'bg-blue-500/10 text-blue-600 border-blue-500/20', label:'Openstaand'},
 failed: { style:'bg-red-500/10 text-red-600 border-red-500/20', label:'Mislukt'},
 refunded: { style:'bg-amber-500/10 text-amber-600 border-amber-500/20', label:'Terugbetaald'},
 }
 const { style, label } = statusMap[status] ?? { style:'bg-muted text-muted-foreground', label: status }

 return (
 <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', style)}>
 {label}
 </span>
 )
}

// Payment Row Component
function PaymentRow({ betaling }: { betaling: Betaling }) {
 const formattedDate = betaling.paidAt
 ? new Date(betaling.paidAt).toLocaleDateString('nl-NL', {
 day:'numeric',
 month:'short',
 year:'numeric',
 })
 : new Date(betaling.createdAt).toLocaleDateString('nl-NL', {
 day:'numeric',
 month:'short',
 year:'numeric',
 })

 return (
 <div className="group flex items-center justify-between p-4 bg-card shadow-sm border border-border/50 rounded-xl hover:shadow-lg hover:bg-card shadow-sm transition-all duration-300">
 <div className="flex items-center gap-4">
 <div className="p-3 rounded-xl bg-emerald-500/10">
 <ArrowDownRight className="w-5 h-5 text-emerald-600"/>
 </div>
 <div>
 <p className="font-semibold text-foreground">
 {betaling.currency ==='EUR'?'€': betaling.currency}
 {betaling.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
 </p>
 <p className="text-sm text-muted-foreground">
 Betaling via {betaling.method}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Calendar className="w-4 h-4"/>
 {formattedDate}
 </div>
 <StatusBadge status={betaling.status} />
 {betaling.invoiceUrl && (
 <Button
 variant="outline"
 size="sm"
 className="h-8 text-xs bg-card shadow-sm hover:bg-card shadow-sm border-border/50"
 asChild
 >
 <a href={betaling.invoiceUrl} target="_blank"rel="noopener noreferrer">
 <Eye className="w-3.5 h-3.5 mr-1"/>
 Factuur
 </a>
 </Button>
 )}
 </div>
 </div>
 )
}

// Stat Card Component
function StatCard({
 title,
 value,
 icon: Icon,
 color,
 gradient,
 alert = false,
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
 <div
 className={cn(
'absolute inset-0 rounded-2xl bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
 gradient
 )}
 />
 <div
 className={cn(
'relative bg-card shadow-sm border rounded-2xl p-5 hover:shadow-xl hover:bg-card shadow-sm transition-[background-color,box-shadow,border-color] duration-300',
 alert ?'border-red-500/20 hover:shadow-red-500/10':'border-border/50'
 )}
 >
 <div className="flex items-start justify-between mb-4">
 <div className={cn('p-3 rounded-xl shadow-lg', `bg-linear-to-br ${gradient}`)}>
 <Icon className="w-5 h-5"style={{ color: color }} />
 </div>
 {alert && (
 <div className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-600 animate-pulse">
 <AlertTriangle className="w-3.5 h-3.5"/>
 </div>
 )}
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">{title}</p>
 <p className="text-2xl font-bold text-foreground">
 €{value.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
 </p>
 </div>
 </div>
 </div>
 )
}

// Helper functie voor datum filters
function getDateRange(filter: string): { startDate?: string; endDate?: string } {
 const now = new Date()
 const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
 const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
 const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
 const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
 const startOfYear = new Date(now.getFullYear(), 0, 1)

 switch (filter) {
 case'deze-maand':
 return { startDate: startOfMonth.toISOString() }
 case'vorige-maand':
 return {
 startDate: startOfLastMonth.toISOString(),
 endDate: endOfLastMonth.toISOString(),
 }
 case'dit-kwartaal':
 return { startDate: startOfQuarter.toISOString() }
 case'dit-jaar':
 return { startDate: startOfYear.toISOString() }
 default:
 return {}
 }
}

export default function BetalingenPage() {
 const [statusFilter, setStatusFilter] = useState<string>('alle')
 const [periodeFilter, setPeriodeFilter] = useState<string>('alle')

 const dateRange = useMemo(() => getDateRange(periodeFilter), [periodeFilter])

 const { payments, isLoading, isError, totalAmount } = usePayments({
 ...dateRange,
 status: statusFilter ==='alle'? undefined : statusFilter,
 })

 // Bereken statistieken
 const betaaldBedrag = useMemo(
 () => payments.filter((p) => p.status ==='paid').reduce((sum, p) => sum + p.amount, 0),
 [payments]
 )

 const openstaandBedrag = useMemo(
 () => payments.filter((p) => p.status ==='open'|| p.status ==='pending').reduce((sum, p) => sum + p.amount, 0),
 [payments]
 )

 const dezeWeek = useMemo(() => {
 const now = new Date()
 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
 return payments
 .filter((p) => {
 const date = new Date(p.createdAt)
 return date >= weekAgo && date <= now
 })
 .reduce((sum, p) => sum + p.amount, 0)
 }, [payments])

 if (isError) {
 return (
 <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
 <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
 <h2 className="text-lg font-semibold text-red-600">Fout bij laden</h2>
 <p className="text-muted-foreground mt-2">Kon betalingen niet laden. Probeer het later opnieuw.</p>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-foreground">Betalingen</h1>
 <p className="text-muted-foreground text-sm mt-1">Overzicht van alle betalingen</p>
 </div>
 <div className="flex flex-wrap gap-3">
 {/* Status Filter */}
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-3 py-2 text-sm bg-card shadow-sm border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 >
 <option value="alle">Alle statussen</option>
 <option value="paid">Betaald</option>
 <option value="open">Openstaand</option>
 <option value="pending">In behandeling</option>
 <option value="failed">Mislukt</option>
 <option value="refunded">Terugbetaald</option>
 </select>

 {/* Periode Filter */}
 <select
 value={periodeFilter}
 onChange={(e) => setPeriodeFilter(e.target.value)}
 className="px-3 py-2 text-sm bg-card shadow-sm border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 >
 <option value="alle">Alle periodes</option>
 <option value="deze-maand">Deze maand</option>
 <option value="vorige-maand">Vorige maand</option>
 <option value="dit-kwartaal">Dit kwartaal</option>
 <option value="dit-jaar">Dit jaar</option>
 </select>

 <Button
 variant="outline"
 className="bg-card shadow-sm border-border/50 hover:bg-card shadow-sm"
 onClick={() =>
 toast({
 title:'Exporteren',
 description:'Export wordt voorbereid.',
 })
 }
 >
 <Download className="w-4 h-4 mr-2"/>
 Exporteren
 </Button>
 </div>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 <StatCard
 title="Totaal"
 value={totalAmount}
 icon={CreditCard}
 color="#6366f1"
 gradient="from-indigo-500/20 to-indigo-600/10"
 />
 <StatCard
 title="Betaald"
 value={betaaldBedrag}
 icon={CheckCircle2}
 color="#10b981"
 gradient="from-emerald-500/20 to-emerald-600/10"
 />
 <StatCard
 title="Openstaand"
 value={openstaandBedrag}
 icon={Clock}
 color="#f59e0b"
 gradient="from-amber-500/20 to-amber-600/10"
 />
 <StatCard
 title="Deze week"
 value={dezeWeek}
 icon={Calendar}
 color="#3b82f6"
 gradient="from-blue-500/20 to-blue-600/10"
 />
 </div>

 {/* Payments List */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
 <Receipt className="w-5 h-5"/>
 Betalingen
 <Badge variant="secondary"className="ml-2">
 {payments.length}
 </Badge>
 </h2>
 </div>

 {isLoading ? (
 <div className="flex items-center justify-center h-64">
 <Loader2 className="w-8 h-8 animate-spin text-primary"/>
 </div>
 ) : payments.length > 0 ? (
 <div className="space-y-3">
 {payments.map((betaling) => (
 <PaymentRow key={betaling.id} betaling={betaling} />
 ))}
 </div>
 ) : (
 <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-8 text-center text-sm text-muted-foreground">
 <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50"/>
 <p>Geen betalingen gevonden voor de gekozen filters.</p>
 </div>
 )}
 </div>

 {/* Totaal onderaan */}
 <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div className="space-y-2">
 <h3 className="text-lg font-semibold">Totaal overzicht</h3>
 <p className="text-white/80 text-sm">
 {payments.length} betaling(en) met een totale waarde van{''}
 <span className="text-emerald-400 font-semibold">
 €{totalAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
 </span>
 </p>
 </div>
 <div className="flex items-center gap-4">
 <div className="text-center px-6 py-3 bg-inverse/10 rounded-xl">
 <p className="text-3xl font-bold text-emerald-400">
 €{totalAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
 </p>
 <p className="text-xs text-white/70">Totaal bedrag</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
