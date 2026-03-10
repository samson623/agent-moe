'use client'

import { useState, useCallback } from 'react'
import type { OfferRow, OfferType, OfferStatus } from '@/lib/supabase/types'

export interface CreateOfferInput {
  name: string;
  description?: string;
  offer_type: OfferType;
  price_cents?: number | null;
  currency?: string;
  cta_text?: string;
  cta_url?: string;
  status?: OfferStatus;
  meta?: Record<string, unknown>;
}

export interface UseCreateOfferReturn {
  create: (workspaceId: string, input: CreateOfferInput) => Promise<OfferRow>;
  isCreating: boolean;
  error: string | null;
}

export function useCreateOffer(): UseCreateOfferReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (
    workspaceId: string,
    input: CreateOfferInput,
  ): Promise<OfferRow> => {
    setIsCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, ...input }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json() as { data?: OfferRow }
      if (!json.data) throw new Error('No data returned from server')
      return json.data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create offer'
      setError(message)
      throw e
    } finally {
      setIsCreating(false)
    }
  }, [])

  return { create, isCreating, error }
}
