'use client'

import { useState, useCallback } from 'react'
import type { Campaign } from '../types'

export interface UseLaunchCampaignReturn {
  launch: (campaignId: string) => Promise<Campaign | null>
  launching: boolean
  error: string | null
}

export function useLaunchCampaign(): UseLaunchCampaignReturn {
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const launch = useCallback(
    async (campaignId: string): Promise<Campaign | null> => {
      setLaunching(true)
      setError(null)
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/launch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { data?: Campaign }
        return json.data ?? null
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to launch campaign'
        setError(message)
        return null
      } finally {
        setLaunching(false)
      }
    },
    [],
  )

  return { launch, launching, error }
}
