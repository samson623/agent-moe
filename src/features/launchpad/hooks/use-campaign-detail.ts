'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Campaign, UpdateCampaignInput } from '../types'

export interface UseCampaignDetailReturn {
  campaign: Campaign | null
  loading: boolean
  error: string | null
  update: (updates: UpdateCampaignInput) => Promise<void>
  remove: () => Promise<void>
  refresh: () => void
}

export function useCampaignDetail(
  campaignId: string | null,
): UseCampaignDetailReturn {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { data?: Campaign }
        setCampaign(json.data ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError(e.message || 'Failed to load campaign')
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [campaignId, tick])

  const update = useCallback(
    async (updates: UpdateCampaignInput) => {
      if (!campaignId) return
      setError(null)
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { data?: Campaign }
        setCampaign(json.data ?? null)
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to update campaign'
        setError(message)
        throw e
      }
    },
    [campaignId],
  )

  const remove = useCallback(async () => {
    if (!campaignId) return
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      setCampaign(null)
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to delete campaign'
      setError(message)
      throw e
    }
  }, [campaignId])

  return { campaign, loading, error, update, remove, refresh }
}
