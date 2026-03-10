/**
 * Analytics query helpers.
 *
 * Aggregates data from missions, assets, jobs, approvals, and publishing_logs
 * to produce the performance stat shapes consumed by the analytics API routes.
 *
 * All functions accept a typed Supabase client and return `{ data, error }`.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, OperatorTeam } from '../types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Time-range helper
// ---------------------------------------------------------------------------

export type TimeRange = '7d' | '30d' | '90d' | 'all'

function sinceDate(range: TimeRange): string | null {
  if (range === 'all') return null
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface SystemStats {
  missions_total: number
  missions_completed: number
  missions_failed: number
  missions_running: number
  assets_total: number
  assets_published: number
  assets_draft: number
  assets_review: number
  approval_rate: number
  publish_success_rate: number
  jobs_total: number
  jobs_failed: number
}

export interface MissionPerformance {
  total: number
  completed: number
  failed: number
  running: number
  pending: number
  completion_rate: number
  by_operator: Record<OperatorTeam, number>
  avg_jobs_per_mission: number
}

export interface ContentPerformance {
  total_assets: number
  published: number
  in_review: number
  draft: number
  rejected: number
  publish_rate: number
  by_type: Record<string, number>
  by_platform: Record<string, number>
  avg_confidence: number
}

export interface OperatorStats {
  by_team: Record<
    OperatorTeam,
    {
      missions: number
      jobs: number
      assets: number
      success_rate: number
    }
  >
  top_team: OperatorTeam | null
}

export interface PublishingStats {
  total_attempts: number
  successful: number
  failed: number
  pending: number
  success_rate: number
  by_platform: Record<string, number>
}

export interface AnalyticsEvent {
  id: number
  workspace_id: string
  event_type: string
  entity_type: string
  entity_id: string
  properties: Database['public']['Tables']['analytics_events']['Row']['properties']
  occurred_at: string
  created_at: string
}

// ---------------------------------------------------------------------------
// getSystemStats
// ---------------------------------------------------------------------------

export async function getSystemStats(
  client: TypedClient,
  workspaceId: string,
  timeRange: TimeRange = '30d',
): Promise<{ data: SystemStats | null; error: string | null }> {
  try {
    const since = sinceDate(timeRange)

    // Missions
    let missionsQ = client
      .from('missions')
      .select('status')
      .eq('workspace_id', workspaceId)
    if (since) missionsQ = missionsQ.gte('created_at', since)
    const { data: missions, error: mErr } = await missionsQ
    if (mErr) return { data: null, error: mErr.message }

    const missionsData = missions ?? []
    const missions_total = missionsData.length
    const missions_completed = missionsData.filter((m) => m.status === 'completed').length
    const missions_failed = missionsData.filter((m) => m.status === 'failed').length
    const missions_running = missionsData.filter((m) => m.status === 'running').length

    // Assets
    let assetsQ = client
      .from('assets')
      .select('status')
      .eq('workspace_id', workspaceId)
    if (since) assetsQ = assetsQ.gte('created_at', since)
    const { data: assets, error: aErr } = await assetsQ
    if (aErr) return { data: null, error: aErr.message }

    const assetsData = assets ?? []
    const assets_total = assetsData.length
    const assets_published = assetsData.filter((a) => a.status === 'published').length
    const assets_draft = assetsData.filter((a) => a.status === 'draft').length
    const assets_review = assetsData.filter((a) => a.status === 'review').length

    // Approvals
    let approvalsQ = client
      .from('approvals')
      .select('status')
      .eq('workspace_id', workspaceId)
    if (since) approvalsQ = approvalsQ.gte('created_at', since)
    const { data: approvals, error: apErr } = await approvalsQ
    if (apErr) return { data: null, error: apErr.message }

    const approvalsData = approvals ?? []
    const total_reviews = approvalsData.length
    const approved_count = approvalsData.filter((a) => a.status === 'approved').length
    const approval_rate =
      total_reviews > 0 ? Math.round((approved_count / total_reviews) * 100) : 0

    // Publishing logs
    let pubQ = client
      .from('publishing_logs')
      .select('status')
      .eq('workspace_id', workspaceId)
    if (since) pubQ = pubQ.gte('created_at', since)
    const { data: pubLogs, error: pubErr } = await pubQ
    if (pubErr) return { data: null, error: pubErr.message }

    const pubData = pubLogs ?? []
    const total_pub = pubData.length
    const pub_success = pubData.filter((p) => p.status === 'success').length
    const publish_success_rate =
      total_pub > 0 ? Math.round((pub_success / total_pub) * 100) : 0

    // Jobs
    let jobsQ = client
      .from('jobs')
      .select('status')
      .eq('workspace_id', workspaceId)
    if (since) jobsQ = jobsQ.gte('created_at', since)
    const { data: jobs, error: jErr } = await jobsQ
    if (jErr) return { data: null, error: jErr.message }

    const jobsData = jobs ?? []
    const jobs_total = jobsData.length
    const jobs_failed = jobsData.filter((j) => j.status === 'failed').length

    return {
      data: {
        missions_total,
        missions_completed,
        missions_failed,
        missions_running,
        assets_total,
        assets_published,
        assets_draft,
        assets_review,
        approval_rate,
        publish_success_rate,
        jobs_total,
        jobs_failed,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error in getSystemStats',
    }
  }
}

// ---------------------------------------------------------------------------
// getMissionPerformance
// ---------------------------------------------------------------------------

export async function getMissionPerformance(
  client: TypedClient,
  workspaceId: string,
  timeRange: TimeRange = '30d',
): Promise<{ data: MissionPerformance | null; error: string | null }> {
  try {
    const since = sinceDate(timeRange)

    let missionsQ = client
      .from('missions')
      .select('id, status')
      .eq('workspace_id', workspaceId)
    if (since) missionsQ = missionsQ.gte('created_at', since)
    const { data: missions, error: mErr } = await missionsQ
    if (mErr) return { data: null, error: mErr.message }

    const mData = missions ?? []
    const total = mData.length
    const completed = mData.filter((m) => m.status === 'completed').length
    const failed = mData.filter((m) => m.status === 'failed').length
    const running = mData.filter((m) => m.status === 'running').length
    const pending = mData.filter(
      (m) => m.status === 'pending' || m.status === 'planning',
    ).length
    const completion_rate =
      total > 0 ? Math.round((completed / total) * 100) : 0

    // Jobs for these missions (to get by-operator breakdown and avg jobs)
    let jobsQ = client
      .from('jobs')
      .select('mission_id, operator_team, status')
      .eq('workspace_id', workspaceId)
    if (since) jobsQ = jobsQ.gte('created_at', since)
    const { data: jobs, error: jErr } = await jobsQ
    if (jErr) return { data: null, error: jErr.message }

    const jobsData = jobs ?? []

    const allTeams: OperatorTeam[] = [
      'content_strike',
      'growth_operator',
      'revenue_closer',
      'brand_guardian',
      'browser_agent',
    ]

    const by_operator = allTeams.reduce<Record<OperatorTeam, number>>(
      (acc, t) => ({ ...acc, [t]: 0 }),
      {} as Record<OperatorTeam, number>,
    )

    for (const job of jobsData) {
      const team = job.operator_team as OperatorTeam
      if (team in by_operator) {
        by_operator[team] = (by_operator[team] ?? 0) + 1
      }
    }

    const missionSet = new Set(mData.map((m) => m.id))
    const relevantJobs = jobsData.filter((j) => missionSet.has(j.mission_id))
    const avg_jobs_per_mission =
      total > 0 ? Math.round((relevantJobs.length / total) * 10) / 10 : 0

    return {
      data: {
        total,
        completed,
        failed,
        running,
        pending,
        completion_rate,
        by_operator,
        avg_jobs_per_mission,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : 'Unknown error in getMissionPerformance',
    }
  }
}

// ---------------------------------------------------------------------------
// getContentPerformance
// ---------------------------------------------------------------------------

export async function getContentPerformance(
  client: TypedClient,
  workspaceId: string,
  timeRange: TimeRange = '30d',
): Promise<{ data: ContentPerformance | null; error: string | null }> {
  try {
    const since = sinceDate(timeRange)

    let assetsQ = client
      .from('assets')
      .select('status, asset_type, platform, confidence_score')
      .eq('workspace_id', workspaceId)
    if (since) assetsQ = assetsQ.gte('created_at', since)
    const { data: assets, error: aErr } = await assetsQ
    if (aErr) return { data: null, error: aErr.message }

    const aData = assets ?? []
    const total_assets = aData.length
    const published = aData.filter((a) => a.status === 'published').length
    const in_review = aData.filter((a) => a.status === 'review').length
    const draft = aData.filter((a) => a.status === 'draft').length
    const rejected = aData.filter((a) => a.status === 'rejected').length
    const publish_rate =
      total_assets > 0 ? Math.round((published / total_assets) * 100) : 0

    const by_type: Record<string, number> = {}
    const by_platform: Record<string, number> = {}
    let confidence_sum = 0

    for (const a of aData) {
      by_type[a.asset_type] = (by_type[a.asset_type] ?? 0) + 1
      by_platform[a.platform] = (by_platform[a.platform] ?? 0) + 1
      confidence_sum += a.confidence_score ?? 0
    }

    const avg_confidence =
      total_assets > 0
        ? Math.round((confidence_sum / total_assets) * 10) / 10
        : 0

    return {
      data: {
        total_assets,
        published,
        in_review,
        draft,
        rejected,
        publish_rate,
        by_type,
        by_platform,
        avg_confidence,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : 'Unknown error in getContentPerformance',
    }
  }
}

// ---------------------------------------------------------------------------
// getOperatorStats
// ---------------------------------------------------------------------------

export async function getOperatorStats(
  client: TypedClient,
  workspaceId: string,
  timeRange: TimeRange = '30d',
): Promise<{ data: OperatorStats | null; error: string | null }> {
  try {
    const since = sinceDate(timeRange)

    const allTeams: OperatorTeam[] = [
      'content_strike',
      'growth_operator',
      'revenue_closer',
      'brand_guardian',
      'browser_agent',
    ]

    type TeamStat = { missions: number; jobs: number; assets: number; success_rate: number }
    const by_team = allTeams.reduce<Record<OperatorTeam, TeamStat>>(
      (acc, t) => ({
        ...acc,
        [t]: { missions: 0, jobs: 0, assets: 0, success_rate: 0 },
      }),
      {} as Record<OperatorTeam, TeamStat>,
    )

    // Missions by operator (via jobs — missions don't have operator_team directly)
    let jobsQ = client
      .from('jobs')
      .select('operator_team, status, mission_id')
      .eq('workspace_id', workspaceId)
    if (since) jobsQ = jobsQ.gte('created_at', since)
    const { data: jobs, error: jErr } = await jobsQ
    if (jErr) return { data: null, error: jErr.message }

    const jobsData = jobs ?? []

    // Track unique missions per team
    const teamMissions: Record<OperatorTeam, Set<string>> = allTeams.reduce(
      (acc, t) => ({ ...acc, [t]: new Set<string>() }),
      {} as Record<OperatorTeam, Set<string>>,
    )

    const teamSuccessJobs: Record<OperatorTeam, number> = allTeams.reduce(
      (acc, t) => ({ ...acc, [t]: 0 }),
      {} as Record<OperatorTeam, number>,
    )

    for (const job of jobsData) {
      const team = job.operator_team as OperatorTeam
      if (!(team in by_team)) continue
      by_team[team].jobs += 1
      teamMissions[team].add(job.mission_id)
      if (job.status === 'completed') {
        teamSuccessJobs[team] = (teamSuccessJobs[team] ?? 0) + 1
      }
    }

    for (const team of allTeams) {
      by_team[team].missions = teamMissions[team].size
      by_team[team].success_rate =
        by_team[team].jobs > 0
          ? Math.round((teamSuccessJobs[team] / by_team[team].jobs) * 100)
          : 0
    }

    // Assets by operator_team
    let assetsQ = client
      .from('assets')
      .select('operator_team')
      .eq('workspace_id', workspaceId)
    if (since) assetsQ = assetsQ.gte('created_at', since)
    const { data: assets, error: aErr } = await assetsQ
    if (aErr) return { data: null, error: aErr.message }

    for (const a of assets ?? []) {
      const team = a.operator_team as OperatorTeam
      if (team in by_team) {
        by_team[team].assets += 1
      }
    }

    // Top team by missions
    let top_team: OperatorTeam | null = null
    let topCount = 0
    for (const team of allTeams) {
      if (by_team[team].missions > topCount) {
        topCount = by_team[team].missions
        top_team = team
      }
    }

    return { data: { by_team, top_team }, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error in getOperatorStats',
    }
  }
}

// ---------------------------------------------------------------------------
// getPublishingStats
// ---------------------------------------------------------------------------

export async function getPublishingStats(
  client: TypedClient,
  workspaceId: string,
  timeRange: TimeRange = '30d',
): Promise<{ data: PublishingStats | null; error: string | null }> {
  try {
    const since = sinceDate(timeRange)

    let pubQ = client
      .from('publishing_logs')
      .select('status, platform')
      .eq('workspace_id', workspaceId)
    if (since) pubQ = pubQ.gte('created_at', since)
    const { data: logs, error: pErr } = await pubQ
    if (pErr) return { data: null, error: pErr.message }

    const logData = logs ?? []
    const total_attempts = logData.length
    const successful = logData.filter((l) => l.status === 'success').length
    const failed = logData.filter((l) => l.status === 'failed').length
    const pending = logData.filter((l) => l.status === 'pending').length
    const success_rate =
      total_attempts > 0 ? Math.round((successful / total_attempts) * 100) : 0

    const by_platform: Record<string, number> = {}
    for (const l of logData) {
      by_platform[l.platform] = (by_platform[l.platform] ?? 0) + 1
    }

    return {
      data: {
        total_attempts,
        successful,
        failed,
        pending,
        success_rate,
        by_platform,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : 'Unknown error in getPublishingStats',
    }
  }
}

// ---------------------------------------------------------------------------
// listAnalyticsEvents
// ---------------------------------------------------------------------------

export interface EventFilters {
  event_type?: string
  entity_type?: string
  time_range?: TimeRange
  limit?: number
  offset?: number
}

export async function listAnalyticsEvents(
  client: TypedClient,
  workspaceId: string,
  filters: EventFilters = {},
): Promise<{ data: AnalyticsEvent[] | null; total: number; error: string | null }> {
  try {
    const limit = Math.min(200, Math.max(1, filters.limit ?? 50))
    const offset = Math.max(0, filters.offset ?? 0)
    const since = filters.time_range ? sinceDate(filters.time_range) : null

    let query = client
      .from('analytics_events')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filters.event_type) query = query.eq('event_type', filters.event_type)
    if (filters.entity_type) query = query.eq('entity_type', filters.entity_type)
    if (since) query = query.gte('occurred_at', since)

    const { data, error, count } = await query
    if (error) return { data: null, total: 0, error: error.message }

    return {
      data: (data ?? []) as AnalyticsEvent[],
      total: count ?? 0,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      total: 0,
      error:
        err instanceof Error ? err.message : 'Unknown error in listAnalyticsEvents',
    }
  }
}
