/**
 * Trend signal query helpers (Phase 7).
 *
 * trend_signals is not yet in the generated Database type — uses the same
 * `as unknown as TrendSignal` cast pattern as video-packages.ts until
 * types are regenerated after migration push.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'
import type {
  TrendSignal,
  TrendSignalInsert,
  TrendSignalUpdate,
  SignalMomentum,
} from '@/features/growth-engine/types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface GetTrendSignalsOptions {
  momentum?: SignalMomentum | 'all';
  category?: string;
  platform?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
  sort?: 'opportunity' | 'score' | 'recent';
}

/**
 * Returns a paginated, filtered list of trend signals for a workspace.
 * Default order: opportunity_score DESC.
 */
export async function getTrendSignals(
  client: TypedClient,
  workspaceId: string,
  options: GetTrendSignalsOptions = {},
): Promise<{ data: TrendSignal[] | null; error: string | null; total: number }> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 20))
  const offset = Math.max(0, options.offset ?? 0)

  const orderColumn =
    options.sort === 'score' ? 'score' :
    options.sort === 'recent' ? 'scanned_at' :
    'opportunity_score'

  let query = client
    .from('trend_signals')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order(orderColumn, { ascending: false })
    .range(offset, offset + limit - 1)

  if (options.momentum && options.momentum !== 'all') {
    query = query.eq('momentum', options.momentum)
  }

  if (options.category) {
    query = query.eq('category', options.category)
  }

  if (options.platform) {
    query = query.eq('platform', options.platform)
  }

  if (options.minScore !== undefined && options.minScore > 0) {
    query = query.gte('score', options.minScore)
  }

  const { data, error, count } = await query

  if (error) {
    return { data: null, error: error.message, total: 0 }
  }

  return {
    data: (data ?? []) as unknown as TrendSignal[],
    error: null,
    total: count ?? 0,
  }
}

/**
 * Returns a single trend signal by ID scoped to the workspace.
 */
export async function getTrendSignal(
  client: TypedClient,
  id: string,
  workspaceId: string,
): Promise<{ data: TrendSignal | null; error: string | null }> {
  const { data, error } = await client
    .from('trend_signals')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as TrendSignal | null, error: null }
}

/**
 * Creates a new trend signal.
 */
export async function createTrendSignal(
  client: TypedClient,
  data: TrendSignalInsert,
): Promise<{ data: TrendSignal | null; error: string | null }> {
  const { data: created, error } = await client
    .from('trend_signals')
    .insert(data as unknown as Database['public']['Tables']['trend_signals']['Insert'])
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: created as unknown as TrendSignal | null, error: null }
}

/**
 * Partially updates an existing trend signal.
 */
export async function updateTrendSignal(
  client: TypedClient,
  id: string,
  workspaceId: string,
  updates: TrendSignalUpdate,
): Promise<{ data: TrendSignal | null; error: string | null }> {
  const { data, error } = await client
    .from('trend_signals')
    .update(updates as unknown as Database['public']['Tables']['trend_signals']['Update'])
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as TrendSignal | null, error: null }
}

/**
 * Deletes a trend signal.
 */
export async function deleteTrendSignal(
  client: TypedClient,
  id: string,
  workspaceId: string,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('trend_signals')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  return { error: error?.message ?? null }
}

/**
 * Returns top N signals ranked by opportunity_score.
 */
export async function getTopOpportunities(
  client: TypedClient,
  workspaceId: string,
  limit = 10,
): Promise<{ data: TrendSignal[] | null; error: string | null }> {
  const { data, error } = await client
    .from('trend_signals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('opportunity_score', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: (data ?? []) as unknown as TrendSignal[], error: null }
}

/**
 * Returns currently rising/explosive signals ordered by score.
 */
export async function getTrendingTopics(
  client: TypedClient,
  workspaceId: string,
  limit = 20,
): Promise<{ data: TrendSignal[] | null; error: string | null }> {
  const { data, error } = await client
    .from('trend_signals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('momentum', ['rising', 'explosive'])
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: (data ?? []) as unknown as TrendSignal[], error: null }
}
