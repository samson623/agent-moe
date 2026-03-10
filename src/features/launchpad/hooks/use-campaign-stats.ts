'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CampaignStats } from '../types'

export interface UseCampaignStatsReturn {
  stats: CampaignStats | null
  loading: boolean
  error: string | null
}

export function useCampaignStats(workspaceId: string): UseCampaignStatsReturn {
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable fetch wrapped in useCallback so it can be referenced in useEffect
  const fetchStats = useCallback(async (signal: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ workspace_id: workspaceId })
      const res = await fetch(`/api/campaigns/stats?${params.toString()}`, {
        signal,
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      const json = await res.json() as { data?: CampaignStats }
      setStats(json.data ?? null)
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError(e.message || 'Failed to load campaign stats')
      }
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()
    void fetchStats(controller.signal)
    return () => controller.abort()
  }, [workspaceId, fetchStats])

  return { stats, loading, error }
}
