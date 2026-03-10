'use client'

import { useState, useCallback } from 'react'
import type { Campaign, CreateCampaignInput } from '../types'

export interface UseCreateCampaignReturn {
  create: (input: CreateCampaignInput) => Promise<Campaign | null>
  creating: boolean
  error: string | null
}

export function useCreateCampaign(): UseCreateCampaignReturn {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(
    async (input: CreateCampaignInput): Promise<Campaign | null> => {
      setCreating(true)
      setError(null)
      try {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { data?: Campaign }
        return json.data ?? null
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to create campaign'
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
