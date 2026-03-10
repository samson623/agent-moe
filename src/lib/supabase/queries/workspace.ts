/**
 * Workspace query helpers.
 *
 * In Agent Moe there is a 1:1 relationship between a user and a workspace
 * (single-user private platform). These helpers surface workspace metadata,
 * aggregate dashboard stats, and the full dashboard data bundle used by the
 * Command Center page.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Workspace } from '../types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkspaceStats {
  mission_count: number
  asset_count: number
  pending_approval_count: number
  active_connector_count: number
  total_jobs: number
  completed_jobs: number
}

export interface DashboardData {
  workspace: Workspace
  stats: WorkspaceStats
  recent_mission_count: number
  pending_approval_count: number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the workspace owned by the given user.
 * In this single-user platform there will always be exactly one workspace.
 */
export async function getWorkspace(
  client: TypedClient,
  userId: string,
): Promise<{ data: Workspace | null; error: string | null }> {
  const { data, error } = await client
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Workspace, error: null }
}

/**
 * Returns aggregate counts for the workspace.
 * Uses parallel count queries to minimise round-trip time.
 */
export async function getWorkspaceStats(
  client: TypedClient,
  workspaceId: string,
): Promise<{ data: WorkspaceStats | null; error: string | null }> {
  const [missions, assets, approvals, connectors, jobs] = await Promise.all([
    client
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),

    client
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),

    client
      .from('approvals')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending'),

    client
      .from('connectors')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'connected'),

    client
      .from('jobs')
      .select('status', { count: 'exact' })
      .eq('workspace_id', workspaceId),
  ])

  // Surface any query error to the caller
  const firstError =
    missions.error ??
    assets.error ??
    approvals.error ??
    connectors.error ??
    jobs.error

  if (firstError) {
    return { data: null, error: firstError.message }
  }

  const completedJobs = (jobs.data ?? []).filter((j) => j.status === 'completed').length

  return {
    data: {
      mission_count: missions.count ?? 0,
      asset_count: assets.count ?? 0,
      pending_approval_count: approvals.count ?? 0,
      active_connector_count: connectors.count ?? 0,
      total_jobs: jobs.count ?? 0,
      completed_jobs: completedJobs,
    },
    error: null,
  }
}

/**
 * Returns a consolidated data bundle for the Command Center dashboard page.
 * Fetches the workspace, stats, and a few spotlight counts in one call.
 */
export async function getDashboardData(
  client: TypedClient,
  userId: string,
): Promise<{ data: DashboardData | null; error: string | null }> {
  const { data: workspace, error: workspaceError } = await getWorkspace(client, userId)

  if (workspaceError || !workspace) {
    return { data: null, error: workspaceError ?? 'Workspace not found' }
  }

  const { data: stats, error: statsError } = await getWorkspaceStats(client, workspace.id)

  if (statsError || !stats) {
    return { data: null, error: statsError ?? 'Failed to load stats' }
  }

  // Recent missions: count missions created in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()
  const { count: recentMissionCount, error: recentError } = await client
    .from('missions')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .gte('created_at', oneDayAgo)

  if (recentError) {
    return { data: null, error: recentError.message }
  }

  return {
    data: {
      workspace,
      stats,
      recent_mission_count: recentMissionCount ?? 0,
      pending_approval_count: stats.pending_approval_count,
    },
    error: null,
  }
}
