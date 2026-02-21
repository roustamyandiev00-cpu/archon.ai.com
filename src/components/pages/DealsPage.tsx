'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react'

import AddDealModal from '@/components/modals/AddDealModal'
import EditDealModal from '@/components/modals/EditDealModal'
import { PageEmptyState, PageInlineError, PagePanel } from '@/components/dashboard/PageStates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDashboardQueryEnum, useDashboardQueryText } from '@/hooks/use-dashboard-query-state'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type DealStage = 'Lead' | 'Gekwalificeerd' | 'Voorstel' | 'Onderhandeling' | 'Gewonnen' | 'Verloren'

interface Deal {
  id: string
  titel: string
  bedrijf: string | null
  bedrijfId: number | null
  waarde: number
  stadium: DealStage
  kans: number
  deadline: string | null
  notities?: string | null
  createdAt: string | null
}

const stageOrder: DealStage[] = ['Lead', 'Gekwalificeerd', 'Voorstel', 'Onderhandeling', 'Gewonnen', 'Verloren']

const stageMeta: Record<DealStage, { label: string; color: string; gradient: string }> = {
  Lead: { label: 'LEAD', color: 'bg-blue-500', gradient: 'from-blue-500/10 to-blue-600/5' },
  Gekwalificeerd: { label: 'GEKWAL.', color: 'bg-amber-500', gradient: 'from-amber-500/10 to-amber-600/5' },
  Voorstel: { label: 'VOORSTEL', color: 'bg-indigo-500', gradient: 'from-indigo-500/10 to-indigo-600/5' },
  Onderhandeling: { label: 'ONDERH.', color: 'bg-cyan-500', gradient: 'from-cyan-500/10 to-cyan-600/5' },
  Gewonnen: { label: 'GEWONNEN', color: 'bg-emerald-500', gradient: 'from-emerald-500/10 to-emerald-600/5' },
  Verloren: { label: 'VERLOREN', color: 'bg-red-500', gradient: 'from-red-500/10 to-red-600/5' },
}

function getPriority(kans: number): 'hoog' | 'medium' | 'laag' {
  if (kans >= 70) return 'hoog'
  if (kans >= 40) return 'medium'
  return 'laag'
}

function PriorityBadge({ kans }: { kans: number }) {
  const priority = getPriority(kans)

  const styles = {
    hoog: 'bg-red-500/10 text-red-600 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    laag: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  }

  const labels = {
    hoog: 'Hoog',
    medium: 'Medium',
    laag: 'Laag',
  }

  const dots = {
    hoog: 'bg-red-500',
    medium: 'bg-amber-500',
    laag: 'bg-emerald-500',
  }

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border flex items-center gap-1', styles[priority])}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dots[priority])} />
      {labels[priority]}
    </span>
  )
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('nl-NL')
}

function DealCard({
  deal,
  onUpdateStage,
  onDelete,
  onEdit,
}: {
  deal: Deal
  onUpdateStage: (dealId: string, stage: DealStage) => Promise<void>
  onDelete: (dealId: string) => Promise<void>
  onEdit: (deal: Deal) => void
}) {
  return (
    <div className="group bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl p-4 hover:bg-card/75 hover:shadow-lg hover:border-border/50 transition-[background-color,box-shadow,border-color] duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-foreground group-hover:text-blue-500 transition-colors">
            {deal.titel}
          </h4>
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-sm">{deal.bedrijf ?? '-'}</span>
          </div>
          {deal.notities && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2 max-h-16 overflow-y-auto">
              {deal.notities}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {stageOrder.map((stage) => (
              <DropdownMenuItem
                key={stage}
                onClick={() => void onUpdateStage(deal.id, stage)}
                disabled={deal.stadium === stage}
              >
                Naar {stage}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(deal)}>
              Bewerken
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => void onDelete(deal.id)}>
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-3">
        <span className="text-lg font-bold text-foreground">€{deal.waarde.toLocaleString('nl-NL')}</span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Winskans</span>
          <span className={cn('font-medium', deal.kans >= 70 ? 'text-emerald-600' : deal.kans >= 40 ? 'text-amber-600' : 'text-muted-foreground')}>
            {deal.kans}%
          </span>
        </div>
        <Progress value={deal.kans} className="h-1.5" />
      </div>

      <div className="flex items-center justify-between">
        <PriorityBadge kans={deal.kans} />
        <span className="text-xs text-muted-foreground">{formatDate(deal.deadline)}</span>
      </div>
    </div>
  )
}

export default function DealsPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('deals_q')
  const [stageFilter, setStageFilter] = useDashboardQueryEnum(
    'deals_stadium',
    'all',
    ['all', ...stageOrder] as const
  )
  const [sortBy, setSortBy] = useDashboardQueryEnum(
    'deals_sort',
    'waarde',
    ['waarde', 'kans', 'deadline', 'titel'] as const
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Auto-open create modal when prop is true
  useEffect(() => {
    if (autoOpenCreate && !modalOpen) {
      setModalOpen(true)
    }
  }, [autoOpenCreate, modalOpen])

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/deals', { cache: 'no-store' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon deals niet laden.')
      }

      const payload = await response.json()
      setDeals(Array.isArray(payload) ? payload : [])
    } catch (requestError: any) {
      setError(requestError?.message ?? 'Onbekende fout tijdens laden van deals.')
      setDeals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDeals()
  }, [fetchDeals, refreshKey])

  const filteredDeals = useMemo(() => {
    const loweredSearch = searchQuery.toLowerCase()

    return deals
      .filter((deal) => {
        const matchesSearch =
          deal.titel.toLowerCase().includes(loweredSearch) ||
          (deal.bedrijf ?? '').toLowerCase().includes(loweredSearch)

        const matchesStage = stageFilter === 'all' || deal.stadium === stageFilter
        return matchesSearch && matchesStage
      })
      .sort((a, b) => {
        if (sortBy === 'titel') return a.titel.localeCompare(b.titel)
        if (sortBy === 'kans') return b.kans - a.kans
        if (sortBy === 'deadline') {
          const left = new Date(a.deadline ?? '').getTime()
          const right = new Date(b.deadline ?? '').getTime()
          return right - left
        }
        return b.waarde - a.waarde
      })
  }, [deals, searchQuery, sortBy, stageFilter])

  const dealsByStage = useMemo(
    () =>
      stageOrder.reduce((acc, stage) => {
        acc[stage] = filteredDeals.filter((deal) => deal.stadium === stage)
        return acc
      }, {} as Record<DealStage, Deal[]>),
    [filteredDeals]
  )

  const totals = useMemo(() => {
    const totalDeals = filteredDeals.length
    const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.waarde, 0)
    const wonDeals = filteredDeals.filter((deal) => deal.stadium === 'Gewonnen')
    const wonValue = wonDeals.reduce((sum, deal) => sum + deal.waarde, 0)

    return {
      totalDeals,
      totalValue,
      wonDeals,
      wonValue,
    }
  }, [filteredDeals])

  const refreshDeals = () => setRefreshKey((current) => current + 1)

  const updateDealStage = async (dealId: string, stage: DealStage) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stadium: stage }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon stadium niet aanpassen.')
      }

      setDeals((current) =>
        current.map((deal) => (deal.id === dealId ? { ...deal, stadium: stage } : deal))
      )

      toast({
        title: 'Deal bijgewerkt',
        description: `Stadium aangepast naar ${stage}.`,
      })
    } catch (updateError: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: updateError?.message ?? 'Kon deal niet bijwerken.',
        variant: 'destructive',
      })
    }
  }

  const deleteDeal = async (dealId: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon deal niet verwijderen.')
      }

      setDeals((current) => current.filter((deal) => deal.id !== dealId))
      toast({
        title: 'Deal verwijderd',
        description: 'De deal is verwijderd.',
      })
    } catch (deleteError: any) {
      toast({
        title: 'Verwijderen mislukt',
        description: deleteError?.message ?? 'Kon deal niet verwijderen.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-blue-500/20 to-sky-500/10">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            Deals
          </h1>
          <p className="text-muted-foreground mt-1">Beheer uw verkoopkansen</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 bg-linear-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 rounded-xl px-4 py-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-emerald-600 font-medium">Totaal Pipeline</p>
              <p className="text-lg font-bold text-emerald-700">€{totals.totalValue.toLocaleString('nl-NL')}</p>
            </div>
          </div>
          <Button
            className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Deal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Totaal Deals', value: totals.totalDeals, icon: Briefcase, color: 'from-blue-500 to-sky-500' },
          { label: 'Pipeline Waarde', value: `€${(totals.totalValue / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
          { label: 'Gewonnen', value: totals.wonDeals.length, icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
          { label: 'Gewonnen Waarde', value: `€${(totals.wonValue / 1000).toFixed(0)}K`, icon: Clock, color: 'from-amber-500 to-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl p-4 flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-linear-to-br', stat.color)}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn('text-xl font-bold bg-linear-to-r bg-clip-text text-transparent', stat.color)}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <PagePanel className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken op titel of bedrijf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/30 border-border/30 focus-visible:ring-blue-500/20"
            />
          </div>

          <Select value={stageFilter} onValueChange={(value: 'all' | DealStage) => setStageFilter(value)}>
            <SelectTrigger className="w-full sm:w-44 bg-background/30 border-border/30">
              <SelectValue placeholder="Stadium" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle stadia</SelectItem>
              {stageOrder.map((stage) => (
                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: 'waarde' | 'kans' | 'deadline' | 'titel') => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-44 bg-background/30 border-border/30">
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="waarde">Waarde</SelectItem>
              <SelectItem value="kans">Winskans</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="titel">Titel (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PagePanel>

      {error && !loading && (
        <PageInlineError
          title="Deals konden niet geladen worden"
          description={error}
          onRetry={() => void fetchDeals()}
        />
      )}

      {!error && (loading || filteredDeals.length > 0) && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stageOrder.map((stage) => {
            const columnDeals = dealsByStage[stage] ?? []
            const columnValue = columnDeals.reduce((sum, deal) => sum + deal.waarde, 0)
            const meta = stageMeta[stage]

            return (
              <div key={stage} className="shrink-0 w-72 sm:w-80">
                <div className={cn('flex items-center justify-between p-3 rounded-t-xl bg-linear-to-r border border-border/30', meta.gradient)}>
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', meta.color)} />
                    <span className="font-semibold text-foreground/80 text-sm">{meta.label}</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">
                      {columnDeals.length}
                    </Badge>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">€{columnValue.toLocaleString('nl-NL')}</span>
                </div>

                <div className="bg-card/40 border border-t-0 border-border/30 rounded-b-xl p-3 space-y-3 min-h-[220px] max-h-[calc(100vh-360px)] overflow-y-auto custom-scrollbar">
                  {loading && (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={`${stage}-loading-${index}`} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
                    ))
                  )}

                  {!loading && columnDeals.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <p className="text-sm">Geen deals</p>
                    </div>
                  )}

                  {!loading && columnDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onUpdateStage={updateDealStage}
                      onDelete={deleteDeal}
                      onEdit={(dealToEdit) => {
                        setSelectedDeal(dealToEdit)
                        setEditModalOpen(true)
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && filteredDeals.length === 0 && (
        <PageEmptyState
          icon={Briefcase}
          title={deals.length === 0 ? 'Nog geen deals' : 'Geen deals gevonden'}
          description={
            deals.length === 0
              ? 'Voeg uw eerste deal toe om de pipeline te starten.'
              : 'Pas uw zoekopdracht of filters aan.'
          }
          actionLabel={deals.length === 0 ? 'Nieuwe deal' : 'Filters wissen'}
          onAction={() => {
            if (deals.length === 0) {
              setModalOpen(true)
              return
            }
            setSearchQuery('')
            setStageFilter('all')
            setSortBy('waarde')
          }}
        />
      )}

      <AddDealModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={refreshDeals}
      />

      <EditDealModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        deal={selectedDeal}
        onSuccess={refreshDeals}
      />
    </div>
  )
}
