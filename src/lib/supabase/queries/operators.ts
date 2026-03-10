import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import type { Job, ActivityLog, Asset, OperatorTeam, JobStatus } from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPERATOR_TEAMS: readonly OperatorTeam[] = [
  'content_strike',
  'growth_operator',
  'revenue_closer',
  'brand_guardian',
] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OperatorTeamStats {
  completed: number
  failed: number
  running: number
  pending: number
  cancelled: number
  total: number
}

export type OperatorStatsMap = Record<OperatorTeam, OperatorTeamStats>

function emptyStats(): OperatorTeamStats {
  return { completed: 0, failed: 0, running: 0, pending: 0, cancelled: 0, total: 0 }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns recent jobs for a specific operator team, ordered newest first.
 */
export async function getOperatorJobs(
  workspaceId: string,
  team: OperatorTeam,
  limit = 10,
): Promise<{ data: Job[]; error: string | null }> {
  const client = createAdminClient()
  const clampedLimit = Math.min(100, Math.max(1, limit))

  const { data, error } = await client
    .from('jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('operator_team', team)
    .order('created_at', { ascending: false })
    .limit(clampedLimit)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as Job[], error: null }
}

/**
 * Returns per-team stats (completed, failed, running, pending, cancelled, total)
 * for all four operator teams in a single round-trip.
 *
 * Fetches only the two columns needed and aggregates in JS because the Supabase
 * client doesn't expose raw SQL GROUP BY with FILTER.
 */
export async function getOperatorStats(
  workspaceId: string,
): Promise<{ data: OperatorStatsMap; error: string | null }> {
  const client = createAdminClient()

  const { data, error } = await client
    .from('jobs')
    .select('operator_team, status')
    .eq('workspace_id', workspaceId)

  const statsMap = Object.fromEntries(
    OPERATOR_TEAMS.map((t) => [t, emptyStats()]),
  ) as OperatorStatsMap

  if (error) {
    return { data: statsMap, error: error.message }
  }

  for (const row of data ?? []) {
    const team = row.operator_team as OperatorTeam
    const status = row.status as JobStatus
    if (!statsMap[team]) continue

    statsMap[team].total++

    switch (status) {
      case 'completed':
        statsMap[team].completed++
        break
      case 'failed':
        statsMap[team].failed++
        break
      case 'running':
        statsMap[team].running++
        break
      case 'pending':
        statsMap[team].pending++
        break
      case 'cancelled':
        statsMap[team].cancelled++
        break
    }
  }

  return { data: statsMap, error: null }
}

/**
 * Returns recent activity log entries produced by operator teams.
 * Filters to entries where `actor_type` matches one of the four team names.
 */
export async function getOperatorActivity(
  workspaceId: string,
  limit = 20,
): Promise<{ data: ActivityLog[]; error: string | null }> {
  const client = createAdminClient()
  const clampedLimit = Math.min(200, Math.max(1, limit))

  const { data, error } = await client
    .from('activity_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('actor_type', [...OPERATOR_TEAMS])
    .order('created_at', { ascending: false })
    .limit(clampedLimit)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as ActivityLog[], error: null }
}

/**
 * Returns recent assets produced by a specific operator team, newest first.
 */
export async function getOperatorAssets(
  workspaceId: string,
  team: OperatorTeam,
  limit = 5,
): Promise<{ data: Asset[]; error: string | null }> {
  const client = createAdminClient()
  const clampedLimit = Math.min(50, Math.max(1, limit))

  const { data, error } = await client
    .from('assets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('operator_team', team)
    .order('created_at', { ascending: false })
    .limit(clampedLimit)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as Asset[], error: null }
}
