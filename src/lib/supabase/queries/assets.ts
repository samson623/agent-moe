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
  Json,
  Asset,
  AssetInsert,
  AssetRow,
  AssetStatus,
  AssetType,
  Platform,
  OperatorTeam,
} from '../types'

type TypedClient = SupabaseClient<Database>

function toAsset(row: AssetRow): Asset {
  const { asset_type, content, linked_offer_id, ...rest } = row
  return { ...rest, type: asset_type, body: content, offer_id: linked_offer_id }
}

function toInsertRow(insert: Omit<AssetInsert, 'type' | 'body' | 'offer_id'> & {
  type: AssetInsert['type']; body?: string; offer_id?: string | null
}): Database['public']['Tables']['assets']['Insert'] {
  const { type, body, offer_id, ...rest } = insert
  return { ...rest, asset_type: type, content: body ?? '', linked_offer_id: offer_id } as Database['public']['Tables']['assets']['Insert']
}

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
    query = query.eq('asset_type', filters.type)
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
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  const total = count ?? 0

  return {
    data: {
      data: (data ?? []).map(toAsset),
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

  return { data: data ? toAsset(data) : null, error: null }
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
    .insert(toInsertRow(asset))
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ? toAsset(data) : null, error: null }
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

  return { data: data ? toAsset(data) : null, error: null }
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

  return { data: (data ?? []).map(toAsset), error: null }
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

  return { data: (data ?? []).map(toAsset), error: null }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Updates arbitrary fields on a single asset and returns the updated row.
 */
export async function updateAsset(
  client: TypedClient,
  assetId: string,
  updates: Partial<Pick<Asset, 'title' | 'body' | 'metadata' | 'status' | 'platform' | 'confidence_score' | 'offer_id'>>,
): Promise<{ data: Asset | null; error: string | null }> {
  const { body, offer_id, ...rest } = updates
  const dbUpdates: Database['public']['Tables']['assets']['Update'] = {
    ...rest,
    ...(body !== undefined && { content: body }),
    ...(offer_id !== undefined && { linked_offer_id: offer_id }),
  }

  const { data, error } = await client
    .from('assets')
    .update(dbUpdates)
    .eq('id', assetId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ? toAsset(data) : null, error: null }
}

/**
 * Duplicates an existing asset as a new draft with version incremented by 1.
 * The copy links back to the root parent via `parent_asset_id`.
 */
export async function duplicateAsset(
  client: TypedClient,
  assetId: string,
): Promise<{ data: Asset | null; error: string | null }> {
  const { data: orig, error: fetchError } = await getAsset(client, assetId)

  if (fetchError || !orig) {
    return { data: null, error: fetchError ?? 'Asset not found' }
  }

  const { data, error } = await client
    .from('assets')
    .insert({
      workspace_id: orig.workspace_id,
      mission_id: orig.mission_id,
      job_id: orig.job_id,
      operator_team: orig.operator_team,
      asset_type: orig.type,
      platform: orig.platform,
      status: 'draft' as const,
      title: orig.title,
      content: orig.body,
      metadata: orig.metadata as Json,
      confidence_score: orig.confidence_score,
      linked_offer_id: orig.offer_id,
      version: orig.version + 1,
      parent_asset_id: orig.parent_asset_id ?? orig.id,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ? toAsset(data) : null, error: null }
}

/**
 * Creates a new version of an asset with updated content.
 * Links to the root parent and bumps the version counter.
 */
export async function createAssetVersion(
  client: TypedClient,
  assetId: string,
  updates: { body: string; title?: string | null; metadata?: Json },
): Promise<{ data: Asset | null; error: string | null }> {
  const { data: orig, error: fetchError } = await getAsset(client, assetId)

  if (fetchError || !orig) {
    return { data: null, error: fetchError ?? 'Asset not found' }
  }

  const rootId = orig.parent_asset_id ?? orig.id

  const { count } = await client
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .or(`id.eq.${rootId},parent_asset_id.eq.${rootId}`)

  const nextVersion = (count ?? orig.version) + 1

  const { data, error } = await client
    .from('assets')
    .insert({
      workspace_id: orig.workspace_id,
      mission_id: orig.mission_id,
      job_id: orig.job_id,
      operator_team: orig.operator_team,
      asset_type: orig.type,
      platform: orig.platform,
      status: 'draft' as const,
      title: (updates.title !== undefined ? updates.title : orig.title) ?? 'Untitled',
      content: updates.body,
      metadata: (updates.metadata ?? orig.metadata) as Json,
      confidence_score: orig.confidence_score,
      linked_offer_id: orig.offer_id,
      version: nextVersion,
      parent_asset_id: rootId,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ? toAsset(data) : null, error: null }
}

/**
 * Hard-deletes an asset by ID.
 */
export async function deleteAsset(
  client: TypedClient,
  assetId: string,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('assets')
    .delete()
    .eq('id', assetId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Bulk-updates the status of multiple assets in a single query.
 * Returns the number of rows affected.
 */
export async function bulkUpdateAssetStatus(
  client: TypedClient,
  assetIds: string[],
  status: AssetStatus,
): Promise<{ count: number; error: string | null }> {
  const { data, error } = await client
    .from('assets')
    .update({ status })
    .in('id', assetIds)
    .select('id')

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: data?.length ?? 0, error: null }
}
