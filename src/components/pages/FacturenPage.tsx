'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'

import { PageEmptyState, PageInlineError } from '@/components/dashboard/PageStates'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import AddFactuurModal from '@/components/modals/AddFactuurModal'

function parseDimension(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) return NaN;
  return parsed;
}

type FactuurStatus = 'Concept' | 'Verzonden' | 'Openstaand' | 'Achterstallig' | 'Betaald' | 'Gecrediteerd' | 'Geannuleerd'

type BetalingsMethode = 'Bankoverschrijving' | 'Contant' | 'Creditcard' | 'iDEAL' | 'Bancontact'

interface TimelineEvent {
  id: string
  type: 'created' | 'sent' | 'reminder' | 'paid' | 'creditnote'
  date: string
  description: string
  user?: string
}

interface FactuurItem {
  id: string
  omschrijving: string
  aantal: number
  prijs: number
  btw: number
}

interface Factuur {
  id: string
  nummer: string
  klant: string
  klantEmail: string
  bedrag: number
  btwBedrag: number
  totaalBedrag: number
  datum: string
  vervalDatum: string
  status: FactuurStatus
  betaaldOp: string | null
  betaalMethode: BetalingsMethode | null
  items: FactuurItem[]
  timeline: TimelineEvent[]
  herinneringenVerstuurd: number
  pdfUrl: string | null
  notities: string
  createdAt: string
}

// Sample data
const sampleFacturen: Factuur[] = [
  {
    id: '1',
    nummer: 'F-2024-001',
    klant: 'Janssen BV',
    klantEmail: 'info@janssenbv.nl',
    bedrag: 2500,
    btwBedrag: 525,
    totaalBedrag: 3025,
    datum: '2024-02-01',
    vervalDatum: '2024-02-15',
    status: 'Betaald',
    betaaldOp: '2024-02-10',
    betaalMethode: 'Bankoverschrijving',
    items: [
      { id: '1', omschrijving: 'Consultancy werkzaamheden', aantal: 10, prijs: 150, btw: 21 },
      { id: '2', omschrijving: 'Reiskosten', aantal: 1, prijs: 1000, btw: 21 },
    ],
    timeline: [
      { id: '1', type: 'created', date: '2024-02-01T10:00:00Z', description: 'Factuur aangemaakt', user: 'Pieter' },
      { id: '2', type: 'sent', date: '2024-02-01T11:30:00Z', description: 'Factuur verzonden naar info@janssenbv.nl', user: 'Pieter' },
      { id: '3', type: 'paid', date: '2024-02-10T14:20:00Z', description: 'Betaling ontvangen via bankoverschrijving', user: 'Systeem' },
    ],
    herinneringenVerstuurd: 0,
    pdfUrl: null,
    notities: '',
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '2',
    nummer: 'F-2024-002',
    klant: 'De Vries Constructie',
    klantEmail: 'admin@devries.nl',
    bedrag: 8500,
    btwBedrag: 1785,
    totaalBedrag: 10285,
    datum: '2024-02-05',
    vervalDatum: '2024-03-06',
    status: 'Openstaand',
    betaaldOp: null,
    betaalMethode: null,
    items: [
      { id: '1', omschrijving: 'Project renovatie keuken', aantal: 1, prijs: 8500, btw: 21 },
    ],
    timeline: [
      { id: '1', type: 'created', date: '2024-02-05T09:00:00Z', description: 'Factuur aangemaakt', user: 'Pieter' },
      { id: '2', type: 'sent', date: '2024-02-05T09:15:00Z', description: 'Factuur verzonden naar admin@devries.nl', user: 'Pieter' },
    ],
    herinneringenVerstuurd: 0,
    pdfUrl: null,
    notities: 'Betaling verwacht binnen 30 dagen',
    createdAt: '2024-02-05T09:00:00Z',
  },
  {
    id: '3',
    nummer: 'F-2024-003',
    klant: 'Bakkerij Van Dam',
    klantEmail: 'bestelling@bakkerijvandam.nl',
    bedrag: 450,
    btwBedrag: 94.5,
    totaalBedrag: 544.5,
    datum: '2024-01-15',
    vervalDatum: '2024-02-14',
    status: 'Achterstallig',
    betaaldOp: null,
    betaalMethode: null,
    items: [
      { id: '1', omschrijving: 'Maandelijkse IT support', aantal: 1, prijs: 450, btw: 21 },
    ],
    timeline: [
      { id: '1', type: 'created', date: '2024-01-15T08:00:00Z', description: 'Factuur aangemaakt', user: 'Pieter' },
      { id: '2', type: 'sent', date: '2024-01-15T08:30:00Z', description: 'Factuur verzonden', user: 'Pieter' },
      { id: '3', type: 'reminder', date: '2024-02-20T10:00:00Z', description: 'Betalingsherinnering verstuurd', user: 'Systeem' },
    ],
    herinneringenVerstuurd: 1,
    pdfUrl: null,
    notities: 'Klant heeft beloofd volgende week te betalen',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '4',
    nummer: 'F-2024-004',
    klant: 'TechStart Solutions',
    klantEmail: 'finance@techstart.nl',
    bedrag: 3200,
    btwBedrag: 672,
    totaalBedrag: 3872,
    datum: '2024-02-10',
    vervalDatum: '2024-02-24',
    status: 'Verzonden',
    betaaldOp: null,
    betaalMethode: null,
    items: [
      { id: '1', omschrijving: 'Software ontwikkeling - Fase 1', aantal: 40, prijs: 80, btw: 21 },
    ],
    timeline: [
      { id: '1', type: 'created', date: '2024-02-10T13:00:00Z', description: 'Factuur aangemaakt', user: 'Pieter' },
      { id: '2', type: 'sent', date: '2024-02-10T13:15:00Z', description: 'Factuur verzonden naar finance@techstart.nl', user: 'Pieter' },
    ],
    herinneringenVerstuurd: 0,
    pdfUrl: null,
    notities: '',
    createdAt: '2024-02-10T13:00:00Z',
  },
  {
    id: '5',
    nummer: 'F-2024-005',
    klant: 'Marketing Masters',
    klantEmail: 'info@marketingmasters.nl',
    bedrag: 1200,
    btwBedrag: 252,
    totaalBedrag: 1452,
    datum: '2024-02-12',
    vervalDatum: '2024-02-26',
    status: 'Concept',
    betaaldOp: null,
    betaalMethode: null,
    items: [
      { id: '1', omschrijving: 'Advies uren marketing strategie', aantal: 8, prijs: 150, btw: 21 },
    ],
    timeline: [
      { id: '1', type: 'created', date: '2024-02-12T15:00:00Z', description: 'Factuur aangemaakt als concept', user: 'Pieter' },
    ],
    herinneringenVerstuurd: 0,
    pdfUrl: null,
    notities: 'Nog te controleren voor verzending',
    createdAt: '2024-02-12T15:00:00Z',
  },
]

const statusTabs = [
  { value: 'Alle', label: 'Alle' },
  { value: 'Concept', label: 'Concept' },
  { value: 'Verzonden', label: 'Verzonden' },
  { value: 'Openstaand', label: 'Openstaand' },
  { value: 'Achterstallig', label: 'Achterstallig' },
  { value: 'Betaald', label: 'Betaald' },
  { value: 'Gecrediteerd', label: 'Gecrediteerd' },
  { value: 'Geannuleerd', label: 'Geannuleerd' },
] as const

function formatDate(dateValue: string | null) {
  if (!dateValue) return '-'
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('nl-NL')
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function parseNumericFilter(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(normalized) || normalized < 0) return null
  return normalized
}

function getStatusBadgeStyles(status: FactuurStatus) {
  const styles: Record<FactuurStatus, string> = {
    'Concept': 'bg-gray-100 text-gray-700 border-gray-200',
    'Verzonden': 'bg-blue-100 text-blue-700 border-blue-200',
    'Openstaand': 'bg-orange-100 text-orange-700 border-orange-200',
    'Achterstallig': 'bg-red-100 text-red-700 border-red-200',
    'Betaald': 'bg-green-100 text-green-700 border-green-200',
    'Gecrediteerd': 'bg-purple-100 text-purple-700 border-purple-200',
    'Geannuleerd': 'bg-gray-100 text-gray-500 border-gray-200 line-through',
  }
  return styles[status]
}

function getStatusIcon(status: FactuurStatus) {
  switch (status) {
    case 'Concept':
      return <Clock className="w-3 h-3" />
    case 'Verzonden':
      return <Send className="w-3 h-3" />
    case 'Openstaand':
      return <AlertCircle className="w-3 h-3" />
    case 'Achterstallig':
      return <AlertCircle className="w-3 h-3" />
    case 'Betaald':
      return <CheckCircle2 className="w-3 h-3" />
    case 'Gecrediteerd':
      return <CreditCard className="w-3 h-3" />
    case 'Geannuleerd':
      return <X className="w-3 h-3" />
  }
}

function KPICard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <Card className="bg-card/60 backdrop-blur-xl border-border/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const icons = {
    created: <FileText className="w-4 h-4" />,
    sent: <Send className="w-4 h-4" />,
    reminder: <Mail className="w-4 h-4" />,
    paid: <CheckCircle2 className="w-4 h-4" />,
    creditnote: <CreditCard className="w-4 h-4" />,
  }

  const colors = {
    created: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-600',
    reminder: 'bg-orange-100 text-orange-600',
    paid: 'bg-green-100 text-green-600',
    creditnote: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="flex gap-4 pb-4 border-l-2 border-border/30 pl-4 last:pb-0 last:border-0 relative">
      <div className={cn("absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center", colors[event.type])}>
        {icons[event.type]}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{event.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(event.date).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
          {event.user && ` • ${event.user}`}
        </p>
      </div>
    </div>
  )
}

export default function FacturenPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusTab, setStatusTab] = useState<string>('Alle')
  const [klantFilter, setKlantFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dueDateFrom, setDueDateFrom] = useState('')
  const [dueDateTo, setDueDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [showPaidStatus, setShowPaidStatus] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [facturen, setFacturen] = useState<Factuur[]>([])
  const [selectedFactuur, setSelectedFactuur] = useState<Factuur | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Auto-open create modal when prop is true
  useEffect(() => {
    if (autoOpenCreate && !createOpen) {
      setCreateOpen(true)
    }
  }, [autoOpenCreate, createOpen])

  // Fetch invoices from API
  const fetchFacturen = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/facturen', { cache: 'no-store' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon facturen niet laden.')
      }
      const data = await response.json()
      setFacturen(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message ?? 'Onbekende fout tijdens laden van facturen.')
      setFacturen([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchFacturen()
  }, [fetchFacturen])

  const filteredFacturen = useMemo(() => {
    const minAmount = parseNumericFilter(amountMin)
    const maxAmount = parseNumericFilter(amountMax)

    return facturen.filter((factuur) => {
      const matchesSearch =
        factuur.nummer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        factuur.klant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        factuur.klantEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusTab === 'Alle' || factuur.status === statusTab;
      const matchesKlant = !klantFilter || factuur.klant.toLowerCase().includes(klantFilter.toLowerCase());

      const invoiceDate = new Date(factuur.datum);
      const matchesDateFrom = !dateFrom || invoiceDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || invoiceDate <= new Date(dateTo);

      const invoiceDueDate = new Date(factuur.vervalDatum);
      const matchesDueDateFrom = !dueDateFrom || invoiceDueDate >= new Date(dueDateFrom);
      const matchesDueDateTo = !dueDateTo || invoiceDueDate <= new Date(dueDateTo);

      const matchesAmount = (
        (!minAmount || factuur.totaalBedrag >= minAmount) &&
        (!maxAmount || factuur.totaalBedrag <= maxAmount)
      );

      const matchesOverdue = !showOverdueOnly || (factuur.status === 'Achterstallig' && new Date(factuur.vervalDatum) < new Date());

      const matchesPaidStatus =
        showPaidStatus === 'all' ||
        (showPaidStatus === 'paid' && factuur.status === 'Betaald') ||
        (showPaidStatus === 'unpaid' && factuur.status !== 'Betaald' && factuur.status !== 'Gecrediteerd' && factuur.status !== 'Geannuleerd');

      return (
        matchesSearch &&
        matchesStatus &&
        matchesKlant &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesDueDateFrom &&
        matchesDueDateTo &&
        matchesAmount &&
        matchesOverdue &&
        matchesPaidStatus
      );
    });
  }, [facturen, searchQuery, statusTab, klantFilter, dateFrom, dateTo, dueDateFrom, dueDateTo, amountMin, amountMax, showOverdueOnly, showPaidStatus])

  const kpiData = useMemo(() => {
    const openstaand = facturen.filter(f => f.status === 'Openstaand' || f.status === 'Verzonden')
    const achterstallig = facturen.filter(f => f.status === 'Achterstallig')
    const betaaldDezeMaand = facturen.filter(f => {
      if (f.status !== 'Betaald' || !f.betaaldOp) return false
      const betaaldDate = new Date(f.betaaldOp)
      const now = new Date()
      return betaaldDate.getMonth() === now.getMonth() && betaaldDate.getFullYear() === now.getFullYear()
    })
    const teVerzenden = facturen.filter(f => f.status === 'Concept')

    return {
      openstaandBedrag: openstaand.reduce((sum, f) => sum + f.totaalBedrag, 0),
      achterstalligBedrag: achterstallig.reduce((sum, f) => sum + f.totaalBedrag, 0),
      betaaldDezeMaandBedrag: betaaldDezeMaand.reduce((sum, f) => sum + f.totaalBedrag, 0),
      teVerzendenAantal: teVerzenden.length,
    }
  }, [facturen])

  const handleVersturen = useCallback(async (factuur: Factuur) => {
    setIsProcessing(factuur.id)
    try {
      const updatedTimeline = [...factuur.timeline, {
        id: crypto.randomUUID(),
        type: 'sent' as const,
        date: new Date().toISOString(),
        description: `Factuur verzonden naar ${factuur.klantEmail}`,
        user: 'Pieter',
      }]

      const response = await fetch(`/api/facturen/${factuur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Verzonden',
          timeline: JSON.stringify(updatedTimeline),
        }),
      })

      if (!response.ok) throw new Error('Update mislukt')

      const updated = await response.json()
      setFacturen(prev => prev.map(f => f.id === factuur.id ? updated : f))

      toast({
        title: 'Factuur verzonden',
        description: `Factuur ${factuur.nummer} is verstuurd naar ${factuur.klantEmail}.`,
      })
    } catch (error) {
      toast({
        title: 'Verzenden mislukt',
        description: 'Er is een fout opgetreden bij het verzenden.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(null)
    }
  }, [])

  const handleMarkeerBetaald = useCallback(async (factuur: Factuur) => {
    setIsProcessing(factuur.id)
    try {
      const betaaldOp = new Date().toISOString().split('T')[0]
      const updatedTimeline = [...factuur.timeline, {
        id: crypto.randomUUID(),
        type: 'paid' as const,
        date: new Date().toISOString(),
        description: 'Betaling ontvangen via bankoverschrijving',
        user: 'Systeem',
      }]

      const response = await fetch(`/api/facturen/${factuur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Betaald',
          paidAt: betaaldOp,
          paymentMethod: 'Bankoverschrijving',
          timeline: JSON.stringify(updatedTimeline),
        }),
      })

      if (!response.ok) throw new Error('Update mislukt')

      const updated = await response.json()
      setFacturen(prev => prev.map(f => f.id === factuur.id ? updated : f))

      toast({
        title: 'Gemarkeerd als betaald',
        description: `Factuur ${factuur.nummer} is gemarkeerd als betaald.`,
      })
    } catch (error) {
      toast({
        title: 'Actie mislukt',
        description: 'Er is een fout opgetreden.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(null)
    }
  }, [])

  const handleHerinnering = useCallback(async (factuur: Factuur) => {
    setIsProcessing(factuur.id)
    try {
      const updatedTimeline = [...factuur.timeline, {
        id: crypto.randomUUID(),
        type: 'reminder' as const,
        date: new Date().toISOString(),
        description: `Betalingsherinnering #${factuur.herinneringenVerstuurd + 1} verstuurd`,
        user: 'Systeem',
      }]

      const response = await fetch(`/api/facturen/${factuur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remindersSent: factuur.herinneringenVerstuurd + 1,
          timeline: JSON.stringify(updatedTimeline),
        }),
      })

      if (!response.ok) throw new Error('Update mislukt')

      const updated = await response.json()
      setFacturen(prev => prev.map(f => f.id === factuur.id ? updated : f))

      toast({
        title: 'Herinnering verstuurd',
        description: `Betalingsherinnering voor ${factuur.nummer} is verzonden.`,
      })
    } catch (error) {
      toast({
        title: 'Verzenden mislukt',
        description: 'Er is een fout opgetreden.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(null)
    }
  }, [])

  const handleCreditnota = useCallback(async (factuur: Factuur) => {
    setIsProcessing(factuur.id)
    try {
      const updatedTimeline = [...factuur.timeline, {
        id: crypto.randomUUID(),
        type: 'creditnote' as const,
        date: new Date().toISOString(),
        description: `Creditnota aangemaakt voor factuur ${factuur.nummer}`,
        user: 'Pieter',
      }]

      const response = await fetch(`/api/facturen/${factuur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Gecrediteerd',
          timeline: JSON.stringify(updatedTimeline),
        }),
      })

      if (!response.ok) throw new Error('Update mislukt')

      const updated = await response.json()
      setFacturen(prev => prev.map(f => f.id === factuur.id ? updated : f))

      toast({
        title: 'Creditnota aangemaakt',
        description: `Creditnota voor factuur ${factuur.nummer} is aangemaakt.`,
      })
    } catch (error) {
      toast({
        title: 'Actie mislukt',
        description: 'Er is een fout opgetreden.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(null)
    }
  }, [])

  const handleVerwijderen = useCallback(async (factuur: Factuur) => {
    if (factuur.status !== 'Concept') {
      toast({
        title: 'Kan niet verwijderen',
        description: 'Alleen concept facturen kunnen worden verwijderd.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(factuur.id)
    try {
      const response = await fetch(`/api/facturen/${factuur.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Verwijderen mislukt')

      setFacturen(prev => prev.filter(f => f.id !== factuur.id))

      toast({
        title: 'Factuur verwijderd',
        description: `Factuur ${factuur.nummer} is verwijderd.`,
      })
    } catch (error) {
      toast({
        title: 'Verwijderen mislukt',
        description: 'Er is een fout opgetreden.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(null)
    }
  }, [])

  const handleExportPDF = useCallback(async (factuur: Factuur) => {
    try {
      toast({
        title: 'PDF genereren',
        description: `Factuur ${factuur.nummer} wordt gegenereerd...`,
      })

      const response = await fetch(`/api/facturen/${factuur.id}/pdf`, {
        method: 'POST',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon PDF niet genereren.')
      }

      const { pdfUrl } = await response.json()

      // Update the facture in the local state with the PDF URL
      setFacturen(prev => prev.map(f =>
        f.id === factuur.id ? { ...f, pdfUrl } : f
      ))

      // If this is the selected facture, update it too
      if (selectedFactuur?.id === factuur.id) {
        setSelectedFactuur(prev => prev ? { ...prev, pdfUrl } : null)
      }

      // Download the PDF
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `factuur-${factuur.nummer}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'PDF gereed',
        description: `Factuur ${factuur.nummer} is gedownload.`,
      })
    } catch (error: any) {
      console.error('PDF generation error:', error)
      toast({
        title: 'PDF genereren mislukt',
        description: error?.message ?? 'Kon PDF niet genereren.',
        variant: 'destructive',
      })
    }
  }, [selectedFactuur?.id, toast])

  const openDetail = useCallback((factuur: Factuur) => {
    setSelectedFactuur(factuur)
    setDetailOpen(true)
  }, [])

  const handleCreateFactuur = useCallback(async (newFactuur: any) => {
    try {
      const response = await fetch('/api/facturen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFactuur),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon factuur niet aanmaken.')
      }

      const created = await response.json()
      setFacturen(prev => [created, ...prev])

      toast({
        title: 'Factuur aangemaakt',
        description: `Factuur ${created.nummer} is succesvol aangemaakt.`,
      })
    } catch (error: any) {
      toast({
        title: 'Aanmaken mislukt',
        description: error?.message ?? 'Kon factuur niet aanmaken.',
        variant: 'destructive',
      })
      throw error
    }
  }, [])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Alle: facturen.length }
    statusTabs.forEach(tab => {
      if (tab.value !== 'Alle') {
        counts[tab.value] = facturen.filter(f => f.status === tab.value).length
      }
    })
    return counts
  }, [facturen])

  if (error) {
    return <PageInlineError title="Fout" description={error} onRetry={() => setError(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-emerald-500/20 to-teal-500/20">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            Facturen
          </h1>
          <p className="text-muted-foreground mt-1">Beheer uw facturen, betalingen en opvolging centraal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe factuur
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Openstaand bedrag"
          value={formatCurrency(kpiData.openstaandBedrag)}
          icon={AlertCircle}
          color="bg-orange-100 text-orange-600"
        />
        <KPICard
          title="Achterstallig bedrag"
          value={formatCurrency(kpiData.achterstalligBedrag)}
          icon={AlertCircle}
          color="bg-red-100 text-red-600"
        />
        <KPICard
          title="Betaald deze maand"
          value={formatCurrency(kpiData.betaaldDezeMaandBedrag)}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600"
        />
        <KPICard
          title="Facturen te verzenden"
          value={kpiData.teVerzendenAantal.toString()}
          icon={Clock}
          color="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Status Tabs */}
      <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
        <TabsList className="bg-card/60 backdrop-blur-xl border border-border/30 p-1 flex flex-wrap h-auto">
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
            >
              {tab.label}
              {statusCounts[tab.value] > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts[tab.value]})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Zoek op nummer, klant of email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input
            placeholder="Filter op klant..."
            value={klantFilter}
            onChange={(e) => setKlantFilter(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Factuurdatum van"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Factuurdatum tot"
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dueDateFrom}
              onChange={(e) => setDueDateFrom(e.target.value)}
              placeholder="Vervaldatum van"
            />
            <Input
              type="date"
              value={dueDateTo}
              onChange={(e) => setDueDateTo(e.target.value)}
              placeholder="Vervaldatum tot"
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              placeholder="Bedrag min"
            />
            <Input
              type="number"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              placeholder="Bedrag max"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showOverdueOnly"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showOverdueOnly" className="text-sm text-muted-foreground">Alleen achterstallig</label>
          </div>
          <div className="flex items-center gap-2">
            <Select value={showPaidStatus} onValueChange={(v) => setShowPaidStatus(v as 'all' | 'paid' | 'unpaid')}>
              <SelectTrigger>
                <SelectValue placeholder="Betaalstatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle betaalstatussen</SelectItem>
                <SelectItem value="paid">Betaald</SelectItem>
                <SelectItem value="unpaid">Onbetaald</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nummer</TableHead>
              <TableHead>Klant</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Vervaldatum</TableHead>
              <TableHead>Bedrag (incl. btw)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Betaald op</TableHead>
              <TableHead>Herinnering</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFacturen.map((factuur) => (
              <TableRow key={factuur.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{factuur.nummer}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{factuur.klant}</p>
                    <p className="text-xs text-muted-foreground">{factuur.klantEmail}</p>
                  </div>
                </TableCell>
                <TableCell>{formatDate(factuur.datum)}</TableCell>
                <TableCell>
                  <span className={cn(
                    new Date(factuur.vervalDatum) < new Date() && factuur.status !== 'Betaald' &&
                    "text-red-600 font-medium"
                  )}>
                    {formatDate(factuur.vervalDatum)}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(factuur.totaalBedrag)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", getStatusBadgeStyles(factuur.status))}>
                    {getStatusIcon(factuur.status)}
                    {factuur.status}
                  </Badge>
                  {factuur.herinneringenVerstuurd > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {factuur.herinneringenVerstuurd} herinnering{factuur.herinneringenVerstuurd > 1 ? 'en' : ''}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {factuur.betaaldOp ? (
                    <div>
                      <p className="text-green-600">{formatDate(factuur.betaaldOp)}</p>
                      <p className="text-xs text-muted-foreground">{factuur.betaalMethode}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {factuur.herinneringenVerstuurd > 0 ? (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      <AlertCircle className="w-3 h-3 mr-1" /> {factuur.herinneringenVerstuurd}x
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(factuur)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportPDF(factuur)}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {factuur.status === 'Concept' && (
                          <DropdownMenuItem onClick={() => handleVersturen(factuur)}>
                            <Send className="w-4 h-4 mr-2" />
                            Versturen
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFactuur(factuur)
                            setEditModalOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        {(factuur.status === 'Openstaand' || factuur.status === 'Achterstallig') && (
                          <DropdownMenuItem onClick={() => handleHerinnering(factuur)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Herinnering sturen
                          </DropdownMenuItem>
                        )}
                        {factuur.status !== 'Betaald' && factuur.status !== 'Gecrediteerd' && factuur.status !== 'Geannuleerd' && (
                          <DropdownMenuItem onClick={() => handleMarkeerBetaald(factuur)}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Markeer als betaald
                          </DropdownMenuItem>
                        )}
                        {factuur.status === 'Betaald' && (
                          <DropdownMenuItem onClick={() => handleCreditnota(factuur)}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Creditnota maken
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExportPDF(factuur)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        {factuur.status === 'Concept' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleVerwijderen(factuur)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddFactuurModal open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreateFactuur} />

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedFactuur && (
            <>
              <SheetHeader className="pb-4 border-b border-border/30">
                <SheetTitle className="flex items-center gap-2">
                  Factuur {selectedFactuur.nummer}
                  <Badge variant="outline" className={cn(getStatusBadgeStyles(selectedFactuur.status))}>
                    {selectedFactuur.status}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  {selectedFactuur.klant} • {selectedFactuur.klantEmail}
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Bedragen */}
                <div className="bg-card/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotaal</span>
                    <span>{formatCurrency(selectedFactuur.bedrag)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">BTW (21%)</span>
                    <span>{formatCurrency(selectedFactuur.btwBedrag)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/30">
                    <span>Totaal</span>
                    <span>{formatCurrency(selectedFactuur.totaalBedrag)}</span>
                  </div>
                </div>

                {/* Datums */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Factuurdatum</Label>
                    <p className="font-medium">{formatDate(selectedFactuur.datum)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Vervaldatum</Label>
                    <p className={cn("font-medium", new Date(selectedFactuur.vervalDatum) < new Date() && selectedFactuur.status !== 'Betaald' && "text-red-600")}>
                      {formatDate(selectedFactuur.vervalDatum)}
                    </p>
                  </div>
                </div>

                {/* Betaling */}
                {selectedFactuur.betaaldOp && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Betaald</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Betaald op:</span>
                        <p className="font-medium">{formatDate(selectedFactuur.betaaldOp)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Methode:</span>
                        <p className="font-medium">{selectedFactuur.betaalMethode}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Factuur Items */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Factuurregels</h3>
                  {selectedFactuur.items.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Geen factuurregels gevonden.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Omschrijving</TableHead>
                          <TableHead className="text-right">Aantal</TableHead>
                          <TableHead className="text-right">Prijs</TableHead>
                          <TableHead className="text-right">BTW</TableHead>
                          <TableHead className="text-right">Totaal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedFactuur.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.omschrijving}</TableCell>
                            <TableCell className="text-right">{item.aantal}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.prijs)}</TableCell>
                            <TableCell className="text-right">{item.btw}%</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.aantal * item.prijs * (1 + item.btw / 100))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Tijdlijn */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Tijdlijn</h3>
                  {selectedFactuur.timeline.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Geen tijdlijn gegevens.</p>
                  ) : (
                    <div>
                      {selectedFactuur.timeline.map(event => (
                        <TimelineItem key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Bestanden (PDF) */}
                {selectedFactuur.pdfUrl && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Bestanden</h3>
                    <Button variant="outline" asChild>
                      <a href={selectedFactuur.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </a>
                    </Button>
                  </div>
                )}

                {/* Notities */}
                {selectedFactuur.notities && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Notities</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedFactuur.notities}</p>
                  </div>
                )}

                {/* Actie Knoppen in Detailweergave */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
                  {selectedFactuur.status === 'Concept' && (
                    <Button onClick={() => handleVersturen(selectedFactuur)} disabled={isProcessing === selectedFactuur.id}>
                      {isProcessing === selectedFactuur.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Versturen
                    </Button>
                  )}
                  {(selectedFactuur.status === 'Openstaand' || selectedFactuur.status === 'Achterstallig') && (
                    <Button variant="outline" onClick={() => handleHerinnering(selectedFactuur)} disabled={isProcessing === selectedFactuur.id}>
                      {isProcessing === selectedFactuur.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                      Herinnering sturen
                    </Button>
                  )}
                  {selectedFactuur.status !== 'Betaald' && selectedFactuur.status !== 'Gecrediteerd' && selectedFactuur.status !== 'Geannuleerd' && (
                    <Button onClick={() => handleMarkeerBetaald(selectedFactuur)} disabled={isProcessing === selectedFactuur.id}>
                      {isProcessing === selectedFactuur.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Markeer als betaald
                    </Button>
                  )}
                  {selectedFactuur.status === 'Betaald' && (
                    <Button variant="outline" onClick={() => handleCreditnota(selectedFactuur)} disabled={isProcessing === selectedFactuur.id}>
                      {isProcessing === selectedFactuur.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                      Creditnota maken
                    </Button>
                  )}
                  {selectedFactuur.status === 'Concept' && (
                    <Button variant="destructive" onClick={() => handleVerwijderen(selectedFactuur)} disabled={isProcessing === selectedFactuur.id}>
                      {isProcessing === selectedFactuur.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Verwijderen
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Modal */}
      {selectedFactuur && (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Factuur Bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de factuur gegevens voor {selectedFactuur.nummer}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-klant">Klant</Label>
                <Input
                  id="edit-klant"
                  defaultValue={selectedFactuur.klant}
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-bedrag">Bedrag (€)</Label>
                  <Input
                    id="edit-bedrag"
                    type="number"
                    defaultValue={selectedFactuur.bedrag}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select defaultValue={selectedFactuur.status}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Concept">Concept</SelectItem>
                      <SelectItem value="Verzonden">Verzonden</SelectItem>
                      <SelectItem value="Openstaand">Openstaand</SelectItem>
                      <SelectItem value="Achterstallig">Achterstallig</SelectItem>
                      <SelectItem value="Betaald">Betaald</SelectItem>
                      <SelectItem value="Gecrediteerd">Gecrediteerd</SelectItem>
                      <SelectItem value="Geannuleerd">Geannuleerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-datum">Factuurdatum</Label>
                  <Input
                    id="edit-datum"
                    type="date"
                    defaultValue={selectedFactuur.datum}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-verval">Vervaldatum</Label>
                  <Input
                    id="edit-verval"
                    type="date"
                    defaultValue={selectedFactuur.vervalDatum}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notities">Notities</Label>
                <Textarea
                  id="edit-notities"
                  defaultValue={selectedFactuur.notities}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Annuleren</Button>
              <Button
                onClick={() => {
                  toast({
                    title: 'Factuur bijgewerkt',
                    description: `${selectedFactuur.nummer} is bijgewerkt.`,
                  })
                  setEditModalOpen(false)
                  void fetchFacturen()
                }}
              >
                Opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
