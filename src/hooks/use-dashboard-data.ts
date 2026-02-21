import { useEffect, useMemo, useState } from 'react'

function safeJson(res: Response) {
  return res
    .json()
    .catch(() => null)
}

/** Zorgt dat we altijd een array hebben (API kan { error } of { data } teruggeven). */
function toArray(x: unknown): any[] {
  if (Array.isArray(x)) return x
  if (x != null && typeof x === 'object' && 'data' in x && Array.isArray((x as any).data)) return (x as any).data
  if (x != null && typeof x === 'object' && 'appointments' in x && Array.isArray((x as any).appointments)) return (x as any).appointments
  return []
}

function groupByDay(items: any[], dateKey = 'datum') {
  const map = new Map<string, number>()
  for (const it of items || []) {
    const d = it?.[dateKey] ? new Date(it[dateKey]) : null
    if (!d || Number.isNaN(d.getTime())) continue
    const key = d.toLocaleDateString('nl-NL', { weekday: 'short' })
    map.set(key, (map.get(key) ?? 0) + (Number(it.bedrag ?? it.amount ?? 0) || 0))
  }

  // last 7 days in Dutch short weekday order (Mon..Sun)
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const dt = new Date()
    dt.setDate(dt.getDate() - i)
    days.push(dt.toLocaleDateString('nl-NL', { weekday: 'short' }))
  }

  return days.map((day) => ({ day, amount: Math.round((map.get(day) ?? 0) * 100) / 100 }))
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [dealsData, setDealsData] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/dashboard/stats', { cache: 'no-store' })
        const result = await response.json()

        if (cancelled) return

        if (result.success) {
          setStats(result.stats)
          setRevenueData(result.revenueData)
          setDealsData(result.dealsData)
          
          // Fetch activities separately if needed, or use default
          const actRes = await fetch('/api/activities')
          const actData = await actRes.json()
          setActivities(toArray(actData))
        } else {
          throw new Error(result.error || 'Kon dashboard data niet laden')
        }
      } catch (err: any) {
        if (cancelled) return
        console.error('Failed to load dashboard data', err)
        setError(String(err?.message ?? err ?? 'unknown'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return {
    loading,
    error,
    stats,
    revenueData,
    dealsData,
    activities,
  }
}

export default useDashboardData
