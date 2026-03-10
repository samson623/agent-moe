'use client'

import { useState, useCallback } from 'react'
import type { BrowserTask, BrowserTaskInput } from '../types'

export interface UseCreateBrowserTaskReturn {
  create: (input: BrowserTaskInput) => Promise<BrowserTask | null>
  isCreating: boolean
  error: string | null
}

export function useCreateBrowserTask(): UseCreateBrowserTaskReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (input: BrowserTaskInput): Promise<BrowserTask | null> => {
    setIsCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/browser-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      const json = await res.json() as { data?: BrowserTask }
      return json.data ?? null
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create task')
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  return { create, isCreating, error }
}
