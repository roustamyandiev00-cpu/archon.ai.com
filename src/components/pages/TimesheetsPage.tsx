'use client'

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
  CheckCircle2
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useDashboardQueryNumber } from '@/hooks/use-dashboard-query-state'

// Sample Data
const timesheetStats = { dezeWeek: 32, vorigeWeek: 38, billablePercentage: 85 }

const weeklyHours = [
  { dag: "Ma", uren: 7.5 },
  { dag: "Di", uren: 8 },
  { dag: "Wo", uren: 6.5 },
  { dag: "Do", uren: 5 },
  { dag: "Vr", uren: 5 },
]

const timeEntries = [
  { id: 1, datum: "12 Feb 2025", project: "E-commerce Platform", activiteit: "Development", uren: 4.5, billable: true },
  { id: 2, datum: "12 Feb 2025", project: "Mobile App", activiteit: "Team meeting", uren: 1.5, billable: false },
  { id: 3, datum: "11 Feb 2025", project: "Cloud Migration", activiteit: "Implementation", uren: 6, billable: true },
  { id: 4, datum: "11 Feb 2025", project: "Internal", activiteit: "Admin", uren: 2, billable: false },
  { id: 5, datum: "10 Feb 2025", project: "E-commerce Platform", activiteit: "Code review", uren: 3, billable: true },
  { id: 6, datum: "10 Feb 2025", project: "Mobile App", activiteit: "Development", uren: 4, billable: true },
  { id: 7, datum: "9 Feb 2025", project: "Cloud Migration", activiteit: "Planning", uren: 2, billable: true },
  { id: 8, datum: "9 Feb 2025", project: "Internal", activiteit: "Training", uren: 3, billable: false },
]

const weeks = ["10 - 16 Feb 2025", "17 - 23 Feb 2025", "24 Feb - 2 Mrt 2025"] as const

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

export default function TimesheetsPage({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [weekIndex, setWeekIndex] = useDashboardQueryNumber('timesheets_week', 0, {
    min: 0,
    max: weeks.length - 1,
  })
  const currentWeek = weeks[weekIndex] ?? weeks[0]

  const handleNewEntry = () =>
    toast({
      title: 'Nieuwe Entry',
      description: 'Tijdregistratie toevoegen wordt geïmplementeerd.',
    })

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setWeekIndex((current) => {
      if (direction === 'prev') return Math.max(0, current - 1)
      return Math.min(weeks.length - 1, current + 1)
    })

    toast({
      title: 'Week wisselen',
      description: direction === 'prev' ? 'Vorige week geladen.' : 'Volgende week geladen.',
    })
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
          onClick={handleNewEntry}
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
          <span className="font-medium text-foreground">{currentWeek}</span>
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
              <p className="text-2xl font-bold text-foreground">{timesheetStats.dezeWeek} uur</p>
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
              <p className="text-2xl font-bold text-foreground">{timesheetStats.vorigeWeek} uur</p>
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
              <p className="text-2xl font-bold text-foreground">{timesheetStats.billablePercentage}%</p>
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

      {/* Time Entries Table */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden hover:shadow-xl hover:bg-card/75 transition-[background-color,box-shadow,border-color] duration-300">
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
            {timeEntries.map((entry) => (
              <tr
                key={entry.id}
                className="border-border/20 hover:bg-muted/40 transition-colors"
              >
                <TableCell className="font-medium text-foreground">{entry.datum}</TableCell>
                <TableCell>
                  <span className="text-foreground/80">{entry.project}</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{entry.activiteit}</span>
                </TableCell>
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
                        onClick={() =>
                          toast({
                            title: 'Entry Bewerken',
                            description: `Entry op ${entry.datum} wordt bewerkt.`,
                          })
                        }
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={() =>
                          toast({
                            title: 'Entry Verwijderen',
                            description: `Entry op ${entry.datum} wordt verwijderd.`,
                            variant: 'destructive',
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
