/**
 * Activity log and analytics event query helpers.
 *
 * Activity logs are the human-readable system history (shown in the
 * Command Center activity feed). Analytics events are structured telemetry
 * for charts and reporting (shown in Phase 12 Analytics dashboard).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  ActivityLog,
  ActivityLogInsert,
  AnalyticsEvent,
  AnalyticsEventInsert,
  OperatorTeam,
  ModelUsed,
  Platform,
} from '../types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsFilters {
  event_type?: string
  entity_type?: string
  operator_team?: OperatorTeam
  model_used?: ModelUsed
  platform?: Platform
  from?: string
  to?: string
}

// ---------------------------------------------------------------------------
// Activity log queries
// ---------------------------------------------------------------------------

/**
 * Returns the most recent activity log entries for a workspace.
 * Defaults to the last 50 entries — suitable for the Command Center feed.
 */
export async function getActivityLogs(
  client: TypedClient,
  workspaceId: string,
  limit = 50,
): Promise<{ data: ActivityLog[]; error: string | null }> {
  const clampedLimit = Math.min(200, Math.max(1, limit))

  const { data, error } = await client
    .from('activity_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(clampedLimit)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as ActivityLog[], error: null }
}

/**
 * Inserts a new activity log entry.
 * Returns the created row so the caller can append it to an optimistic feed.
 */
export async function logActivity(
  client: TypedClient,
  entry: ActivityLogInsert,
): Promise<{ data: ActivityLog | null; error: string | null }> {
  const { data, error } = await client
    .from('activity_logs')
    .insert(entry)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as ActivityLog | null, error: null }
}

// ---------------------------------------------------------------------------
// Analytics event queries
// ---------------------------------------------------------------------------

/**
 * Returns analytics events for a workspace, with optional filters.
 * Suitable for feeding chart components and the analytics dashboard.
 *
 * Results are ordered by `occurred_at` ascending so time-series charts
 * get data in the correct order without client-side re-sorting.
 */
export async function getAnalyticsEvents(
  client: TypedClient,
  workspaceId: string,
  filters: AnalyticsFilters = {},
  limit = 1000,
): Promise<{ data: AnalyticsEvent[]; error: string | null }> {
  const clampedLimit = Math.min(5000, Math.max(1, limit))

  let query = client
    .from('analytics_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('occurred_at', { ascending: true })
    .limit(clampedLimit)

  if (filters.event_type) {
    query = query.eq('event_type', filters.event_type)
  }
  if (filters.entity_type) {
    query = query.eq('entity_type', filters.entity_type)
  }
  if (filters.operator_team) {
    query = query.eq('operator_team', filters.operator_team)
  }
  if (filters.model_used) {
    query = query.eq('model_used', filters.model_used)
  }
  if (filters.platform) {
    query = query.eq('platform', filters.platform)
  }
  if (filters.from) {
    query = query.gte('occurred_at', filters.from)
  }
  if (filters.to) {
    query = query.lte('occurred_at', filters.to)
  }

  const { data, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as AnalyticsEvent[], error: null }
}

/**
 * Inserts a new analytics event.
 * Fire-and-forget in most calling contexts — errors are returned but rarely
 * need to block the user-facing flow.
 */
export async function trackAnalyticsEvent(
  client: TypedClient,
  event: AnalyticsEventInsert,
): Promise<{ data: AnalyticsEvent | null; error: string | null }> {
  const { data, error } = await client
    .from('analytics_events')
    .insert(event)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as AnalyticsEvent | null, error: null }
}
