'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Timer,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PageEmptyState, PageInlineError, PagePanel } from '@/components/dashboard/PageStates'

interface Timesheet {
  id: string
  datum: string
  projectId: string | null
  project: string
  activiteit: string
  uren: number
  billable: boolean
  notities: string | null
  createdAt: string
}

// Helper functions
function formatDate(dateValue: string): string {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getWeekBounds(weekOffset: number): { start: Date; end: Date; label: string } {
  const now = new Date()
  const currentDay = now.getDay()
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay
  
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  const formatDay = (d: Date) => d.getDate()
  const formatMonth = (d: Date) => d.toLocaleDateString('nl-NL', { month: 'short' })
  
  const label = `${formatDay(monday)} - ${formatDay(sunday)} ${formatMonth(sunday)} ${sunday.getFullYear()}`
  
  return { start: monday, end: sunday, label }
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('nl-NL', { weekday: 'short' })
}

// Custom Tooltip for Chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/90 backdrop-blur-xl px-3 py-2 rounded-lg shadow-lg border border-border/30 text-popover-foreground">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{payload[0].value} uur</p>
      </div>
    )
  }
  return null
}

function TableLoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={`timesheet-loading-${index}`} className="border-border/20">
      <TableCell><div className="h-4 w-24 rounded bg-muted/50 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-32 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-28 rounded bg-muted/40 animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-16 rounded-full bg-muted/35 animate-pulse" /></TableCell>
      <TableCell><div className="h-6 w-16 rounded-full bg-muted/35 animate-pulse" /></TableCell>
      <TableCell><div className="h-8 w-8 rounded bg-muted/30 animate-pulse ml-auto" /></TableCell>
    </TableRow>
  ))
}

export default function TimesheetsPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form states
  const [formDatum, setFormDatum] = useState('')
  const [formProject, setFormProject] = useState('')
  const [formActiviteit, setFormActiviteit] = useState('')
  const [formUren, setFormUren] = useState('')
  const [formBillable, setFormBillable] = useState(true)
  const [formNotities, setFormNotities] = useState('')

  const currentWeek = useMemo(() => getWeekBounds(weekOffset), [weekOffset])

  // Auto-open create modal
  useEffect(() => {
    if (autoOpenCreate && !isAddModalOpen) {
      setIsAddModalOpen(true)
    }
  }, [autoOpenCreate, isAddModalOpen])

  // Fetch timesheets
  const fetchTimesheets = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        weekStart: currentWeek.start.toISOString(),
        weekEnd: currentWeek.end.toISOString(),
      })
      
      const response = await fetch(`/api/timesheets?${params}`, { cache: 'no-store' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon timesheets niet laden')
      }
      
      const data = await response.json()
      setTimesheets(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message ?? 'Onbekende fout bij laden van timesheets')
      setTimesheets([])
    } finally {
      setLoading(false)
    }
  }, [currentWeek])

  useEffect(() => {
    void fetchTimesheets()
  }, [fetchTimesheets])

  // Calculate stats
  const stats = useMemo(() => {
    const dezeWeek = timesheets.reduce((sum, t) => sum + t.uren, 0)
    const billableHours = timesheets.filter(t => t.billable).reduce((sum, t) => sum + t.uren, 0)
    const billablePercentage = dezeWeek > 0 ? Math.round((billableHours / dezeWeek) * 100) : 0
    
    return { dezeWeek, billablePercentage }
  }, [timesheets])

  // Calculate previous week stats
  const [prevWeekStats, setPrevWeekStats] = useState({ vorigeWeek: 0 })

  useEffect(() => {
    const fetchPrevWeek = async () => {
      const prevWeek = getWeekBounds(weekOffset - 1)
      const params = new URLSearchParams({
        weekStart: prevWeek.start.toISOString(),
        weekEnd: prevWeek.end.toISOString(),
      })
      
      try {
        const response = await fetch(`/api/timesheets?${params}`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const vorigeWeek = Array.isArray(data) ? data.reduce((sum: number, t: Timesheet) => sum + t.uren, 0) : 0
          setPrevWeekStats({ vorigeWeek })
        }
      } catch {
        // Ignore errors for previous week
      }
    }
    
    void fetchPrevWeek()
  }, [weekOffset])

  // Weekly hours for chart
  const weeklyHours = useMemo(() => {
    const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
    const hoursByDay: Record<string, number> = {}
    
    // Initialize all days
    days.forEach(day => { hoursByDay[day] = 0 })
    
    // Aggregate hours by day
    timesheets.forEach(t => {
      const date = new Date(t.datum)
      const dayName = date.toLocaleDateString('nl-NL', { weekday: 'short' })
      const shortDay = dayName.charAt(0).toUpperCase() + dayName.slice(1, 2).toLowerCase()
      if (hoursByDay[shortDay] !== undefined) {
        hoursByDay[shortDay] += t.uren
      }
    })
    
    return days.map(dag => ({ dag, uren: hoursByDay[dag] }))
  }, [timesheets])

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setWeekOffset(current => direction === 'prev' ? current - 1 : current + 1)
  }

  const resetForm = () => {
    setFormDatum(new Date().toISOString().split('T')[0])
    setFormProject('')
    setFormActiviteit('')
    setFormUren('')
    setFormBillable(true)
    setFormNotities('')
  }

  const openAddModal = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const openEditModal = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet)
    setFormDatum(new Date(timesheet.datum).toISOString().split('T')[0])
    setFormProject(timesheet.project)
    setFormActiviteit(timesheet.activiteit)
    setFormUren(timesheet.uren.toString())
    setFormBillable(timesheet.billable)
    setFormNotities(timesheet.notities || '')
    setIsEditModalOpen(true)
  }

  const handleAddTimesheet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formProject || !formActiviteit || !formUren) {
      toast({ title: 'Vul alle verplichte velden in', variant: 'destructive' })
      return
    }
    
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datum: formDatum,
          project: formProject,
          activiteit: formActiviteit,
          uren: parseFloat(formUren),
          billable: formBillable,
          notities: formNotities || null,
        }),
      })
      
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon entry niet aanmaken')
      }
      
      toast({ title: 'Entry aangemaakt' })
      setIsAddModalOpen(false)
      void fetchTimesheets()
    } catch (err: any) {
      toast({ title: 'Fout bij aanmaken', description: err?.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditTimesheet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTimesheet) return
    if (!formProject || !formActiviteit || !formUren) {
      toast({ title: 'Vul alle verplichte velden in', variant: 'destructive' })
      return
    }
    
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/timesheets/${selectedTimesheet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datum: formDatum,
          project: formProject,
          activiteit: formActiviteit,
          uren: parseFloat(formUren),
          billable: formBillable,
          notities: formNotities || null,
        }),
      })
      
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon entry niet bijwerken')
      }
      
      toast({ title: 'Entry bijgewerkt' })
      setIsEditModalOpen(false)
      void fetchTimesheets()
    } catch (err: any) {
      toast({ title: 'Fout bij bijwerken', description: err?.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTimesheet = async () => {
    if (!selectedTimesheet) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/timesheets/${selectedTimesheet.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'Kon entry niet verwijderen')
      }
      
      toast({ title: 'Entry verwijderd' })
      setIsDeleteDialogOpen(false)
      void fetchTimesheets()
    } catch (err: any) {
      toast({ title: 'Fout bij verwijderen', description: err?.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timesheets</h1>
          <p className="text-muted-foreground">Beheer uw tijdregistratie</p>
        </div>
        <Button
          className="bg-linear-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-200"
          onClick={openAddModal}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Entry
        </Button>
      </div>

      {/* Week Selector */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="bg-card/60 backdrop-blur-xl border-border/30"
          onClick={() => handleWeekChange('prev')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{currentWeek.label}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="bg-card/60 backdrop-blur-xl border-border/30"
          onClick={() => handleWeekChange('next')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-600/10">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deze week</p>
              <p className="text-2xl font-bold text-foreground">{stats.dezeWeek} uur</p>
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-linear-to-br from-sky-500/20 to-sky-600/10">
              <Timer className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vorige week</p>
              <p className="text-2xl font-bold text-foreground">{prevWeekStats.vorigeWeek} uur</p>
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500/20 to-emerald-600/10">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billable</p>
              <p className="text-2xl font-bold text-foreground">{stats.billablePercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Overview Chart */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
        <h3 className="text-lg font-semibold text-foreground mb-4">Weekoverzicht</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyHours}>
              <XAxis
                dataKey="dag"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="uren"
                radius={[8, 8, 0, 0]}
              >
                {weeklyHours.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === weeklyHours.length - 1 ? '#0ea5e9' : '#3b82f6'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <PageInlineError
          title="Timesheets konden niet geladen worden"
          description={error}
          onRetry={() => void fetchTimesheets()}
        />
      )}

      {/* Time Entries Table */}
      {!error && (loading || timesheets.length > 0) && (
        <PagePanel className="overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <h3 className="text-lg font-semibold text-foreground">Tijdregistraties</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Datum</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Project</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Activiteit</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Uren</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Billable</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableLoadingRows />}
              
              {!loading && timesheets.map((entry) => (
                <TableRow key={entry.id} className="border-border/20 hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-foreground">{formatDate(entry.datum)}</TableCell>
                  <TableCell className="text-foreground/80">{entry.project}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.activiteit}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted border-border/30 text-foreground/80 font-medium">
                      {entry.uren} uur
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.billable ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ja
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border/30">
                        Nee
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/60">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => openEditModal(entry)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => {
                            setSelectedTimesheet(entry)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PagePanel>
      )}

      {/* Empty State */}
      {!loading && !error && timesheets.length === 0 && (
        <PageEmptyState
          icon={Clock}
          title="Nog geen tijdregistraties"
          description={`Geen entries voor de week van ${currentWeek.label}.`}
          actionLabel="Nieuwe entry"
          onAction={openAddModal}
        />
      )}

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuwe tijdregistratie</DialogTitle>
            <DialogDescription>Voeg een nieuwe entry toe.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTimesheet}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="datum">Datum</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={formDatum}
                    onChange={(e) => setFormDatum(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uren">Uren</Label>
                  <Input
                    id="uren"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formUren}
                    onChange={(e) => setFormUren(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Input
                  id="project"
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                  placeholder="Projectnaam"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activiteit">Activiteit</Label>
                <Input
                  id="activiteit"
                  value={formActiviteit}
                  onChange={(e) => setFormActiviteit(e.target.value)}
                  placeholder="Bijv. Development, Meeting"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="billable"
                  checked={formBillable}
                  onChange={(e) => setFormBillable(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="billable">Billable</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notities">Notities</Label>
                <Input
                  id="notities"
                  value={formNotities}
                  onChange={(e) => setFormNotities(e.target.value)}
                  placeholder="Optioneel"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Entry bewerken</DialogTitle>
            <DialogDescription>Wijzig de gegevens van deze tijdregistratie.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTimesheet}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-datum">Datum</Label>
                  <Input
                    id="edit-datum"
                    type="date"
                    value={formDatum}
                    onChange={(e) => setFormDatum(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-uren">Uren</Label>
                  <Input
                    id="edit-uren"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formUren}
                    onChange={(e) => setFormUren(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project">Project</Label>
                <Input
                  id="edit-project"
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-activiteit">Activiteit</Label>
                <Input
                  id="edit-activiteit"
                  value={formActiviteit}
                  onChange={(e) => setFormActiviteit(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-billable"
                  checked={formBillable}
                  onChange={(e) => setFormBillable(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-billable">Billable</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notities">Notities</Label>
                <Input
                  id="edit-notities"
                  value={formNotities}
                  onChange={(e) => setFormNotities(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entry verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze entry wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDeleteTimesheet} disabled={isDeleting}>
              {isDeleting ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
