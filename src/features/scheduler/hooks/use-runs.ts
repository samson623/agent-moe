'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScheduledMissionRun } from '../types'

export interface UseRunsReturn {
  runs: ScheduledMissionRun[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useRuns(
  missionId: string | null,
  limit = 20,
): UseRunsReturn {
  const [runs, setRuns] = useState<ScheduledMissionRun[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!missionId) {
      setRuns([])
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ limit: String(limit) })
        const res = await fetch(`/api/scheduler/${missionId}/runs?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { runs?: ScheduledMissionRun[] }
        setRuns(json.runs ?? [])
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError(e.message || 'Failed to load run history')
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [missionId, limit, tick])

  return { runs, loading, error, refresh }
}
