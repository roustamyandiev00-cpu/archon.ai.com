'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  FileX,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import AddUitgaveModal from '@/components/modals/AddUitgaveModal'
import { PageEmptyState, PageInlineError, PagePanel } from '@/components/dashboard/PageStates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useDashboardQueryEnum, useDashboardQueryText } from '@/hooks/use-dashboard-query-state'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type UitgaveStatus = 'open' | 'betaald' | 'overdue'

interface Uitgave {
  id: string
  titel: string
  omschrijving: string | null
  leverancier: string | null
  bedrijf: string | null
  bedrijfId: number | null
  bedrag: number
  datum: string | null
  categorie: string | null
  betaalmethode: string | null
  createdAt: string | null
}

function deriveStatus(uitgave: Uitgave): UitgaveStatus {
  if (uitgave.betaalmethode) return 'betaald'

  const date = new Date(uitgave.datum ?? uitgave.createdAt ?? '')
  if (Number.isNaN(date.getTime())) return 'open'

  const ageInDays = (Date.now() - date.getTime()) / 86_400_000
  if (ageInDays > 30) return 'overdue'

  return 'open'
}

function formatDate(value: string | null): string {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('nl-NL')
}

function StatusBadge({ status }: { status: UitgaveStatus }) {
  const styles = {
    open: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    betaald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    overdue: 'bg-red-500/10 text-red-600 border-red-500/20',
  }

  const labels = {
    open: 'Open',
    betaald: 'Betaald',
    overdue: 'Te laat',
  }

  return (
    <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-medium', styles[status])}>
      {labels[status]}
    </span>
  )
}

function TableLoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={`uitgaven-loading-${index}`} className="border-border/20">
      <TableCell><div className="h-4 w-32 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-20 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-16 rounded-full bg-muted/35 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-20 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-20 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-24 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell>
        <div className="ml-auto flex w-fit gap-1">
          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted/30 animate-pulse" />
        </div>
      </TableCell>
    </TableRow>
  ))
}

export default function UitgavenPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('uitgaven_q')
  const [statusFilter, setStatusFilter] = useDashboardQueryEnum(
    'uitgaven_status',
    'all',
    ['all', 'open', 'betaald', 'overdue'] as const
  )
  const [categoryFilter, setCategoryFilter] = useDashboardQueryText('uitgaven_categorie', 'all')
  const [sortBy, setSortBy] = useDashboardQueryEnum(
    'uitgaven_sort',
    'datum',
    ['datum', 'bedrag', 'titel'] as const
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [uitgaven, setUitgaven] = useState<Uitgave[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Auto-open create modal when prop is true
  useEffect(() => {
    if (autoOpenCreate && !modalOpen) {
      setModalOpen(true)
    }
  }, [autoOpenCreate, modalOpen])

  const fetchUitgaven = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/uitgaven', { cache: 'no-store' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon uitgaven niet laden.')
      }

      const payload = await response.json()
      setUitgaven(Array.isArray(payload) ? payload : [])
    } catch (requestError: any) {
      setError(requestError?.message ?? 'Onbekende fout tijdens laden van uitgaven.')
      setUitgaven([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUitgaven()
  }, [fetchUitgaven, refreshKey])

  const categories = useMemo(
    () => [...new Set(uitgaven.map((item) => item.categorie).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b)),
    [uitgaven]
  )

  const safeCategoryFilter = categoryFilter === 'all' || categories.includes(categoryFilter)
    ? categoryFilter
    : 'all'

  const filteredData = useMemo(() => {
    const loweredSearch = searchQuery.toLowerCase()

    return uitgaven
      .filter((uitgave) => {
        const status = deriveStatus(uitgave)

        const matchesSearch =
          uitgave.titel.toLowerCase().includes(loweredSearch) ||
          (uitgave.leverancier ?? '').toLowerCase().includes(loweredSearch) ||
          (uitgave.bedrijf ?? '').toLowerCase().includes(loweredSearch)

        const matchesStatus = statusFilter === 'all' || status === statusFilter
        const matchesCategory = safeCategoryFilter === 'all' || uitgave.categorie === safeCategoryFilter

        return matchesSearch && matchesStatus && matchesCategory
      })
      .sort((a, b) => {
        if (sortBy === 'titel') return a.titel.localeCompare(b.titel)
        if (sortBy === 'bedrag') return b.bedrag - a.bedrag

        const leftDate = new Date(a.datum ?? a.createdAt ?? '').getTime()
        const rightDate = new Date(b.datum ?? b.createdAt ?? '').getTime()
        return rightDate - leftDate
      })
  }, [safeCategoryFilter, searchQuery, sortBy, statusFilter, uitgaven])

  const refreshUitgaven = () => setRefreshKey((current) => current + 1)

  const markAsPaid = async (uitgave: Uitgave) => {
    if (uitgave.betaalmethode) {
      toast({
        title: 'Al betaald',
        description: `${uitgave.titel} staat al op betaald.`,
      })
      return
    }

    try {
      const response = await fetch(`/api/uitgaven/${uitgave.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betaalmethode: 'Bankoverschrijving' }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon status niet bijwerken.')
      }

      setUitgaven((current) =>
        current.map((item) =>
          item.id === uitgave.id ? { ...item, betaalmethode: 'Bankoverschrijving' } : item
        )
      )

      toast({
        title: 'Gemarkeerd als betaald',
        description: `${uitgave.titel} is gemarkeerd als betaald.`,
      })
    } catch (updateError: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: updateError?.message ?? 'Kon uitgave niet bijwerken.',
        variant: 'destructive',
      })
    }
  }

  const deleteUitgave = async (uitgave: Uitgave) => {
    try {
      const response = await fetch(`/api/uitgaven/${uitgave.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon uitgave niet verwijderen.')
      }

      setUitgaven((current) => current.filter((item) => item.id !== uitgave.id))
      toast({
        title: 'Uitgave verwijderd',
        description: `${uitgave.titel} is verwijderd.`,
      })
    } catch (deleteError: any) {
      toast({
        title: 'Verwijderen mislukt',
        description: deleteError?.message ?? 'Kon uitgave niet verwijderen.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-orange-500/20 to-amber-500/20">
              <FileX className="w-6 h-6 text-orange-600" />
            </div>
            Uitgaven
          </h1>
          <p className="text-muted-foreground mt-1">Beheer uw uitgaven</p>
        </div>

        <Button
          className="bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/25"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Uitgave
        </Button>
      </div>

      <PagePanel className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken op titel, leverancier of bedrijf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/30 border-border/30 focus-visible:ring-amber-500/20"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value: 'all' | 'open' | 'betaald' | 'overdue') => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-40 bg-background/30 border-border/30">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="betaald">Betaald</SelectItem>
              <SelectItem value="overdue">Te laat</SelectItem>
            </SelectContent>
          </Select>

          <Select value={safeCategoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-background/30 border-border/30">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: 'datum' | 'bedrag' | 'titel') => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-44 bg-background/30 border-border/30">
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="datum">Datum</SelectItem>
              <SelectItem value="bedrag">Bedrag</SelectItem>
              <SelectItem value="titel">Titel (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PagePanel>

      {error && !loading && (
        <PageInlineError
          title="Uitgaven konden niet geladen worden"
          description={error}
          onRetry={() => void fetchUitgaven()}
        />
      )}

      {!error && (loading || filteredData.length > 0) && (
        <PagePanel className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Titel</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Categorie</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Bedrag</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Datum</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Leverancier</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableLoadingRows />}

              {!loading && filteredData.map((uitgave) => {
                const status = deriveStatus(uitgave)

                return (
                  <TableRow key={uitgave.id} className="border-border/20 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-foreground">{uitgave.titel}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {uitgave.categorie ?? 'Algemeen'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="text-foreground">€{uitgave.bedrag.toLocaleString('nl-NL')}</TableCell>
                    <TableCell className="text-foreground">{formatDate(uitgave.datum ?? uitgave.createdAt)}</TableCell>
                    <TableCell className="text-foreground">{uitgave.leverancier ?? uitgave.bedrijf ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                          onClick={() => {
                            toast({
                              title: 'Uitgave details',
                              description: `${uitgave.titel} • €${uitgave.bedrag.toLocaleString('nl-NL')}`,
                            })
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                          onClick={() => void markAsPaid(uitgave)}
                          title="Markeer als betaald"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => void deleteUitgave(uitgave)}
                          title="Verwijder uitgave"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </PagePanel>
      )}

      {!loading && !error && filteredData.length === 0 && (
        <PageEmptyState
          icon={FileX}
          title={uitgaven.length === 0 ? 'Nog geen uitgaven' : 'Geen uitgaven gevonden'}
          description={
            uitgaven.length === 0
              ? 'Voeg uw eerste uitgave toe om kosten te registreren.'
              : 'Pas uw filters of zoekopdracht aan.'
          }
          actionLabel={uitgaven.length === 0 ? 'Nieuwe uitgave' : 'Filters wissen'}
          onAction={() => {
            if (uitgaven.length === 0) {
              setModalOpen(true)
              return
            }

            setSearchQuery('')
            setStatusFilter('all')
            setCategoryFilter('all')
            setSortBy('datum')
          }}
        />
      )}

      <AddUitgaveModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={refreshUitgaven}
      />
    </div>
  )
}
