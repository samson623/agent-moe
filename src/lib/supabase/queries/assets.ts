/**
 * Asset query helpers.
 *
 * Assets are generated content pieces (posts, scripts, CTAs, etc.) produced
 * by operator teams. These helpers cover the full CRUD surface needed by
 * Content Studio, the Approval Queue, and the Mission detail view.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  Asset,
  AssetInsert,
  AssetStatus,
  AssetType,
  Platform,
  OperatorTeam,
} from '../types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetFilters {
  status?: AssetStatus
  type?: AssetType
  platform?: Platform
  operator_team?: OperatorTeam
  mission_id?: string
  search?: string
}

export interface AssetPaginationOptions {
  page?: number
  pageSize?: number
}

export interface PaginatedAssets {
  data: Asset[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns a paginated, filterable list of assets for a workspace.
 * Results are ordered newest first.
 */
export async function getAssets(
  client: TypedClient,
  workspaceId: string,
  filters: AssetFilters = {},
  pagination: AssetPaginationOptions = {},
): Promise<{ data: PaginatedAssets | null; error: string | null }> {
  const page = Math.max(1, pagination.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, pagination.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from('assets')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  if (filters.platform) {
    query = query.eq('platform', filters.platform)
  }
  if (filters.operator_team) {
    query = query.eq('operator_team', filters.operator_team)
  }
  if (filters.mission_id) {
    query = query.eq('mission_id', filters.mission_id)
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  const total = count ?? 0

  return {
    data: {
      data: (data ?? []) as unknown as Asset[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    error: null,
  }
}

/**
 * Returns a single asset by ID.
 * Also fetches any linked approval record for the approval queue view.
 */
export async function getAsset(
  client: TypedClient,
  assetId: string,
): Promise<{ data: Asset | null; error: string | null }> {
  const { data, error } = await client
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Asset | null, error: null }
}

/**
 * Inserts a new asset row and returns the created record.
 */
export async function createAsset(
  client: TypedClient,
  asset: AssetInsert,
): Promise<{ data: Asset | null; error: string | null }> {
  const { data, error } = await client
    .from('assets')
    .insert(asset)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Asset | null, error: null }
}

/**
 * Updates the status of a single asset.
 * Returns the updated row so callers can optimistically update their UI.
 */
export async function updateAssetStatus(
  client: TypedClient,
  assetId: string,
  status: AssetStatus,
): Promise<{ data: Asset | null; error: string | null }> {
  const { data, error } = await client
    .from('assets')
    .update({ status })
    .eq('id', assetId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Asset | null, error: null }
}

/**
 * Returns all assets that belong to a specific mission, ordered by creation
 * time (oldest first so the generation sequence is readable).
 */
export async function getAssetsByMission(
  client: TypedClient,
  missionId: string,
): Promise<{ data: Asset[]; error: string | null }> {
  const { data, error } = await client
    .from('assets')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as Asset[], error: null }
}

/**
 * Returns all version siblings of an asset — i.e., assets that share the
 * same `parent_asset_id` (or are the parent itself). Useful for the version
 * comparison view in Content Studio.
 */
export async function getAssetVersions(
  client: TypedClient,
  assetId: string,
  parentAssetId: string | null,
): Promise<{ data: Asset[]; error: string | null }> {
  const rootId = parentAssetId ?? assetId

  const { data, error } = await client
    .from('assets')
    .select('*')
    .or(`id.eq.${rootId},parent_asset_id.eq.${rootId}`)
    .order('version', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as Asset[], error: null }
}
