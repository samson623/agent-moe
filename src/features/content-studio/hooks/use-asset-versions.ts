'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Asset } from '@/lib/supabase/types'

interface UseAssetVersionsReturn {
  versions: Asset[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createVersion: (body: string, title?: string | null) => Promise<Asset | null>
}

export function useAssetVersions(
  assetId: string,
): UseAssetVersionsReturn {
  const [versions, setVersions] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/assets/${assetId}/versions`)
      if (!res.ok) throw new Error('Failed to fetch versions')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setVersions(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }, [assetId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId])

  const createVersion = useCallback(
    async (body: string, title?: string | null): Promise<Asset | null> => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/assets/${assetId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body, ...(title !== undefined && { title }) }),
        })
        if (!res.ok) throw new Error('Version creation failed')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        await refresh()
        return json.data ?? null
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create version')
        return null
      } finally {
        setLoading(false)
      }
    },
    [assetId, refresh],
  )

  return {
    versions,
    loading,
    error,
    refresh,
    createVersion,
  }
}
