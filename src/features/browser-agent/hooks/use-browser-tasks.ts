'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BrowserTask, BrowserTaskType, BrowserTaskStatus } from '../types'

export interface UseBrowserTasksOptions {
  workspaceId: string
  status?: BrowserTaskStatus | 'all'
  task_type?: BrowserTaskType | 'all'
  mission_id?: string
  limit?: number
}

export interface UseBrowserTasksReturn {
  tasks: BrowserTask[]
  total: number
  page: number
  setPage: (page: number) => void
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useBrowserTasks(options: UseBrowserTasksOptions): UseBrowserTasksReturn {
  const { workspaceId, status, task_type, mission_id, limit = 12 } = options

  const [tasks, setTasks] = useState<BrowserTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => { setPage(1) }, [status, task_type, mission_id])

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
        })
        if (status && status !== 'all') params.set('status', status)
        if (task_type && task_type !== 'all') params.set('task_type', task_type)
        if (mission_id) params.set('mission_id', mission_id)

        const res = await fetch(`/api/browser-tasks?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: BrowserTask[]; count?: number }
        setTasks(json.data ?? [])
        setTotal(json.count ?? 0)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load browser tasks')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()

    // Auto-refresh every 5s
    const interval = setInterval(() => { void load() }, 5000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [workspaceId, status, task_type, mission_id, limit, page, tick])

  return { tasks, total, page, setPage, isLoading, error, refresh }
}
