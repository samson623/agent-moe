'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RevenueStats } from '../types'

export type { RevenueStats }

export interface UseRevenueStatsReturn {
  stats: RevenueStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRevenueStats(workspaceId: string): UseRevenueStatsReturn {
  const [stats, setStats] = useState<RevenueStats | null>(null)
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
        const params = new URLSearchParams({ workspace_id: workspaceId })

        const res = await fetch(`/api/revenue/stats?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: RevenueStats }
        setStats(json.data ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load revenue stats')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, tick])

  return { stats, isLoading, error, refresh }
}
