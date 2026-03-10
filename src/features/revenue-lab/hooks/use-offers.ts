'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OfferRow, OfferType, OfferStatus } from '@/lib/supabase/types'

export type { OfferRow, OfferType, OfferStatus }

export interface UseOffersOptions {
  workspaceId: string;
  status?: OfferStatus | 'all';
  offerType?: OfferType | 'all';
  limit?: number;
}

export interface UseOffersReturn {
  offers: OfferRow[];
  count: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOffers(options: UseOffersOptions): UseOffersReturn {
  const { workspaceId, status, offerType, limit = 20 } = options

  const [offers, setOffers] = useState<OfferRow[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  // Reset when filters change
  useEffect(() => {
    setOffers([])
    setCount(0)
  }, [status, offerType])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          workspace_id: workspaceId,
          limit: String(limit),
        })
        if (status && status !== 'all') params.set('status', status)
        if (offerType && offerType !== 'all') params.set('offer_type', offerType)

        const res = await fetch(`/api/offers?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: OfferRow[]; count?: number }
        setOffers(json.data ?? [])
        setCount(json.count ?? 0)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load offers')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [workspaceId, status, offerType, limit, tick])

  return { offers, count, isLoading, error, refresh }
}
