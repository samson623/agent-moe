'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ContentPerformance, TimeRange } from '../types'

export interface UseContentPerformanceReturn {
  data: ContentPerformance | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useContentPerformance(
  workspaceId: string,
  timeRange: TimeRange = '30d',
): UseContentPerformanceReturn {
  const [data, setData] = useState<ContentPerformance | null>(null)
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

        const res = await fetch(`/api/analytics/content?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = (await res.json()) as { data?: ContentPerformance }
        setData(json.data ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load content performance')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, timeRange, tick])

  return { data, isLoading, error, refresh }
}
