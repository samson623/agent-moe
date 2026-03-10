/**
 * Supabase query helpers for launch_campaigns (Phase 11)
 *
 * All helpers accept a typed SupabaseClient as their first argument so they
 * can be called from Server Components, API routes, or Server Actions without
 * creating a new client internally. They never throw — every function returns
 * { data, error } so callers can handle failures gracefully.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  CampaignStatus,
  LaunchCampaignInsert,
  LaunchCampaignUpdate,
} from '@/lib/supabase/types'

export type { CampaignStatus }

// createClient() from @supabase/ssr mis-maps type params vs supabase-js v2.98.0,
// so we cast the incoming client to the single-type-param form to ensure the
// query builder resolves Schema = Database['public'] correctly.
type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Interface definitions
// ---------------------------------------------------------------------------

export interface TimelineMilestone {
  date: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'skipped'
  asset_ids: string[]
  mission_id: string | null
}

/** Typed representation of a launch_campaigns DB row. */
export interface Campaign {
  id: string
  workspace_id: string
  name: string
  description: string
  status: CampaignStatus
  launch_date: string | null
  end_date: string | null
  mission_ids: string[]
  asset_ids: string[]
  offer_id: string | null
  timeline: TimelineMilestone[]
  meta: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CampaignStats {
  total: number
  active: number
  draft: number
  completed: number
  archived: number
  total_assets: number
}

// Convenience input shapes (derived from DB Insert/Update, with timeline typed)
export type CampaignInsert = Omit<LaunchCampaignInsert, 'timeline'> & {
  timeline?: TimelineMilestone[]
}
export type CampaignUpdate = Omit<LaunchCampaignUpdate, 'timeline'> & {
  timeline?: TimelineMilestone[]
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rowToCampaign(row: Database['public']['Tables']['launch_campaigns']['Row']): Campaign {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    name: row.name,
    description: row.description,
    status: row.status,
    launch_date: row.launch_date,
    end_date: row.end_date,
    mission_ids: row.mission_ids,
    asset_ids: row.asset_ids,
    offer_id: row.offer_id,
    timeline: Array.isArray(row.timeline) ? (row.timeline as unknown as TimelineMilestone[]) : [],
    meta: (row.meta ?? {}) as Record<string, unknown>,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** List campaigns for a workspace with optional status filter and pagination. */
export async function getCampaigns(
  client: TypedClient,
  workspaceId: string,
  filters?: { status?: CampaignStatus },
  pagination?: { page: number; pageSize: number }
): Promise<{
  data: { data: Campaign[]; count: number; page: number; pageSize: number } | null
  error: Error | null
}> {
  try {
    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = (client as unknown as SupabaseClient<Database>)
      .from('launch_campaigns')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data: rows, error, count } = await query

    if (error) return { data: null, error: new Error(`getCampaigns: ${error.message}`) }

    return {
      data: {
        data: (rows ?? []).map(rowToCampaign),
        count: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Fetch a single campaign by ID. Returns null if not found. */
export async function getCampaign(
  client: TypedClient,
  id: string
): Promise<{ data: Campaign | null; error: Error | null }> {
  try {
    const { data: row, error } = await (client as unknown as SupabaseClient<Database>)
      .from('launch_campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: new Error(`getCampaign: ${error.message}`) }
    }

    return { data: row ? rowToCampaign(row) : null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Create a new launch campaign. */
export async function createCampaign(
  client: TypedClient,
  input: CampaignInsert
): Promise<{ data: Campaign | null; error: Error | null }> {
  try {
    const { data: row, error } = await (client as unknown as SupabaseClient<Database>)
      .from('launch_campaigns')
      .insert({
        ...input,
        timeline: (input.timeline ?? []) as unknown as LaunchCampaignInsert['timeline'],
      } as unknown as LaunchCampaignInsert)
      .select('*')
      .single()

    if (error) return { data: null, error: new Error(`createCampaign: ${error.message}`) }
    return { data: row ? rowToCampaign(row) : null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Update an existing campaign by ID. */
export async function updateCampaign(
  client: TypedClient,
  id: string,
  updates: CampaignUpdate
): Promise<{ data: Campaign | null; error: Error | null }> {
  try {
    const payload: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    }
    if (updates.timeline !== undefined) {
      payload.timeline = updates.timeline as unknown as LaunchCampaignUpdate['timeline']
    }

    const { data: row, error } = await (client as unknown as SupabaseClient<Database>)
      .from('launch_campaigns')
      .update(payload as unknown as LaunchCampaignUpdate)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return { data: null, error: new Error(`updateCampaign: ${error.message}`) }
    return { data: row ? rowToCampaign(row) : null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Delete a campaign by ID. */
export async function deleteCampaign(
  client: TypedClient,
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await (client as unknown as SupabaseClient<Database>)
      .from('launch_campaigns')
      .delete()
      .eq('id', id)

    if (error) return { error: new Error(`deleteCampaign: ${error.message}`) }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * Compute campaign stats for a workspace.
 * Single DB round-trip: fetches all campaigns and counts in JS.
 */
export async function getCampaignStats(
  client: TypedClient,
  workspaceId: string
): Promise<{ data: CampaignStats | null; error: Error | null }> {
  try {
    const { data: rows, error } = await (client as unknown as SupabaseClient<Database>)
      .from('launch_campaigns')
      .select('status, asset_ids')
      .eq('workspace_id', workspaceId)

    if (error) return { data: null, error: new Error(`getCampaignStats: ${error.message}`) }

    const campaigns = rows ?? []
    const totalAssets = campaigns.reduce(
      (sum, c) => sum + (Array.isArray(c.asset_ids) ? c.asset_ids.length : 0),
      0
    )

    const stats: CampaignStats = {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === 'active').length,
      draft: campaigns.filter((c) => c.status === 'draft').length,
      completed: campaigns.filter((c) => c.status === 'completed').length,
      archived: campaigns.filter((c) => c.status === 'archived').length,
      total_assets: totalAssets,
    }

    return { data: stats, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * Append asset IDs to a campaign's asset_ids array.
 * Fetches the current campaign, merges the arrays (deduped), then updates.
 */
export async function addAssetsToCampaign(
  client: TypedClient,
  campaignId: string,
  assetIds: string[]
): Promise<{ data: Campaign | null; error: Error | null }> {
  try {
    const { data: existing, error: fetchError } = await getCampaign(client, campaignId)
    if (fetchError) return { data: null, error: fetchError }
    if (!existing) return { data: null, error: new Error(`addAssetsToCampaign: campaign ${campaignId} not found`) }

    const merged = Array.from(new Set([...existing.asset_ids, ...assetIds]))
    return updateCampaign(client, campaignId, { asset_ids: merged })
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * Remove a single asset ID from a campaign's asset_ids array.
 * Fetches the current campaign, filters out the ID, then updates.
 */
export async function removeAssetFromCampaign(
  client: TypedClient,
  campaignId: string,
  assetId: string
): Promise<{ data: Campaign | null; error: Error | null }> {
  try {
    const { data: existing, error: fetchError } = await getCampaign(client, campaignId)
    if (fetchError) return { data: null, error: fetchError }
    if (!existing) return { data: null, error: new Error(`removeAssetFromCampaign: campaign ${campaignId} not found`) }

    const filtered = existing.asset_ids.filter((id) => id !== assetId)
    return updateCampaign(client, campaignId, { asset_ids: filtered })
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Replace the full timeline JSONB for a campaign. */
export async function updateCampaignTimeline(
  client: TypedClient,
  campaignId: string,
  timeline: TimelineMilestone[]
): Promise<{ data: Campaign | null; error: Error | null }> {
  return updateCampaign(client, campaignId, { timeline })
}

/** List all campaigns with status = 'active' for a workspace. */
export async function getActiveCampaigns(
  client: TypedClient,
  workspaceId: string
): Promise<{ data: Campaign[]; error: Error | null }> {
  try {
    const { data: rows, error } = await (client as unknown as SupabaseClient<Database>)
      .from('launch_campaigns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('launch_date', { ascending: true })

    if (error) return { data: [], error: new Error(`getActiveCampaigns: ${error.message}`) }
    return { data: (rows ?? []).map(rowToCampaign), error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) }
  }
}
