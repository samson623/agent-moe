'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ActivityItem {
  id: string
  actor_type: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  summary: string
  details: Record<string, unknown>
  created_at: string
}

export function useOperatorActivity(workspaceId: string, limit = 20) {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!workspaceId) {
      setActivity([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/operators/activity?workspace_id=${encodeURIComponent(workspaceId)}&limit=${limit}`,
        { signal },
      )
      if (!res.ok) throw new Error(`Failed to fetch activity (${res.status})`)
      const json = await res.json()
      setActivity(Array.isArray(json) ? json : json.data ?? [])
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, limit])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])

  return { activity, loading, error, refresh: () => refresh() }
}
