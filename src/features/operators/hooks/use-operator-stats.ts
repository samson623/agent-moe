'use client'

import { useState, useEffect, useCallback } from 'react'

export interface TeamStats {
  completed: number
  failed: number
  running: number
  pending: number
  total: number
}

export interface OperatorStats {
  content_strike: TeamStats
  growth_operator: TeamStats
  revenue_closer: TeamStats
  brand_guardian: TeamStats
}

const EMPTY_TEAM: TeamStats = { completed: 0, failed: 0, running: 0, pending: 0, total: 0 }

const EMPTY_STATS: OperatorStats = {
  content_strike: EMPTY_TEAM,
  growth_operator: EMPTY_TEAM,
  revenue_closer: EMPTY_TEAM,
  brand_guardian: EMPTY_TEAM,
}

export function useOperatorStats(workspaceId: string) {
  const [stats, setStats] = useState<OperatorStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!workspaceId) {
      setStats(EMPTY_STATS)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/operators/stats?workspace_id=${encodeURIComponent(workspaceId)}`,
        { signal },
      )
      if (!res.ok) throw new Error(`Failed to fetch stats (${res.status})`)
      const json = await res.json()
      setStats(json.data ?? EMPTY_STATS)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])

  return { stats, loading, error, refresh: () => refresh() }
}
