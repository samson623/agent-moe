'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BrowserTaskSchedule } from '../types'

export interface UseBrowserTaskSchedulesOptions {
  workspaceId: string
  is_active?: boolean
  limit?: number
}

export interface UseBrowserTaskSchedulesReturn {
  schedules: BrowserTaskSchedule[]
  total: number
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useBrowserTaskSchedules(
  options: UseBrowserTaskSchedulesOptions,
): UseBrowserTaskSchedulesReturn {
  const { workspaceId, is_active, limit = 50 } = options

  const [schedules, setSchedules] = useState<BrowserTaskSchedule[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()
    let isFirst = true

    async function load() {
      if (isFirst) { setIsLoading(true); setError(null) }
      try {
        const params = new URLSearchParams({
          workspace_id: workspaceId,
          limit: String(limit),
        })
        if (is_active !== undefined) params.set('is_active', String(is_active))

        const res = await fetch(`/api/browser-task-schedules?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: BrowserTaskSchedule[]; count?: number }
        setSchedules(json.data ?? [])
        setTotal(json.count ?? 0)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load schedules')
        }
      } finally {
        if (isFirst) { setIsLoading(false); isFirst = false }
      }
    }

    void load()

    // Refresh every 60s
    const interval = setInterval(() => { void load() }, 60000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [workspaceId, is_active, limit, tick])

  return { schedules, total, isLoading, error, refresh }
}
