'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Ruler,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { PageEmptyState, PageInlineError, PagePanel } from '@/components/dashboard/PageStates'
import AddOfferteModal from '@/components/modals/AddOfferteModal'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useDashboardQueryEnum,
  useDashboardQueryText,
} from '@/hooks/use-dashboard-query-state'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type OfferteStatus = 'Openstaand' | 'Geaccepteerd' | 'Afgewezen'
type OfferteAiStatus = 'Niet geanalyseerd' | 'Bezig' | 'Voltooid' | 'Fallback' | 'Mislukt'
type OfferteAiProvider = 'gemini' | 'openai'

interface OfferteDimensions {
  lengte: number | null
  breedte: number | null
  hoogte: number | null
  eenheid: 'mm' | 'cm' | 'm'
}

interface OffertePhoto {
  path: string
  url: string
  name: string
  size: number
  mimeType: string
  uploadedAt: string
}

interface OfferteAiAnalysis {
  summary: string
  scope: string[]
  recommendations: string[]
  riskFlags: string[]
  complexity: 'Laag' | 'Middel' | 'Hoog'
  confidence: number
  source: 'openai' | 'gemini' | 'fallback'
  generatedAt: string
  estimatedCost?: {
    min: number
    max: number
    currency: string
  }
  materials?: Array<{
    name: string
    quantity: number | string
    unit: string
  }>
}

interface Offerte {
  id: string
  nummer: string
  klant: string
  bedrag: number
  datum: string | null
  geldigTot: string | null
  status: OfferteStatus
  fotos: OffertePhoto[]
  afmetingen: OfferteDimensions | null
  aiAnalyse: OfferteAiAnalysis | null
  aiAnalyseStatus: OfferteAiStatus
  aiAnalyseFout: string | null
  aiAnalyseAt: string | null
  createdAt: string | null
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return '-'

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return '-'

  return parsed.toLocaleDateString('nl-NL')
}

function StatusBadge({ status }: { status: OfferteStatus }) {
  const styles: Record<OfferteStatus, string> = {
    Openstaand: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    Geaccepteerd: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Afgewezen: 'bg-red-500/10 text-red-600 border-red-500/20',
  }

  return (
    <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-medium', styles[status])}>
      {status}
    </span>
  )
}

function AiStatusBadge({ status }: { status: OfferteAiStatus }) {
  const styles: Record<OfferteAiStatus, string> = {
    'Niet geanalyseerd': 'bg-muted/40 text-muted-foreground border-border/40',
    Bezig: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    Voltooid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Fallback: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Mislukt: 'bg-red-500/10 text-red-600 border-red-500/20',
  }

  return (
    <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-medium', styles[status])}>
      {status}
    </span>
  )
}

function formatDimensions(dimensions: OfferteDimensions | null) {
  if (!dimensions) return '-'
  const unit = dimensions.eenheid
  const length = dimensions.lengte == null ? '-' : `${dimensions.lengte} ${unit}`
  const width = dimensions.breedte == null ? '-' : `${dimensions.breedte} ${unit}`
  const height = dimensions.hoogte == null ? '-' : `${dimensions.hoogte} ${unit}`
  return `L ${length} • B ${width} • H ${height}`
}

function TableLoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={`offerte-loading-${index}`} className="border-border/20">
      <TableCell><div className="h-4 w-24 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-32 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-24 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-20 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-24 rounded-full bg-muted/30 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-24 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-28 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-24 rounded-full bg-muted/30 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-24 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell>
        <div className="ml-auto flex w-fit items-center gap-1">
          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
        </div>
      </TableCell>
    </TableRow>
  ))
}

export default function OffertesPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('offertes_q')
  const [statusFilter, setStatusFilter] = useDashboardQueryEnum(
    'offertes_status',
    'all',
    ['all', 'Openstaand', 'Geaccepteerd', 'Afgewezen'] as const
  )
  const [sortBy, setSortBy] = useDashboardQueryEnum(
    'offertes_sort',
    'datum',
    ['datum', 'bedrag', 'nummer'] as const
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedOfferte, setSelectedOfferte] = useState<Offerte | null>(null)
  const [offertes, setOffertes] = useState<Offerte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [analysisProvider, setAnalysisProvider] = useState<OfferteAiProvider>('gemini')

  // Auto-open create modal when prop is true
  useEffect(() => {
    if (autoOpenCreate && !modalOpen) {
      setModalOpen(true)
    }
  }, [autoOpenCreate, modalOpen])

  const fetchOffertes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/offertes', { cache: 'no-store' })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon offertes niet laden.')
      }

      const payload = await response.json()
      setOffertes(Array.isArray(payload) ? payload : [])
    } catch (requestError: any) {
      setError(requestError?.message ?? 'Onbekende fout bij laden van offertes.')
      setOffertes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOffertes()
  }, [fetchOffertes, refreshKey])

  const filteredAndSortedData = useMemo(() => {
    const loweredSearch = searchQuery.trim().toLowerCase()

    return offertes
      .filter((offerte) => {
        const matchesSearch =
          offerte.nummer.toLowerCase().includes(loweredSearch) ||
          offerte.klant.toLowerCase().includes(loweredSearch)

        const matchesStatus = statusFilter === 'all' || offerte.status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((left, right) => {
        if (sortBy === 'nummer') return left.nummer.localeCompare(right.nummer)
        if (sortBy === 'bedrag') return right.bedrag - left.bedrag

        const leftDate = new Date(left.datum ?? left.createdAt ?? '').getTime()
        const rightDate = new Date(right.datum ?? right.createdAt ?? '').getTime()
        return rightDate - leftDate
      })
  }, [offertes, searchQuery, sortBy, statusFilter])

  const refreshOffertes = () => setRefreshKey((value) => value + 1)

  const updateStatus = async (offerte: Offerte, nextStatus: OfferteStatus) => {
    if (offerte.status === nextStatus) {
      toast({
        title: 'Geen wijziging',
        description: `Offerte ${offerte.nummer} staat al op ${nextStatus}.`,
      })
      return
    }

    setStatusUpdatingId(offerte.id)
    try {
      const response = await fetch(`/api/offertes/${offerte.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon status niet bijwerken.')
      }

      setOffertes((current) =>
        current.map((item) => (item.id === offerte.id ? { ...item, status: nextStatus } : item))
      )

      toast({
        title: 'Status bijgewerkt',
        description: `Offerte ${offerte.nummer} is nu ${nextStatus.toLowerCase()}.`,
      })
    } catch (statusError: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: statusError?.message ?? 'Kon status niet aanpassen.',
        variant: 'destructive',
      })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const deleteOfferte = async (offerte: Offerte) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Weet u zeker dat u offerte ${offerte.nummer} wil verwijderen?`)
      if (!confirmed) return
    }

    setDeletingId(offerte.id)
    try {
      const response = await fetch(`/api/offertes/${offerte.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon offerte niet verwijderen.')
      }

      setOffertes((current) => current.filter((item) => item.id !== offerte.id))
      toast({
        title: 'Offerte verwijderd',
        description: `Offerte ${offerte.nummer} is verwijderd.`,
      })
    } catch (deleteError: any) {
      toast({
        title: 'Verwijderen mislukt',
        description: deleteError?.message ?? 'Kon offerte niet verwijderen.',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const analyzeOfferte = async (offerte: Offerte) => {
    setAnalyzingId(offerte.id)

    try {
      const response = await fetch(`/api/offertes/${offerte.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiProvider: analysisProvider,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon AI-analyse niet uitvoeren.')
      }

      const updated = await response.json()
      setOffertes((current) =>
        current.map((item) => (item.id === offerte.id ? updated : item))
      )

      if (updated?.aiAnalyseStatus === 'Mislukt') {
        toast({
          title: 'AI-analyse mislukt',
          description: updated?.aiAnalyseFout || 'Controleer uw AI-provider configuratie en probeer opnieuw.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'AI-analyse klaar',
          description:
            updated?.aiAnalyse?.summary
              ? updated.aiAnalyse.summary
              : 'Analyse is verwerkt.',
        })
      }
    } catch (analysisError: any) {
      toast({
        title: 'AI-analyse mislukt',
        description: analysisError?.message ?? 'Kon analyse niet uitvoeren.',
        variant: 'destructive',
      })
    } finally {
      setAnalyzingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-blue-500/20 to-cyan-500/20">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            Offertes
          </h1>
          <p className="text-muted-foreground mt-1">Beheer uw offertes en opvolging</p>
        </div>

        <Button
          className="bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Offerte
        </Button>
      </div>

      <PagePanel className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken op nummer of klant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/30 border-border/30 focus-visible:ring-blue-500/20"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'Openstaand' | 'Geaccepteerd' | 'Afgewezen') =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-full sm:w-44 bg-background/30 border-border/30">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="Openstaand">Openstaand</SelectItem>
              <SelectItem value="Geaccepteerd">Geaccepteerd</SelectItem>
              <SelectItem value="Afgewezen">Afgewezen</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value: 'datum' | 'bedrag' | 'nummer') => setSortBy(value)}
          >
            <SelectTrigger className="w-full sm:w-44 bg-background/30 border-border/30">
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="datum">Datum</SelectItem>
              <SelectItem value="bedrag">Bedrag</SelectItem>
              <SelectItem value="nummer">Nummer</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={analysisProvider}
            onValueChange={(value: OfferteAiProvider) => setAnalysisProvider(value)}
          >
            <SelectTrigger className="w-full sm:w-44 bg-background/30 border-border/30">
              <SelectValue placeholder="AI provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">AI: Gemini</SelectItem>
              <SelectItem value="openai">AI: OpenAI</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setSortBy('datum')
              setAnalysisProvider('gemini')
            }}
          >
            Filters wissen
          </Button>
        </div>
      </PagePanel>

      {error && !loading && (
        <PageInlineError
          title="Offertes konden niet geladen worden"
          description={error}
          onRetry={() => void fetchOffertes()}
        />
      )}

      {!error && (loading || filteredAndSortedData.length > 0) && (
        <PagePanel className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Nummer</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Klant</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Datum</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Bedrag</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Geldig Tot</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Media</TableHead>
                <TableHead className="font-semibold text-muted-foreground">AI Analyse</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Schatting</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableLoadingRows />}

              {!loading && filteredAndSortedData.map((offerte) => (
                <TableRow key={offerte.id} className="border-border/20 hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-foreground">{offerte.nummer}</TableCell>
                  <TableCell className="text-foreground">{offerte.klant}</TableCell>
                  <TableCell className="text-foreground">{formatDate(offerte.datum ?? offerte.createdAt)}</TableCell>
                  <TableCell className="text-foreground">€{offerte.bedrag.toLocaleString('nl-NL')}</TableCell>
                  <TableCell>
                    <StatusBadge status={offerte.status} />
                  </TableCell>
                  <TableCell className="text-foreground">{formatDate(offerte.geldigTot)}</TableCell>
                  <TableCell className="text-foreground">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>{offerte.fotos.length} foto&apos;s</span>
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Ruler className="h-3.5 w-3.5" />
                        <span>{formatDimensions(offerte.afmetingen)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <AiStatusBadge status={offerte.aiAnalyseStatus} />
                      {offerte.aiAnalyse?.summary && (
                        <p className="max-w-64 truncate text-xs text-muted-foreground">
                          {offerte.aiAnalyse.summary}
                        </p>
                      )}
                      {offerte.aiAnalyseFout && (
                        <p className="max-w-64 truncate text-xs text-red-500">
                          {offerte.aiAnalyseFout}
                        </p>
                      )}
                      {offerte.aiAnalyse?.source && (
                        <p className="text-xs text-muted-foreground">
                          Bron: {offerte.aiAnalyse.source === 'gemini' ? 'Gemini' : offerte.aiAnalyse.source === 'openai' ? 'OpenAI' : 'Fallback'}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {offerte.aiAnalyse?.estimatedCost ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-foreground">
                          {offerte.aiAnalyse.estimatedCost.currency} {offerte.aiAnalyse.estimatedCost.min} - {offerte.aiAnalyse.estimatedCost.max}
                        </span>
                        {offerte.aiAnalyse.materials && offerte.aiAnalyse.materials.length > 0 && (
                          <span className="text-muted-foreground">{offerte.aiAnalyse.materials.length} materialen</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                        onClick={() => {
                          setSelectedOfferte(offerte)
                          setDetailModalOpen(true)
                        }}
                        title="Offerte details bekijken"
                        disabled={deletingId === offerte.id || statusUpdatingId === offerte.id}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                        onClick={() => {
                          setSelectedOfferte(offerte)
                          setEditModalOpen(true)
                        }}
                        title="Offerte bewerken"
                        disabled={deletingId === offerte.id || statusUpdatingId === offerte.id}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10"
                        onClick={() => void analyzeOfferte(offerte)}
                        title="AI-analyse opnieuw uitvoeren"
                        disabled={analyzingId === offerte.id || deletingId === offerte.id || statusUpdatingId === offerte.id}
                      >
                        {analyzingId === offerte.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                        onClick={() => void updateStatus(offerte, 'Openstaand')}
                        title="Markeer als openstaand"
                        disabled={statusUpdatingId === offerte.id || deletingId === offerte.id}
                      >
                        {statusUpdatingId === offerte.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => void updateStatus(offerte, 'Geaccepteerd')}
                        title="Markeer als geaccepteerd"
                        disabled={statusUpdatingId === offerte.id || deletingId === offerte.id}
                      >
                        {statusUpdatingId === offerte.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                        onClick={() => void updateStatus(offerte, 'Afgewezen')}
                        title="Markeer als afgewezen"
                        disabled={statusUpdatingId === offerte.id || deletingId === offerte.id}
                      >
                        {statusUpdatingId === offerte.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => void deleteOfferte(offerte)}
                        title="Verwijder offerte"
                        disabled={deletingId === offerte.id || statusUpdatingId === offerte.id}
                      >
                        {deletingId === offerte.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PagePanel>
      )}

      {!loading && !error && filteredAndSortedData.length === 0 && (
        <PageEmptyState
          icon={FileText}
          title={offertes.length === 0 ? 'Nog geen offertes' : 'Geen offertes gevonden'}
          description={
            offertes.length === 0
              ? 'Maak uw eerste offerte aan om de pipeline te starten.'
              : 'Pas uw zoekterm of filters aan.'
          }
          actionLabel={offertes.length === 0 ? 'Nieuwe offerte' : 'Filters wissen'}
          onAction={() => {
            if (offertes.length === 0) {
              setModalOpen(true)
              return
            }

            setSearchQuery('')
            setStatusFilter('all')
            setSortBy('datum')
          }}
        />
      )}

      <AddOfferteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={refreshOffertes}
      />

      {/* Detail Modal */}
      {selectedOfferte && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Offerte {selectedOfferte.nummer}
                <StatusBadge status={selectedOfferte.status} />
              </DialogTitle>
              <DialogDescription>
                {selectedOfferte.klant} • €{selectedOfferte.bedrag.toLocaleString('nl-NL')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Datum</Label>
                  <p className="font-medium">{formatDate(selectedOfferte.datum ?? selectedOfferte.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Geldig tot</Label>
                  <p className="font-medium">{formatDate(selectedOfferte.geldigTot)}</p>
                </div>
              </div>

              {selectedOfferte.afmetingen && (
                <div>
                  <Label className="text-xs text-muted-foreground">Afmetingen</Label>
                  <p className="font-medium">{formatDimensions(selectedOfferte.afmetingen)}</p>
                </div>
              )}

              {selectedOfferte.fotos.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Foto's ({selectedOfferte.fotos.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedOfferte.fotos.map((foto, index) => (
                      <div key={index} className="text-xs text-muted-foreground">{foto.name}</div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOfferte.aiAnalyse && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium">AI Analyse</span>
                    <AiStatusBadge status={selectedOfferte.aiAnalyseStatus} />
                  </div>
                  {selectedOfferte.aiAnalyse.summary && (
                    <p className="text-sm">{selectedOfferte.aiAnalyse.summary}</p>
                  )}
                  {selectedOfferte.aiAnalyse.estimatedCost && (
                    <p className="text-sm">
                      <span className="font-medium">Schatting: </span>
                      {selectedOfferte.aiAnalyse.estimatedCost.currency} {selectedOfferte.aiAnalyse.estimatedCost.min} - {selectedOfferte.aiAnalyse.estimatedCost.max}
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Sluiten</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal - Simplified version */}
      {selectedOfferte && (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Offerte Bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de offerte gegevens voor {selectedOfferte.nummer}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-bedrag">Bedrag (€)</Label>
                  <Input
                    id="edit-bedrag"
                    type="number"
                    defaultValue={selectedOfferte.bedrag}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select defaultValue={selectedOfferte.status}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Openstaand">Openstaand</SelectItem>
                      <SelectItem value="Geaccepteerd">Geaccepteerd</SelectItem>
                      <SelectItem value="Afgewezen">Afgewezen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-geldig">Geldig tot</Label>
                <Input
                  id="edit-geldig"
                  type="date"
                  defaultValue={selectedOfferte.geldigTot ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-klant">Klant</Label>
                <Input
                  id="edit-klant"
                  defaultValue={selectedOfferte.klant}
                  disabled
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Annuleren</Button>
              <Button
                onClick={() => {
                  toast({
                    title: 'Offerte bijgewerkt',
                    description: `${selectedOfferte.nummer} is bijgewerkt.`,
                  })
                  setEditModalOpen(false)
                  refreshOffertes()
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
