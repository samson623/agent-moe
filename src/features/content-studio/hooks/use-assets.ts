'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Asset, AssetRow } from '@/lib/supabase/types'

function toAsset(row: AssetRow): Asset {
  const { asset_type, content, linked_offer_id, ...rest } = row
  return { ...rest, type: asset_type, body: content, offer_id: linked_offer_id }
}

const PAGE_SIZE = 12

export interface AssetFilters {
  status?: string
  type?: string
  platform?: string
  search?: string
}

export interface UseAssetsReturn {
  assets: Asset[]
  loading: boolean
  error: string | null
  filters: AssetFilters
  setFilters: (filters: AssetFilters) => void
  page: number
  setPage: (page: number) => void
  totalCount: number
  pageCount: number
  refresh: () => void
}

export function useAssets(workspaceId: string): UseAssetsReturn {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AssetFilters>({})
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchAssets = useCallback(async () => {
    if (!workspaceId) {
      setAssets([])
      setTotalCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      let query = supabase
        .from('assets')
        .select('*', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.type) query = query.eq('asset_type', filters.type)
      if (filters.platform) query = query.eq('platform', filters.platform)
      if (filters.search) query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)

      const from = (page - 1) * PAGE_SIZE
      query = query.range(from, from + PAGE_SIZE - 1)

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      setAssets((data ?? []).map(toAsset))
      setTotalCount(count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, filters, page])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const handleSetFilters = useCallback((next: AssetFilters) => {
    setFilters(next)
    setPage(1)
  }, [])

  return {
    assets,
    loading,
    error,
    filters,
    setFilters: handleSetFilters,
    page,
    setPage,
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    refresh: fetchAssets,
  }
}
