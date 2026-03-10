'use client'

import { useState, useCallback } from 'react'
import type { FeedbackInsight } from '../types'

export interface UseFeedbackInsightsReturn {
  insights: FeedbackInsight[]
  isLoading: boolean
  error: string | null
  generate: () => void
}

export function useFeedbackInsights(workspaceId: string): UseFeedbackInsightsReturn {
  const [insights, setInsights] = useState<FeedbackInsight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Does NOT auto-fetch — only fetches when generate() is called
  const generate = useCallback(() => {
    if (!workspaceId) return

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/analytics/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: workspaceId }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = (await res.json()) as { data?: FeedbackInsight[] }
        setInsights(json.data ?? [])
      } catch (e) {
        if (e instanceof Error) {
          setError('Failed to generate feedback insights')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [workspaceId])

  return { insights, isLoading, error, generate }
}
