'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TrendSignal, SignalMomentum } from '../types'

export type { TrendSignal, SignalMomentum }

export interface UseTrendSignalsOptions {
  workspaceId: string;
  momentum?: SignalMomentum | 'all';
  category?: string;
  platform?: string;
  minScore?: number;
  limit?: number;
}

export interface UseTrendSignalsReturn {
  signals: TrendSignal[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTrendSignals(options: UseTrendSignalsOptions): UseTrendSignalsReturn {
  const { workspaceId, momentum, category, platform, minScore, limit = 12 } = options

  const [signals, setSignals] = useState<TrendSignal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
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
          limit: String(limit),
          offset: String((page - 1) * limit),
          sort: 'opportunity',
        })
        if (momentum && momentum !== 'all') params.set('momentum', momentum)
        if (category && category !== 'all') params.set('category', category)
        if (platform && platform !== 'all') params.set('platform', platform)
        if (minScore !== undefined && minScore > 0) params.set('min_score', String(minScore))

        const res = await fetch(`/api/trend-signals?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: TrendSignal[]; count?: number }
        setSignals(json.data ?? [])
        setTotal(json.count ?? 0)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load signals')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, momentum, category, platform, minScore, limit, page, tick])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [momentum, category, platform, minScore])

  return { signals, total, page, setPage, isLoading, error, refresh }
}
