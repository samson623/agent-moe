'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TrendSignal } from '../types'

export interface UseOpportunitiesReturn {
  opportunities: TrendSignal[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  topSignal: TrendSignal | null;
}

export function useOpportunities(workspaceId: string): UseOpportunitiesReturn {
  const [opportunities, setOpportunities] = useState<TrendSignal[]>([])
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
          limit: '10',
          sort: 'opportunity',
        })

        const res = await fetch(`/api/trend-signals?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: TrendSignal[] }
        setOpportunities(json.data ?? [])
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load opportunities')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, tick])

  const topSignal = opportunities[0] ?? null

  return { opportunities, isLoading, error, refresh, topSignal }
}
