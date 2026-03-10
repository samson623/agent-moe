'use client'

import { useState, useCallback } from 'react'
import type { CTAVariant, GenerateCTAsResult } from '../types'

export type { CTAVariant, GenerateCTAsResult }

export interface GenerateCTAsOptions {
  platforms?: string[];
  content_types?: string[];
}

export interface UseCTAEngineReturn {
  variants: CTAVariant[];
  isGenerating: boolean;
  error: string | null;
  generateCTAs: (offerId: string, options?: GenerateCTAsOptions) => Promise<void>;
  clear: () => void;
}

export function useCTAEngine(): UseCTAEngineReturn {
  const [variants, setVariants] = useState<CTAVariant[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateCTAs = useCallback(async (
    offerId: string,
    options?: GenerateCTAsOptions,
  ) => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/offers/${offerId}/generate-ctas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: options?.platforms,
          content_types: options?.content_types,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json() as GenerateCTAsResult
      // Append new variants to existing — do not replace
      setVariants((prev) => [...prev, ...(json.variants ?? [])])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate CTAs'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const clear = useCallback(() => {
    setVariants([])
    setError(null)
  }, [])

  return { variants, isGenerating, error, generateCTAs, clear }
}
