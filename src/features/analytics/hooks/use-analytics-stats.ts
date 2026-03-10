'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AnalyticsDashboard, TimeRange } from '../types'

export interface UseAnalyticsStatsReturn {
  stats: AnalyticsDashboard | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useAnalyticsStats(
  workspaceId: string,
  timeRange: TimeRange = '30d',
): UseAnalyticsStatsReturn {
  const [stats, setStats] = useState<AnalyticsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          workspace_id: workspaceId,
          time_range: timeRange,
        })

        const res = await fetch(`/api/analytics/stats?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = (await res.json()) as { data?: AnalyticsDashboard }
        setStats(json.data ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load analytics stats')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, timeRange, tick])

  return { stats, isLoading, error, refresh }
}
