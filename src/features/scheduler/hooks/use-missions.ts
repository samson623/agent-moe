'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScheduledMission, ScheduleType } from '../types'

export interface UseMissionsFilters {
  is_active?: boolean
  schedule_type?: ScheduleType
  tags?: string[]
}

export interface UseMissionsReturn {
  missions: ScheduledMission[]
  total: number
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useMissions(
  workspaceId: string,
  filters?: UseMissionsFilters,
): UseMissionsReturn {
  const [missions, setMissions] = useState<ScheduledMission[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    setMissions([])
    setTotal(0)
  }, [filters?.is_active, filters?.schedule_type, filters?.tags?.join(',')])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ workspace_id: workspaceId })
        if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active))
        if (filters?.schedule_type) params.set('schedule_type', filters.schedule_type)
        if (filters?.tags?.length) params.set('tags', filters.tags.join(','))

        const res = await fetch(`/api/scheduler?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { missions?: ScheduledMission[]; total?: number }
        setMissions(json.missions ?? [])
        setTotal(json.total ?? 0)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError(e.message || 'Failed to load scheduled missions')
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, filters?.is_active, filters?.schedule_type, filters?.tags?.join(','), tick])

  return { missions, total, loading, error, refresh }
}
