'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OfferRow } from '@/lib/supabase/types'

export interface UseOfferDetailReturn {
  offer: OfferRow | null;
  isLoading: boolean;
  error: string | null;
  update: (updates: Partial<OfferRow>) => Promise<void>;
  remove: () => Promise<void>;
  refresh: () => void;
}

export function useOfferDetail(offerId: string | null): UseOfferDetailReturn {
  const [offer, setOffer] = useState<OfferRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!offerId) {
      setOffer(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/offers/${offerId}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json() as { data?: OfferRow }
        setOffer(json.data ?? null)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load offer')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [offerId, tick])

  const update = useCallback(async (updates: Partial<OfferRow>) => {
    if (!offerId) return
    setError(null)
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { data?: OfferRow }
      setOffer(json.data ?? null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update offer'
      setError(message)
      throw e
    }
  }, [offerId])

  const remove = useCallback(async () => {
    if (!offerId) return
    setError(null)
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setOffer(null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete offer'
      setError(message)
      throw e
    }
  }, [offerId])

  return { offer, isLoading, error, update, remove, refresh }
}
