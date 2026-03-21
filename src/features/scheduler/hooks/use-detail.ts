'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScheduledMission, ScheduledMissionUpdate } from '../types'

export interface UseDetailReturn {
  mission: ScheduledMission | null
  loading: boolean
  error: string | null
  update: (updates: ScheduledMissionUpdate) => Promise<void>
  remove: () => Promise<void>
  toggle: () => Promise<void>
  runNow: () => Promise<void>
  refresh: () => void
}

export function useDetail(missionId: string | null): UseDetailReturn {
  const [mission, setMission] = useState<ScheduledMission | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!missionId) {
      setMission(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/scheduler/${missionId}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { mission?: ScheduledMission }
        setMission(json.mission ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError(e.message || 'Failed to load scheduled mission')
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [missionId, tick])

  const update = useCallback(
    async (updates: ScheduledMissionUpdate) => {
      if (!missionId) return
      setError(null)
      try {
        const res = await fetch(`/api/scheduler/${missionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { mission?: ScheduledMission }
        setMission(json.mission ?? null)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update mission'
        setError(message)
        throw e
      }
    },
    [missionId],
  )

  const remove = useCallback(async () => {
    if (!missionId) return
    setError(null)
    try {
      const res = await fetch(`/api/scheduler/${missionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      setMission(null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete mission'
      setError(message)
      throw e
    }
  }, [missionId])

  const toggle = useCallback(async () => {
    if (!missionId) return
    setError(null)
    try {
      const res = await fetch(`/api/scheduler/${missionId}/toggle`, {
        method: 'POST',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      const json = await res.json() as { mission?: ScheduledMission }
      setMission(json.mission ?? null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to toggle mission'
      setError(message)
      throw e
    }
  }, [missionId])

  const runNow = useCallback(async () => {
    if (!missionId) return
    setError(null)
    try {
      const res = await fetch(`/api/scheduler/${missionId}/run-now`, {
        method: 'POST',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      // Refresh to show updated next_run_at
      refresh()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to trigger mission'
      setError(message)
      throw e
    }
  }, [missionId, refresh])

  return { mission, loading, error, update, remove, toggle, runNow, refresh }
}
