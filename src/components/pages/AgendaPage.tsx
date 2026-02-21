'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  Video,
  Edit,
} from 'lucide-react'

import AddAfspraakModal from '@/components/modals/AddAfspraakModal'
import EditAfspraakModal from '@/components/modals/EditAfspraakModal'
import { PageEmptyState, PageInlineError, PagePanel } from '@/components/dashboard/PageStates'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'

type AfspraakType = 'meeting' | 'call' | 'deadline' | 'task'
type AfspraakStatus = 'gepland' | 'bezig' | 'afgerond'

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

function toDateOnly(value: string | null): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
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
    task: 'Task',
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

function currentTimeHHmm() {
  const now = new Date()
  return now.toISOString().slice(11, 16)
}

export default function AgendaPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [searchQuery, setSearchQuery] = useDashboardQueryText('agenda_q')
  const [typeFilter, setTypeFilter] = useDashboardQueryEnum(
    'agenda_type',
    'all',
    ['all', 'meeting', 'call', 'deadline', 'task'] as const
  )
  const [selectedDate, setSelectedDate] = useDashboardQueryText('agenda_date')

  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedAfspraak, setSelectedAfspraak] = useState<Afspraak | null>(null)
  const [afspraken, setAfspraken] = useState<Afspraak[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Auto-open create modal when prop is true
  useEffect(() => {
    if (autoOpenCreate && !modalOpen) {
      setModalOpen(true)
    }
  }, [autoOpenCreate, modalOpen])

  const fetchAfspraken = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/afspraken', { cache: 'no-store' })
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

  useEffect(() => {
    void fetchAfspraken()
  }, [fetchAfspraken, refreshKey])

  const filteredAfspraken = useMemo(() => {
    const loweredSearch = searchQuery.toLowerCase()

    return afspraken
      .filter((afspraak) => {
        const type = deriveType(afspraak)

        const matchesSearch =
          afspraak.titel.toLowerCase().includes(loweredSearch) ||
          (afspraak.beschrijving ?? '').toLowerCase().includes(loweredSearch) ||
          (afspraak.bedrijf ?? '').toLowerCase().includes(loweredSearch)

        const matchesType = typeFilter === 'all' || type === typeFilter
        const matchesDate = !selectedDate || toDateOnly(afspraak.startTijd) === selectedDate

        return matchesSearch && matchesType && matchesDate
      })
      .sort((a, b) => {
        const left = new Date(a.startTijd ?? '').getTime()
        const right = new Date(b.startTijd ?? '').getTime()
        return right - left
      })
  }, [afspraken, searchQuery, selectedDate, typeFilter])

  const refreshAfspraken = () => setRefreshKey((current) => current + 1)

  const handleEdit = (afspraak: Afspraak) => {
    setSelectedAfspraak(afspraak)
    setEditModalOpen(true)
  }

  const markDone = async (afspraak: Afspraak) => {
    try {
      const response = await fetch(`/api/afspraken/${afspraak.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eindTijd: currentTimeHHmm() }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon afspraak niet bijwerken.')
      }

      toast({
        title: 'Afspraak bijgewerkt',
        description: 'Afspraak gemarkeerd als afgerond.',
      })

      refreshAfspraken()
    } catch (updateError: any) {
      toast({
        title: 'Bijwerken mislukt',
        description: updateError?.message ?? 'Kon afspraak niet bijwerken.',
        variant: 'destructive',
      })
    }
  }

  const deleteAfspraak = async (afspraakId: string) => {
    try {
      const response = await fetch(`/api/afspraken/${afspraakId}`, { method: 'DELETE' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon afspraak niet verwijderen.')
      }

      setAfspraken((current) => current.filter((afspraak) => afspraak.id !== afspraakId))
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
    }
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
        <Button
          className="bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg shadow-sky-500/25"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Afspraak
        </Button>
      </div>

      <PagePanel className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken op titel, beschrijving of bedrijf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/30 border-border/30 focus-visible:ring-sky-500/20"
            />
          </div>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-44 bg-background/30 border-border/30 focus-visible:ring-sky-500/20"
          />

          <Select value={typeFilter} onValueChange={(value: 'all' | AfspraakType) => setTypeFilter(value)}>
            <SelectTrigger className="w-full sm:w-40 bg-background/30 border-border/30">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="task">Task</SelectItem>
            </SelectContent>
          </Select>
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
          {loading && Array.from({ length: 6 }).map((_, index) => (
            <div key={`agenda-loading-${index}`} className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
          ))}

          {!loading && filteredAfspraken.map((afspraak) => {
            const type = deriveType(afspraak)
            const status = deriveStatus(afspraak)

            return (
              <Card
                key={afspraak.id}
                className="group bg-card/40 border border-border/30 rounded-xl p-4 hover:shadow-lg hover:bg-card/60 hover:border-border/50 transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground group-hover:text-sky-500 transition-colors">
                        {afspraak.titel}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <TypeBadge type={type} />
                        <span className="text-sm text-muted-foreground">
                          {formatTime(afspraak.startTijd)} - {formatTime(afspraak.eindTijd)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {afspraak.beschrijving || 'Geen beschrijving'}
                  </p>

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
                    <span>
                      {afspraak.deelnemers.length > 0 ? afspraak.deelnemers.join(', ') : 'Geen deelnemers'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {type === 'call' ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span>{afspraak.bedrijf ?? (type === 'call' ? 'Telefoongesprek' : 'Meeting')}</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-border/30">
                  <div className="flex items-center justify-end gap-2 w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                      onClick={() => handleEdit(afspraak)}
                      title="Bewerk afspraak"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                      onClick={() => void markDone(afspraak)}
                      title="Markeer als afgerond"
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => void deleteAfspraak(afspraak.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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
            setSearchQuery('')
            setTypeFilter('all')
            setSelectedDate('')
          }}
        />
      )}

      <AddAfspraakModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={refreshAfspraken}
      />

      <EditAfspraakModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        afspraak={selectedAfspraak}
        onSuccess={refreshAfspraken}
      />
    </div>
  )
}
