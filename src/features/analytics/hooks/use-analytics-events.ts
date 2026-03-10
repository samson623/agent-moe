'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AnalyticsEvent } from '../types'

export interface UseAnalyticsEventsFilters {
  event_type?: string
  entity_type?: string
  limit?: number
  offset?: number
}

export interface UseAnalyticsEventsReturn {
  events: AnalyticsEvent[]
  total: number
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useAnalyticsEvents(
  workspaceId: string,
  filters?: UseAnalyticsEventsFilters,
): UseAnalyticsEventsReturn {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  // Reset list whenever filters change so stale rows are never displayed
  useEffect(() => {
    setEvents([])
    setTotal(0)
  }, [filters?.event_type, filters?.entity_type, filters?.limit, filters?.offset])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ workspace_id: workspaceId })
        if (filters?.event_type) params.set('event_type', filters.event_type)
        if (filters?.entity_type) params.set('entity_type', filters.entity_type)
        if (filters?.limit != null) params.set('limit', String(filters.limit))
        if (filters?.offset != null) params.set('offset', String(filters.offset))

        const res = await fetch(`/api/analytics/events?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = (await res.json()) as {
          data?: AnalyticsEvent[]
          total?: number
        }
        setEvents(json.data ?? [])
        setTotal(json.total ?? 0)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load analytics events')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [
    workspaceId,
    filters?.event_type,
    filters?.entity_type,
    filters?.limit,
    filters?.offset,
    tick,
  ])

  return { events, total, isLoading, error, refresh }
}
