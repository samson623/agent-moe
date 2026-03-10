'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BrowserTask } from '../types'

export interface UseBrowserTaskDetailReturn {
  task: BrowserTask | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useBrowserTaskDetail(taskId: string): UseBrowserTaskDetailReturn {
  const [task, setTask] = useState<BrowserTask | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!taskId) return

    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/browser-tasks/${taskId}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: BrowserTask }
        setTask(json.data ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load task')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()

    // Poll every 2s while task is running
    const pollInterval = setInterval(async () => {
      if (task?.status === 'running' || task?.status === 'pending') {
        void load()
      }
    }, 2000)

    return () => {
      controller.abort()
      clearInterval(pollInterval)
    }
  }, [taskId, tick, task?.status])

  return { task, isLoading, error, refresh }
}
