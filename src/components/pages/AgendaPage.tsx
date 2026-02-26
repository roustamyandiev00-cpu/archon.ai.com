'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpDown,
  Calendar,
  CheckCheck,
  Clock,
  Edit,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Video,
} from 'lucide-react'

import AddAfspraakModal from '@/components/modals/AddAfspraakModal'
import EditAfspraakModal from '@/components/modals/EditAfspraakModal'
import { PageEmptyState, PageInlineError, PagePanel } from '@/components/dashboard/PageStates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDashboardQueryEnum, useDashboardQueryText } from '@/hooks/use-dashboard-query-state'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type AfspraakType = 'meeting' | 'call' | 'deadline' | 'task'
type AfspraakStatus = 'gepland' | 'bezig' | 'afgerond'
type SortOption = 'nieuwste' | 'oudste'

interface Afspraak {
  id: string
  titel: string
  beschrijving: string | null
  startTijd: string | null
  eindTijd: string | null
  locatie: string | null
  deelnemers: string[]
  bedrijf: string | null
  bedrijfId: number | null
  notities?: string | null
  createdAt: string | null
}

interface EnrichedAfspraak extends Afspraak {
  type: AfspraakType
  status: AfspraakStatus
  startMs: number
}

function deriveType(afspraak: Afspraak): AfspraakType {
  const haystack = `${afspraak.titel} ${afspraak.beschrijving ?? ''}`.toLowerCase()

  if (haystack.includes('deadline')) return 'deadline'
  if (haystack.includes('call') || haystack.includes('telefoon')) return 'call'
  if (haystack.includes('task') || haystack.includes('taak')) return 'task'
  return 'meeting'
}

function deriveStatus(afspraak: Afspraak): AfspraakStatus {
  const start = new Date(afspraak.startTijd ?? '')
  const end = new Date(afspraak.eindTijd ?? afspraak.startTijd ?? '')

  if (Number.isNaN(start.getTime())) return 'gepland'

  const now = Date.now()
  const startMs = start.getTime()
  const endMs = Number.isNaN(end.getTime()) ? startMs : end.getTime()

  if (now > endMs) return 'afgerond'
  if (now >= startMs && now <= endMs) return 'bezig'
  return 'gepland'
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function toLocalDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function parseDateInput(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function toDateOnly(value: string | null): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return toLocalDateInput(parsed)
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('nl-NL')
}

function formatTime(value: string | null): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function currentTimeHHmm() {
  const now = new Date()
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
}

function currentDateIso() {
  return toLocalDateInput(new Date())
}

function TypeBadge({ type }: { type: AfspraakType }) {
  const styles = {
    meeting: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    call: 'bg-green-500/10 text-green-600 border-green-500/20',
    deadline: 'bg-red-500/10 text-red-600 border-red-500/20',
    task: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  }

  const labels = {
    meeting: 'Meeting',
    call: 'Call',
    deadline: 'Deadline',
    task: 'Taak',
  }

  return (
    <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-medium', styles[type])}>
      {labels[type]}
    </span>
  )
}

function StatusBadge({ status }: { status: AfspraakStatus }) {
  const styles = {
    gepland: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    bezig: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    afgerond: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  }

  const labels = {
    gepland: 'Gepland',
    bezig: 'Bezig',
    afgerond: 'Afgerond',
  }

  return (
    <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-medium', styles[status])}>
      {labels[status]}
    </span>
  )
}

function buildWeekDays(selectedDate: string, todayIso: string) {
  const base = parseDateInput(selectedDate) ?? parseDateInput(todayIso) ?? new Date()
  const weekDay = (base.getDay() + 6) % 7
  const monday = new Date(base)
  monday.setDate(base.getDate() - weekDay)

  const labels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  return labels.map((label, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)

    return {
      label,
      iso: toLocalDateInput(date),
      dayMonth: date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' }),
      isToday: toLocalDateInput(date) === todayIso,
    }
  })
}

async function getAuthHeaders(contentType?: 'application/json'): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error('Kon sessie niet ophalen.')

  const token = data.session?.access_token
  if (!token) throw new Error('Niet ingelogd.')

  return contentType
    ? { Authorization: `Bearer ${token}`, 'Content-Type': contentType }
    : { Authorization: `Bearer ${token}` }
}

export default function AgendaPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('agenda_q')
  const [typeFilter, setTypeFilter] = useDashboardQueryEnum(
    'agenda_type',
    'all',
    ['all', 'meeting', 'call', 'deadline', 'task'] as const
  )
  const [statusFilter, setStatusFilter] = useDashboardQueryEnum(
    'agenda_status',
    'all',
    ['all', 'gepland', 'bezig', 'afgerond'] as const
  )
  const [sortBy, setSortBy] = useDashboardQueryEnum('agenda_sort', 'nieuwste', ['nieuwste', 'oudste'] as const)
  const [selectedDate, setSelectedDate] = useDashboardQueryText('agenda_date')

  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedAfspraak, setSelectedAfspraak] = useState<Afspraak | null>(null)
  const [afspraken, setAfspraken] = useState<Afspraak[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finishingId, setFinishingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [createDefaults, setCreateDefaults] = useState<{
    date?: string
    startTime?: string
    endTime?: string
  }>({})

  const todayIso = useMemo(() => currentDateIso(), [])

  useEffect(() => {
    if (autoOpenCreate && !modalOpen) {
      setModalOpen(true)
    }
  }, [autoOpenCreate, modalOpen])

  const fetchAfspraken = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/afspraken', {
        cache: 'no-store',
        headers,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon afspraken niet laden.')
      }

      const payload = await response.json()
      setAfspraken(Array.isArray(payload) ? payload : [])
    } catch (requestError: any) {
      setError(requestError?.message ?? 'Onbekende fout tijdens laden van afspraken.')
      setAfspraken([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAfspraken = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchAfspraken()
      toast({
        title: 'Agenda vernieuwd',
        description: 'Afspraken zijn opnieuw geladen.',
      })
    } finally {
      setRefreshing(false)
    }
  }, [fetchAfspraken])

  useEffect(() => {
    void fetchAfspraken()
  }, [fetchAfspraken])

  const enrichedAfspraken = useMemo<EnrichedAfspraak[]>(() => {
    return afspraken.map((afspraak) => {
      const startMs = new Date(afspraak.startTijd ?? '').getTime()

      return {
        ...afspraak,
        type: deriveType(afspraak),
        status: deriveStatus(afspraak),
        startMs: Number.isFinite(startMs) ? startMs : 0,
      }
    })
  }, [afspraken])

  const filteredAfspraken = useMemo(() => {
    const loweredSearch = searchQuery.trim().toLowerCase()

    const next = enrichedAfspraken.filter((afspraak) => {
      const matchesSearch =
        afspraak.titel.toLowerCase().includes(loweredSearch) ||
        (afspraak.beschrijving ?? '').toLowerCase().includes(loweredSearch) ||
        (afspraak.bedrijf ?? '').toLowerCase().includes(loweredSearch)

      const matchesType = typeFilter === 'all' || afspraak.type === typeFilter
      const matchesStatus = statusFilter === 'all' || afspraak.status === statusFilter
      const matchesDate = !selectedDate || toDateOnly(afspraak.startTijd) === selectedDate

      return matchesSearch && matchesType && matchesStatus && matchesDate
    })

    return [...next].sort((a, b) => {
      if (sortBy === 'oudste') return a.startMs - b.startMs
      return b.startMs - a.startMs
    })
  }, [enrichedAfspraken, searchQuery, typeFilter, statusFilter, selectedDate, sortBy])

  const stats = useMemo(() => {
    const today = currentDateIso()
    const now = Date.now()

    return {
      total: enrichedAfspraken.length,
      today: enrichedAfspraken.filter((afspraak) => toDateOnly(afspraak.startTijd) === today).length,
      upcoming: enrichedAfspraken.filter((afspraak) => afspraak.startMs > now).length,
      active: enrichedAfspraken.filter((afspraak) => afspraak.status === 'bezig').length,
    }
  }, [enrichedAfspraken])

  const weekDays = useMemo(() => buildWeekDays(selectedDate, todayIso), [selectedDate, todayIso])

  const slotCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const afspraak of enrichedAfspraken) {
      if (!afspraak.startTijd) continue
      const parsed = new Date(afspraak.startTijd)
      if (Number.isNaN(parsed.getTime())) continue

      const iso = toDateOnly(afspraak.startTijd)
      const hour = parsed.getHours()
      const key = `${iso}-${hour}`

      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return counts
  }, [enrichedAfspraken])

  const modalInitialDate = createDefaults.date ?? (selectedDate || todayIso)

  const handleOpenCreateForSlot = (date: string, hour: number) => {
    const safeDate = date || todayIso
    const start = `${pad2(hour)}:00`
    const end = `${pad2((hour + 1) % 24)}:00`

    setCreateDefaults({
      date: safeDate,
      startTime: start,
      endTime: end,
    })
    setModalOpen(true)
  }

  const handleEdit = (afspraak: Afspraak) => {
    setSelectedAfspraak(afspraak)
    setEditModalOpen(true)
  }

  const markDone = async (afspraak: EnrichedAfspraak) => {
    if (afspraak.status === 'afgerond') return

    setFinishingId(afspraak.id)
    try {
      const headers = await getAuthHeaders('application/json')
      const response = await fetch(`/api/afspraken/${afspraak.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          eindAt: new Date().toISOString(),
          eindTijd: currentTimeHHmm(),
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon afspraak niet bijwerken.')
      }

      toast({
        title: 'Afspraak bijgewerkt',
        description: 'Afspraak gemarkeerd als afgerond.',
      })

      await fetchAfspraken()
    } catch (updateError: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: updateError?.message ?? 'Kon afspraak niet bijwerken.',
        variant: 'destructive',
      })
    } finally {
      setFinishingId(null)
    }
  }

  const deleteAfspraak = async (afspraak: EnrichedAfspraak) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Weet u zeker dat u afspraak "${afspraak.titel}" wil verwijderen?`)
      if (!confirmed) return
    }

    setDeletingId(afspraak.id)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/afspraken/${afspraak.id}`, {
        method: 'DELETE',
        headers,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon afspraak niet verwijderen.')
      }

      setAfspraken((current) => current.filter((entry) => entry.id !== afspraak.id))
      toast({
        title: 'Afspraak verwijderd',
        description: 'De afspraak is verwijderd.',
      })
    } catch (deleteError: any) {
      toast({
        title: 'Verwijderen mislukt',
        description: deleteError?.message ?? 'Kon afspraak niet verwijderen.',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setStatusFilter('all')
    setSortBy('nieuwste')
    setSelectedDate('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-sky-500/20 to-blue-600/20">
              <Calendar className="w-6 h-6 text-sky-600" />
            </div>
            Agenda
          </h1>
          <p className="text-muted-foreground mt-1">Beheer uw afspraken</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border/50"
            onClick={() => void refreshAfspraken()}
            disabled={refreshing || loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', (refreshing || loading) && 'animate-spin')} />
            Vernieuwen
          </Button>
          <Button
            className="bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg shadow-sky-500/25"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Afspraak
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/70">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Totaal afspraken</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/70">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Vandaag</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.today}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/70">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Aankomend</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.upcoming}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/70">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Nu bezig</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.active}</p>
          </CardContent>
        </Card>
      </div>

      <PagePanel className="p-4">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken op titel, beschrijving of bedrijf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border/50 focus-visible:ring-sky-500/20"
            />
          </div>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full xl:w-44 bg-background border-border/50 focus-visible:ring-sky-500/20"
          />

          <Select value={typeFilter} onValueChange={(value: 'all' | AfspraakType) => setTypeFilter(value)}>
            <SelectTrigger className="w-full xl:w-40 bg-background border-border/50">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="task">Taak</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value: 'all' | AfspraakStatus) => setStatusFilter(value)}>
            <SelectTrigger className="w-full xl:w-40 bg-background border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="gepland">Gepland</SelectItem>
              <SelectItem value="bezig">Bezig</SelectItem>
              <SelectItem value="afgerond">Afgerond</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-full xl:w-40 bg-background border-border/50">
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nieuwste">Nieuwste</SelectItem>
              <SelectItem value="oudste">Oudste</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="w-full xl:w-auto" onClick={resetFilters}>
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Filters wissen
          </Button>
        </div>
      </PagePanel>

      <PagePanel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Klik in een vak om snel een afspraak te plannen op een specifieke dag en tijd.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px] border border-border/50 rounded-xl bg-linear-to-br from-background/60 via-card/70 to-background/80">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] text-xs border-b border-border/50">
              <div className="p-2 text-muted-foreground bg-background" />
              {weekDays.map((day) => {
                const isSelected = day.iso === selectedDate
                return (
                  <button
                    key={day.iso}
                    type="button"
                    className={cn(
                      'p-2 text-center border-l border-border/20 bg-card shadow-sm hover:bg-card transition-colors',
                      day.isToday && 'text-sky-300',
                      isSelected && 'bg-sky-500/15 text-sky-100 font-medium border-sky-500/60'
                    )}
                    onClick={() => setSelectedDate(day.iso)}
                  >
                    <div>{day.label}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{day.dayMonth}</div>
                  </button>
                )
              })}
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {Array.from({ length: 18 }).map((_, rowIndex) => {
                const hour = 6 + rowIndex
                return (
                  <div
                    key={`agenda-grid-row-${hour}`}
                    className="grid grid-cols-[80px_repeat(7,1fr)] border-t border-border/20 text-xs"
                  >
                    <div className="px-2 py-2 text-right text-muted-foreground bg-background">{pad2(hour)}:00</div>
                    {weekDays.map((day) => {
                      const slotKey = `${day.iso}-${hour}`
                      const count = slotCounts.get(slotKey) ?? 0

                      return (
                        <button
                          key={`agenda-grid-cell-${day.iso}-${hour}`}
                          type="button"
                          className="relative border-l border-border/10 h-9 bg-card shadow-sm hover:bg-sky-500/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 transition-colors"
                          onClick={() => handleOpenCreateForSlot(day.iso, hour)}
                          title={`Nieuwe afspraak op ${day.iso} om ${pad2(hour)}:00`}
                        >
                          {count > 0 && (
                            <span className="absolute right-1 top-1 inline-flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-sky-500/25 text-[10px] text-sky-100 border border-sky-500/40">
                              {count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </PagePanel>

      {error && !loading && (
        <PageInlineError
          title="Afspraken konden niet geladen worden"
          description={error}
          onRetry={() => void fetchAfspraken()}
        />
      )}

      {!error && (loading || filteredAfspraken.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`agenda-loading-${index}`} className="h-64 rounded-2xl bg-muted animate-pulse" />
            ))}

          {!loading &&
            filteredAfspraken.map((afspraak) => {
              return (
                <Card
                  key={afspraak.id}
                  className="group bg-card shadow-sm border border-border/50 rounded-xl p-4 hover:shadow-lg hover:bg-card hover:border-border/50 transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground group-hover:text-sky-500 transition-colors">
                          {afspraak.titel}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <TypeBadge type={afspraak.type} />
                          <span className="text-sm text-muted-foreground">
                            {formatTime(afspraak.startTijd)} - {formatTime(afspraak.eindTijd)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={afspraak.status} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{afspraak.beschrijving || 'Geen beschrijving'}</p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(afspraak.startTijd)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{afspraak.locatie ?? 'Locatie niet opgegeven'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{afspraak.deelnemers.length > 0 ? afspraak.deelnemers.join(', ') : 'Geen deelnemers'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {afspraak.type === 'call' ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      <span>{afspraak.bedrijf ?? (afspraak.type === 'call' ? 'Telefoongesprek' : 'Meeting')}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-end gap-2 w-full">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                        onClick={() => handleEdit(afspraak)}
                        title="Bewerk afspraak"
                        disabled={deletingId === afspraak.id}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                        onClick={() => void markDone(afspraak)}
                        title="Markeer als afgerond"
                        disabled={
                          afspraak.status === 'afgerond' ||
                          finishingId === afspraak.id ||
                          deletingId === afspraak.id
                        }
                      >
                        <CheckCheck className={cn('w-4 h-4', finishingId === afspraak.id && 'animate-pulse')} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => void deleteAfspraak(afspraak)}
                        disabled={deletingId === afspraak.id || finishingId === afspraak.id}
                        title="Verwijder afspraak"
                      >
                        <Trash2 className={cn('w-4 h-4', deletingId === afspraak.id && 'animate-pulse')} />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
        </div>
      )}

      {!loading && !error && filteredAfspraken.length === 0 && (
        <PageEmptyState
          icon={Calendar}
          title={afspraken.length === 0 ? 'Nog geen afspraken' : 'Geen afspraken gevonden'}
          description={
            afspraken.length === 0
              ? 'Plan uw eerste afspraak om de agenda te vullen.'
              : 'Pas uw filters of zoekopdracht aan.'
          }
          actionLabel={afspraken.length === 0 ? 'Nieuwe afspraak' : 'Filters wissen'}
          onAction={() => {
            if (afspraken.length === 0) {
              setModalOpen(true)
              return
            }
            resetFilters()
          }}
        />
      )}

      <AddAfspraakModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => void fetchAfspraken()}
        initialDate={modalInitialDate}
        initialStartTime={createDefaults.startTime}
        initialEndTime={createDefaults.endTime}
      />

      <EditAfspraakModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        afspraak={selectedAfspraak}
        onSuccess={() => void fetchAfspraken()}
      />
    </div>
  )
}
