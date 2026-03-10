'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BrowserTaskStats } from '../types'

export interface UseBrowserTaskStatsReturn {
  stats: BrowserTaskStats | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useBrowserTaskStats(workspaceId: string): UseBrowserTaskStatsReturn {
  const [stats, setStats] = useState<BrowserTaskStats | null>(null)
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
        const res = await fetch(`/api/browser-tasks/stats?workspace_id=${workspaceId}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: BrowserTaskStats }
        setStats(json.data ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load stats')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()

    const interval = setInterval(() => { void load() }, 10000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [workspaceId, tick])

  return { stats, isLoading, error, refresh }
}
