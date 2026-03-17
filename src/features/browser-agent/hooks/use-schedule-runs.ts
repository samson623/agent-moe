'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BrowserTask } from '../types'

export interface UseScheduleRunsReturn {
  runs: BrowserTask[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useScheduleRuns(scheduleId: string | null): UseScheduleRunsReturn {
  const [runs, setRuns] = useState<BrowserTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!scheduleId) return

    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/browser-task-schedules/${scheduleId}/runs?limit=20`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json() as { data?: BrowserTask[] }
        setRuns(json.data ?? [])
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load runs')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()

    return () => { controller.abort() }
  }, [scheduleId, tick])

  return { runs, isLoading, error, refresh }
}
