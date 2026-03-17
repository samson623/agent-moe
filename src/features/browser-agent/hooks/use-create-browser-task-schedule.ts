'use client'

import { useState, useCallback } from 'react'
import type { BrowserTaskSchedule, BrowserTaskScheduleInput } from '../types'

export interface UseCreateBrowserTaskScheduleReturn {
  create: (input: BrowserTaskScheduleInput) => Promise<BrowserTaskSchedule | null>
  isCreating: boolean
  error: string | null
}

export function useCreateBrowserTaskSchedule(): UseCreateBrowserTaskScheduleReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (input: BrowserTaskScheduleInput): Promise<BrowserTaskSchedule | null> => {
    setIsCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/browser-task-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      const json = await res.json() as { data?: BrowserTaskSchedule }
      return json.data ?? null
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create schedule')
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  return { create, isCreating, error }
}
