'use client'

import { useEffect, useId, useRef, useState, type ElementType } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Bot,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import useDashboardData from '@/hooks/use-dashboard-data'
import { cn } from '@/lib/utils'

interface StatItem {
  title: string
  value: number
  change: string
  trend: 'up' | 'down'
  icon: ElementType
  color: string
  gradient: string
}

interface ActivityItem {
  id?: string
  time: string
  action: string
  user: string
  type: 'deal' | 'invoice' | 'appointment' | 'contact'
}

interface Task {
  title: string
  progress: number
  priority: 'high' | 'medium' | 'low'
}

// default fallback stat items (used while data is loading)
const defaultStats: StatItem[] = [
  { title: 'Afspraken vandaag', value: 0, change: '+0%', trend: 'up', icon: Calendar, color: '#3b82f6', gradient: 'from-blue-500/20 to-blue-600/10' },
  { title: 'Achterstallige facturen', value: 0, change: '+0%', trend: 'up', icon: FileText, color: '#f59e0b', gradient: 'from-amber-500/20 to-amber-600/10' },
  { title: 'Deals in follow-up', value: 0, change: '+0%', trend: 'up', icon: TrendingUp, color: '#22c55e', gradient: 'from-emerald-500/20 to-emerald-600/10' },
  { title: 'Taken met deadline', value: 0, change: '+0%', trend: 'up', icon: Clock, color: '#38bdf8', gradient: 'from-sky-500/20 to-sky-600/10' },
]

const revenueData = [
  { day: 'Ma', amount: 4200 },
  { day: 'Di', amount: 3800 },
  { day: 'Wo', amount: 5100 },
  { day: 'Do', amount: 4600 },
  { day: 'Vr', amount: 6200 },
  { day: 'Za', amount: 3400 },
  { day: 'Zo', amount: 2800 },
]

const dealsData = [
  { name: 'Gewonnen', value: 45, color: '#22c55e' },
  { name: 'In behandeling', value: 30, color: '#3b82f6' },
  { name: 'Verloren', value: 15, color: '#ef4444' },
  { name: 'Nieuw', value: 10, color: '#f59e0b' },
]

const activities: ActivityItem[] = [
  { id: '1', time: '10:30', action: 'Nieuwe deal aangemaakt', user: 'Jan de Vries', type: 'deal' },
  { id: '2', time: '09:45', action: 'Factuur verstuurd', user: 'Maria Jansen', type: 'invoice' },
  { id: '3', time: '09:00', action: 'Afspraak gepland', user: 'Peter Bakker', type: 'appointment' },
  { id: '4', time: '08:30', action: 'Contact toegevoegd', user: 'Sophie de Graaf', type: 'contact' },
  { id: '5', time: '08:00', action: 'Offerte goedgekeurd', user: 'Klaas de Boer', type: 'deal' },
]

const tasks: Task[] = [
  { title: 'Offerte voor ACME BV', progress: 75, priority: 'high' },
  { title: 'Project presentatie', progress: 50, priority: 'medium' },
  { title: 'Klantgesprek voorbereiden', progress: 25, priority: 'low' },
  { title: 'Contract vernieuwen', progress: 90, priority: 'high' },
]

const miniChartData: Record<string, number[]> = {
  'Afspraken vandaag': [4, 6, 5, 8, 7, 9, 8],
  'Achterstallige facturen': [5, 4, 6, 5, 4, 3, 3],
  'Deals in follow-up': [8, 9, 10, 11, 10, 12, 12],
  'Taken met deadline': [6, 7, 6, 5, 6, 5, 5],
}

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const reduceMotion = useReducedMotion()
  const animate = Number.isFinite(value) && duration > 0 && !reduceMotion
  const [count, setCount] = useState(() => (Number.isFinite(value) ? Math.round(value) : 0))
  const currentValueRef = useRef(Number.isFinite(value) ? Math.round(value) : 0)

  useEffect(() => {
    if (!Number.isFinite(value)) return

    if (!animate) {
      const next = Math.round(value)
      currentValueRef.current = next
      const id = requestAnimationFrame(() => setCount(next))
      return () => cancelAnimationFrame(id)
    }

    let rafId = 0
    const startValue = currentValueRef.current
    const endValue = value
    const startTime = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const next = startValue + (endValue - startValue) * progress
      const rounded = Math.round(next)
      currentValueRef.current = rounded
      setCount(rounded)
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [animate, value, duration])

  return <span>{count}</span>
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const reactId = useId()
  const gradientId = `sparkline-gradient-${reactId.replace(/:/g, '')}`
  const chartData = data.map((value, index) => ({ value, index }))

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const icons = {
    deal: { icon: Briefcase, color: 'text-emerald-500 bg-emerald-500/10' },
    invoice: { icon: FileText, color: 'text-blue-500 bg-blue-500/10' },
    appointment: { icon: Calendar, color: 'text-sky-400 bg-sky-500/10' },
    contact: { icon: Users, color: 'text-amber-500 bg-amber-500/10' },
  } satisfies Record<ActivityItem['type'], { icon: ElementType; color: string }>

  const { icon: Icon, color } = icons[type]
  return (
    <div className={cn('p-2 rounded-lg', color)}>
      <Icon className="w-4 h-4" />
    </div>
  )
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const styles = {
    high: 'bg-red-500/10 text-red-600 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  } satisfies Record<Task['priority'], string>

  const labels = { high: 'Hoog', medium: 'Gemiddeld', low: 'Laag' } satisfies Record<Task['priority'], string>

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border', styles[priority])}>
      {labels[priority]}
    </span>
  )
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/90 backdrop-blur-xl px-3 py-2 rounded-lg shadow-lg border border-border/30 text-popover-foreground">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">€{payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export default function DashboardHome({
  formattedDate,
  onNavigate,
  onNavigateWithCreate,
  onPrefetch,
}: {
  formattedDate: string
  onNavigate: (page: string) => void
  onNavigateWithCreate?: (page: string) => void
  onPrefetch: (page?: string) => void
}) {
  const reduceMotion = useReducedMotion()
  const { loading, stats: ds, revenueData: rd, dealsData: dd, activities: acts } = useDashboardData()

  // Map fetched stats into the UI items, falling back to defaults while loading
  const stats: StatItem[] = defaultStats.map((s) => {
    if (!ds) return s
    if (s.title === 'Afspraken vandaag') return { ...s, value: ds.appointmentsToday ?? s.value }
    if (s.title === 'Achterstallige facturen') return { ...s, value: ds.overdueOffertes ?? s.value }
    if (s.title === 'Deals in follow-up') return { ...s, value: ds.dealsInFollowUp ?? s.value }
    if (s.title === 'Taken met deadline') return { ...s, value: ds.tasksDue ?? s.value }
    return s
  })

  const revenueChartData = (rd && rd.length ? rd : revenueData)
  const dealsChartData = (dd && dd.length ? dd : dealsData)
  const recentActivities: ActivityItem[] = (acts && acts.length ? acts : activities)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-card/40 backdrop-blur-xl border border-border/30 p-6 text-foreground">
        {/* Animated Border */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 opacity-25 blur-xl animate-pulse"
          style={{ transform: 'scale(1.02)' }}
        />

        {/* Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-size-[250px_250px]" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Welkom terug!</h2>
              <Badge className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-emerald-950 border-0 px-3 py-1 shadow-lg shadow-emerald-500/30 animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                ARCHON AI ACTIEF
              </Badge>
            </div>
            {formattedDate ? (
              <p className="text-muted-foreground text-sm md:text-base">{formattedDate}</p>
            ) : (
              <div
                className="h-5 w-56 rounded bg-muted/30 animate-pulse"
                aria-hidden="true"
              />
            )}
            <p className="text-muted-foreground text-sm">
              U heeft 3 nieuwe meldingen en 2 afspraken vandaag.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="bg-card/40 border-border/30 text-foreground hover:bg-card/60 backdrop-blur-xl transition-all duration-200"
              onClick={() => {
                const el = document.getElementById('recent-activity')
                el?.scrollIntoView({
                  behavior: reduceMotion ? 'auto' : 'smooth',
                  block: 'start',
                })
              }}
            >
              <Activity className="w-4 h-4 mr-2" />
              Activiteit
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-200"
              onMouseEnter={() => onPrefetch('ai-assistant')}
              onFocus={() => onPrefetch('ai-assistant')}
              onClick={() => onNavigate('ai-assistant')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.title} className="group relative">
            <div
              className={cn(
                'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                stat.gradient
              )}
            />
            <div className="relative bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-card/75">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('p-3 rounded-xl shadow-lg', `bg-gradient-to-br ${stat.gradient}`)}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
                    stat.trend === 'up'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-red-500/10 text-red-600'
                  )}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-foreground">
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <div className="w-20 h-10">
                    <Sparkline data={miniChartData[stat.title] || []} color={stat.color} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-3 bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Omzet deze week</h3>
              <p className="text-sm text-muted-foreground">Totaal: €31.300</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <Target className="w-3 h-3 mr-1" />
                +15%
              </Badge>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  tickFormatter={(value) => `€${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deals Chart */}
        <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Deals Status</h3>
              <p className="text-sm text-muted-foreground">Totaal: 100 deals</p>
            </div>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Meer opties"
                    variant="ghost"
                    size="icon"
                    className="hover:bg-card/60"
                    disabled
                  >
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Binnenkort</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center justify-center py-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={dealsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dealsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {dealsChartData.map((deal) => (
              <div key={deal.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deal.color }} />
                <span className="text-sm text-muted-foreground">{deal.name}</span>
                <span className="text-sm font-medium text-foreground ml-auto">{deal.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity & Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div id="recent-activity" className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Recente Activiteit</h3>
              <p className="text-sm text-muted-foreground">Laatste updates van vandaag</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate('deals')}
            >
              Bekijk alles
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
            {recentActivities.map((activity, index) => (
              <div
                key={activity.id ?? `activity-${index}`}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-card/60 transition-colors duration-200"
              >
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Taken</h3>
              <p className="text-sm text-muted-foreground">Nog te voltooien</p>
            </div>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    disabled
                  >
                    Alle taken
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Binnenkort</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
            {tasks.map((task) => (
              <div
                key={task.title}
                className="p-4 rounded-xl border border-border/30 hover:border-border/50 hover:shadow-md transition-all duration-200 bg-card/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <PriorityBadge priority={task.priority} />
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={task.progress} className="h-2" />
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {task.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Snelle Acties</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { icon: Plus, label: 'Nieuwe Deal', page: 'deals', color: 'from-blue-500 to-blue-600' },
            { icon: FileText, label: 'Nieuwe Factuur', page: 'inkomsten', color: 'from-amber-500 to-amber-600' },
            { icon: Users, label: 'Nieuw Contact', page: 'contacten', color: 'from-emerald-500 to-emerald-600' },
            { icon: Calendar, label: 'Afspraak', page: 'agenda', color: 'from-sky-500 to-sky-600' },
            { icon: FolderKanban, label: 'Nieuw Project', page: 'projecten', color: 'from-indigo-500 to-indigo-600' },
            { icon: Bot, label: 'AI Hulp', page: 'ai-assistant', color: 'from-cyan-500 to-cyan-600' },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onMouseEnter={() => onPrefetch(action.page)}
              onFocus={() => onPrefetch(action.page)}
              onClick={() => {
                if (action.page === 'ai-assistant') {
                  onNavigate(action.page)
                } else if (onNavigateWithCreate) {
                  onNavigateWithCreate(action.page)
                } else {
                  onNavigate(action.page)
                }
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/30 hover:border-border/50 hover:shadow-lg transition-all duration-200 group bg-card/40 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div
                className={cn(
                  'p-3 rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-200 group-hover:scale-110',
                  action.color
                )}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-foreground/80">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
