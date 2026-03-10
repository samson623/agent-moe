'use client'

import { useState, useCallback } from 'react'

export interface UseExecuteBrowserTaskReturn {
  execute: (taskId: string) => Promise<void>
  cancel: (taskId: string) => Promise<void>
  isExecuting: boolean
  isCancelling: boolean
  error: string | null
}

export function useExecuteBrowserTask(): UseExecuteBrowserTaskReturn {
  const [isExecuting, setIsExecuting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (taskId: string) => {
    setIsExecuting(true)
    setError(null)
    try {
      const res = await fetch(`/api/browser-tasks/${taskId}/execute`, {
        method: 'POST',
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to execute task')
    } finally {
      setIsExecuting(false)
    }
  }, [])

  const cancel = useCallback(async (taskId: string) => {
    setIsCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/browser-tasks/${taskId}/cancel`, {
        method: 'POST',
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel task')
    } finally {
      setIsCancelling(false)
    }
  }, [])

  return { execute, cancel, isExecuting, isCancelling, error }
}
