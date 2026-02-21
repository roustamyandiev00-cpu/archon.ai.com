'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  DollarSign,
  Eye,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import AddInkomstModal from '@/components/modals/AddInkomstModal'
import { PageEmptyState, PageInlineError, PagePanel } from '@/components/dashboard/PageStates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

type InkomstStatus = 'open' | 'betaald' | 'overdue'

interface Inkomst {
  id: string
  titel: string
  omschrijving: string | null
  bedrijf: string | null
  bedrijfId: number | null
  bedrag: number
  datum: string | null
  categorie: string | null
  betaalmethode: string | null
  createdAt: string | null
}

function deriveStatus(inkomst: Inkomst): InkomstStatus {
  if (inkomst.betaalmethode) return 'betaald'

  const date = new Date(inkomst.datum ?? inkomst.createdAt ?? '')
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

function formatReference(inkomst: Inkomst): string {
  const parsedId = Number(inkomst.id)
  const suffix = Number.isFinite(parsedId) ? String(parsedId).padStart(4, '0') : inkomst.id
  const year = (inkomst.datum ?? inkomst.createdAt ?? `${new Date().getFullYear()}`).slice(0, 4)
  return `INC-${year}-${suffix}`
}

function StatusBadge({ status }: { status: InkomstStatus }) {
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
    <TableRow key={`inkomsten-loading-${index}`} className="border-border/20">
      <TableCell><div className="h-4 w-28 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-40 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-24 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-20 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-16 rounded-full bg-muted/35 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-20 rounded bg-muted/40 animate-pulse" /></TableCell>
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

export default function InkomstenPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('inkomsten_q')
  const [statusFilter, setStatusFilter] = useDashboardQueryEnum(
    'inkomsten_status',
    'all',
    ['all', 'open', 'betaald', 'overdue'] as const
  )
  const [sortBy, setSortBy] = useDashboardQueryEnum(
    'inkomsten_sort',
    'datum',
    ['datum', 'bedrag', 'titel'] as const
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [inkomsten, setInkomsten] = useState<Inkomst[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Auto-open create modal when prop is true
  useEffect(() => {
    if (autoOpenCreate && !modalOpen) {
      setModalOpen(true)
    }
  }, [autoOpenCreate, modalOpen])

  const fetchInkomsten = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/inkomsten', { cache: 'no-store' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon inkomsten niet laden.')
      }

      const payload = await response.json()
      setInkomsten(Array.isArray(payload) ? payload : [])
    } catch (requestError: any) {
      setError(requestError?.message ?? 'Onbekende fout tijdens laden van inkomsten.')
      setInkomsten([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchInkomsten()
  }, [fetchInkomsten, refreshKey])

  const filteredData = useMemo(() => {
    const loweredSearch = searchQuery.toLowerCase()

    return inkomsten
      .filter((inkomst) => {
        const status = deriveStatus(inkomst)

        const matchesSearch =
          formatReference(inkomst).toLowerCase().includes(loweredSearch) ||
          inkomst.titel.toLowerCase().includes(loweredSearch) ||
          (inkomst.bedrijf ?? '').toLowerCase().includes(loweredSearch)

        const matchesStatus = statusFilter === 'all' || status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'titel') return a.titel.localeCompare(b.titel)
        if (sortBy === 'bedrag') return b.bedrag - a.bedrag

        const leftDate = new Date(a.datum ?? a.createdAt ?? '').getTime()
        const rightDate = new Date(b.datum ?? b.createdAt ?? '').getTime()
        return rightDate - leftDate
      })
  }, [inkomsten, searchQuery, sortBy, statusFilter])

  const totals = useMemo(() => {
    const allAmount = filteredData.reduce((sum, item) => sum + item.bedrag, 0)
    const open = filteredData.filter((item) => deriveStatus(item) === 'open')
    const paid = filteredData.filter((item) => deriveStatus(item) === 'betaald')
    const overdue = filteredData.filter((item) => deriveStatus(item) === 'overdue')

    return {
      allAmount,
      open,
      paid,
      overdue,
      openAmount: open.reduce((sum, item) => sum + item.bedrag, 0),
      paidAmount: paid.reduce((sum, item) => sum + item.bedrag, 0),
      overdueAmount: overdue.reduce((sum, item) => sum + item.bedrag, 0),
    }
  }, [filteredData])

  const refreshInkomsten = () => setRefreshKey((current) => current + 1)

  const markAsPaid = async (inkomst: Inkomst) => {
    if (inkomst.betaalmethode) {
      toast({
        title: 'Al betaald',
        description: `${formatReference(inkomst)} staat al op betaald.`,
      })
      return
    }

    try {
      const response = await fetch(`/api/inkomsten/${inkomst.id}`, {
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

      setInkomsten((current) =>
        current.map((item) =>
          item.id === inkomst.id ? { ...item, betaalmethode: 'Bankoverschrijving' } : item
        )
      )

      toast({
        title: 'Gemarkeerd als betaald',
        description: `${formatReference(inkomst)} is gemarkeerd als betaald.`,
      })
    } catch (updateError: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: updateError?.message ?? 'Kon factuur niet bijwerken.',
        variant: 'destructive',
      })
    }
  }

  const deleteInkomst = async (inkomst: Inkomst) => {
    try {
      const response = await fetch(`/api/inkomsten/${inkomst.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon factuur niet verwijderen.')
      }

      setInkomsten((current) => current.filter((item) => item.id !== inkomst.id))
      toast({
        title: 'Factuur verwijderd',
        description: `${formatReference(inkomst)} is verwijderd.`,
      })
    } catch (deleteError: any) {
      toast({
        title: 'Verwijderen mislukt',
        description: deleteError?.message ?? 'Kon factuur niet verwijderen.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-emerald-500/20 to-green-500/20">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            Inkomsten
          </h1>
          <p className="text-muted-foreground mt-1">Beheer uw inkomsten</p>
        </div>

        <Button
          className="bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Factuur
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-emerald-500/10 to-green-500/20 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-foreground">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{totals.openAmount.toLocaleString('nl-NL')}</div>
            <div className="text-sm text-muted-foreground">Aantal: {totals.open.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-blue-500/10 to-cyan-500/20 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-foreground">Betaald</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{totals.paidAmount.toLocaleString('nl-NL')}</div>
            <div className="text-sm text-muted-foreground">Aantal: {totals.paid.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-red-500/10 to-orange-500/20 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-foreground">Te laat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{totals.overdueAmount.toLocaleString('nl-NL')}</div>
            <div className="text-sm text-muted-foreground">Aantal: {totals.overdue.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-violet-500/10 to-fuchsia-500/20 border-violet-500/20">
          <CardHeader>
            <CardTitle className="text-foreground">Totaal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{totals.allAmount.toLocaleString('nl-NL')}</div>
            <div className="text-sm text-muted-foreground">Aantal: {filteredData.length}</div>
          </CardContent>
        </Card>
      </div>

      <PagePanel className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken op referentie, titel of bedrijf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/30 border-border/30 focus-visible:ring-emerald-500/20"
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

          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setSortBy('datum')
            }}
            className="w-full sm:w-auto"
          >
            Filters wissen
          </Button>
        </div>
      </PagePanel>

      {error && !loading && (
        <PageInlineError
          title="Inkomsten konden niet geladen worden"
          description={error}
          onRetry={() => void fetchInkomsten()}
        />
      )}

      {!error && (loading || filteredData.length > 0) && (
        <PagePanel className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Referentie</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Titel</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Bedrijf</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Bedrag</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Datum</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableLoadingRows />}

              {!loading && filteredData.map((inkomst) => {
                const status = deriveStatus(inkomst)
                const reference = formatReference(inkomst)

                return (
                  <TableRow key={inkomst.id} className="border-border/20 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-foreground">{reference}</TableCell>
                    <TableCell className="text-foreground">{inkomst.titel}</TableCell>
                    <TableCell className="text-foreground">{inkomst.bedrijf ?? '-'}</TableCell>
                    <TableCell className="text-foreground">€{inkomst.bedrag.toLocaleString('nl-NL')}</TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="text-foreground">{formatDate(inkomst.datum ?? inkomst.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => {
                            toast({
                              title: 'Factuur details',
                              description: `${inkomst.titel} • €${inkomst.bedrag.toLocaleString('nl-NL')}`,
                            })
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                          onClick={() => void markAsPaid(inkomst)}
                          title="Markeer als betaald"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => void deleteInkomst(inkomst)}
                          title="Verwijder factuur"
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
          icon={DollarSign}
          title={inkomsten.length === 0 ? 'Nog geen inkomsten' : 'Geen inkomsten gevonden'}
          description={
            inkomsten.length === 0
              ? 'Voeg uw eerste factuur toe om inkomsten te registreren.'
              : 'Pas uw filters of zoekopdracht aan.'
          }
          actionLabel={inkomsten.length === 0 ? 'Nieuwe factuur' : 'Filters wissen'}
          onAction={() => {
            if (inkomsten.length === 0) {
              setModalOpen(true)
              return
            }

            setSearchQuery('')
            setStatusFilter('all')
            setSortBy('datum')
          }}
        />
      )}

      <AddInkomstModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={refreshInkomsten}
      />
    </div>
  )
}
