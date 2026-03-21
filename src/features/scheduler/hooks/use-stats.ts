'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScheduledMissionStats } from '../types'

export interface UseStatsReturn {
  stats: ScheduledMissionStats | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useStats(workspaceId: string): UseStatsReturn {
  const [stats, setStats] = useState<ScheduledMissionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ workspace_id: workspaceId })
        const res = await fetch(`/api/scheduler/stats?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { stats?: ScheduledMissionStats }
        setStats(json.stats ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError(e.message || 'Failed to load scheduler stats')
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, tick])

  return { stats, loading, error, refresh }
}
