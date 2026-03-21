'use client'

import { useState, useCallback } from 'react'
import type { ScheduledMission, ScheduledMissionInput } from '../types'

export interface UseCreateReturn {
  create: (input: ScheduledMissionInput & { workspace_id: string }) => Promise<ScheduledMission | null>
  creating: boolean
  error: string | null
}

export function useCreate(): UseCreateReturn {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(
    async (input: ScheduledMissionInput & { workspace_id: string }): Promise<ScheduledMission | null> => {
      setCreating(true)
      setError(null)
      try {
        const res = await fetch('/api/scheduler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { mission?: ScheduledMission }
        return json.mission ?? null
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to create scheduled mission'
        setError(message)
        return null
      } finally {
        setCreating(false)
      }
    },
    [],
  )

  return { create, creating, error }
}
