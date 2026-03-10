'use client'

import { useState, useCallback } from 'react'
import type { Asset, AssetStatus, Platform } from '@/lib/supabase/types'

interface UseAssetDetailReturn {
  asset: Asset
  loading: boolean
  error: string | null
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  refresh: () => Promise<void>
  updateBody: (body: string, title: string | null) => Promise<void>
  updateStatus: (status: AssetStatus) => Promise<void>
  updatePlatform: (platform: Platform) => Promise<void>
  duplicate: () => Promise<Asset | null>
  remove: () => Promise<boolean>
}

export function useAssetDetail(initialAsset: Asset): UseAssetDetailReturn {
  const [asset, setAsset] = useState<Asset>(initialAsset)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/assets/${asset.id}`)
      if (!res.ok) throw new Error('Failed to fetch asset')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setAsset(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
      setLoading(false)
    }
  }, [asset.id])

  const updateBody = useCallback(
    async (body: string, title: string | null) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/assets/${asset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body, title }),
        })
        if (!res.ok) throw new Error('Update failed')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setAsset(json.data)
        setIsEditing(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
      } finally {
        setLoading(false)
      }
    },
    [asset.id],
  )

  const updateStatus = useCallback(
    async (status: AssetStatus) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/assets/${asset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) throw new Error('Status update failed')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setAsset(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status')
      } finally {
        setLoading(false)
      }
    },
    [asset.id],
  )

  const updatePlatform = useCallback(
    async (platform: Platform) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/assets/${asset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform }),
        })
        if (!res.ok) throw new Error('Platform update failed')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setAsset(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update platform')
      } finally {
        setLoading(false)
      }
    },
    [asset.id],
  )

  const duplicate = useCallback(async (): Promise<Asset | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/assets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: asset.workspace_id,
          asset_ids: [asset.id],
          action: 'duplicate',
        }),
      })
      if (!res.ok) throw new Error('Duplication failed')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      const dupId = json.data?.duplicated_ids?.[0]
      if (!dupId) throw new Error('No duplicate ID returned')
      const detailRes = await fetch(`/api/assets/${dupId}`)
      const detail = await detailRes.json()
      return detail.data ?? null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate')
      return null
    } finally {
      setLoading(false)
    }
  }, [asset.id, asset.workspace_id])

  const remove = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      return false
    } finally {
      setLoading(false)
    }
  }, [asset.id])

  return {
    asset,
    loading,
    error,
    isEditing,
    setIsEditing,
    refresh,
    updateBody,
    updateStatus,
    updatePlatform,
    duplicate,
    remove,
  }
}
