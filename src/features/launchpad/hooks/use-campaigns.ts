'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Campaign, CampaignStatus } from '../types'

export interface UseCampaignsFilters {
  status?: CampaignStatus
}

export interface UseCampaignsReturn {
  campaigns: Campaign[]
  total: number
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useCampaigns(
  workspaceId: string,
  filters?: UseCampaignsFilters,
): UseCampaignsReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  // Reset list whenever filters change so stale rows are never displayed
  useEffect(() => {
    setCampaigns([])
    setTotal(0)
  }, [filters?.status])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ workspace_id: workspaceId })
        if (filters?.status) params.set('status', filters.status)

        const res = await fetch(`/api/campaigns?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }

        const json = await res.json() as { data?: Campaign[]; total?: number }
        setCampaigns(json.data ?? [])
        setTotal(json.total ?? 0)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError(e.message || 'Failed to load campaigns')
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, filters?.status, tick])

  return { campaigns, total, loading, error, refresh }
}
