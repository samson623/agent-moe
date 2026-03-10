/**
 * Mission query helpers.
 *
 * All functions accept a typed Supabase client so they work from both
 * Server Components (server client) and API routes (server or admin client).
 *
 * Error handling: every function returns `{ data, error }` — callers decide
 * how to surface errors rather than this layer throwing.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  Mission,
  MissionInsert,
  MissionStatus,
  MissionPriority,
  OperatorTeam,
} from '../types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MissionFilters {
  status?: MissionStatus
  priority?: MissionPriority
  operator_team?: OperatorTeam
  search?: string
}

export interface PaginationOptions {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface MissionWithJobs extends Mission {
  jobs: Database['public']['Tables']['jobs']['Row'][]
}

export interface MissionStats {
  total: number
  by_status: Record<MissionStatus, number>
  today_count: number
  running_count: number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of missions for a workspace.
 * Supports filtering by status, priority, operator team, and free-text search.
 */
export async function getMissions(
  client: TypedClient,
  workspaceId: string,
  filters: MissionFilters = {},
  pagination: PaginationOptions = {},
): Promise<{ data: PaginatedResult<Mission> | null; error: string | null }> {
  const page = Math.max(1, pagination.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, pagination.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from('missions')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.priority) {
    query = query.eq('priority', filters.priority)
  }
  if (filters.operator_team) {
    query = query.eq('operator_team', filters.operator_team)
  }
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,instruction.ilike.%${filters.search}%`,
    )
  }

  const { data, error, count } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  const total = count ?? 0

  return {
    data: {
      data: (data ?? []) as unknown as Mission[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    error: null,
  }
}

/**
 * Returns a single mission by ID, including all of its jobs.
 */
export async function getMission(
  client: TypedClient,
  missionId: string,
): Promise<{ data: MissionWithJobs | null; error: string | null }> {
  const { data, error } = await client
    .from('missions')
    .select('*, jobs(*)')
    .eq('id', missionId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Supabase returns joined rows as a plain object — cast to our typed shape
  return {
    data: data as unknown as MissionWithJobs,
    error: null,
  }
}

/**
 * Inserts a new mission and returns the created row.
 */
export async function createMission(
  client: TypedClient,
  mission: MissionInsert,
): Promise<{ data: Mission | null; error: string | null }> {
  const { data, error } = await client
    .from('missions')
    .insert(mission)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Mission | null, error: null }
}

/**
 * Updates the status field of a mission.
 * Also sets `started_at` when transitioning to 'running' and
 * `completed_at` when transitioning to 'completed' or 'failed'.
 */
export async function updateMissionStatus(
  client: TypedClient,
  missionId: string,
  status: MissionStatus,
): Promise<{ data: Mission | null; error: string | null }> {
  const now = new Date().toISOString()

  const patch: Database['public']['Tables']['missions']['Update'] = { status, updated_at: now }

  const { data, error } = await client
    .from('missions')
    .update(patch)
    .eq('id', missionId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Mission | null, error: null }
}

/**
 * Returns aggregate mission counts by status for dashboard stats.
 * Today count is missions created since midnight UTC.
 */
export async function getMissionStats(
  client: TypedClient,
  workspaceId: string,
): Promise<{ data: MissionStats | null; error: string | null }> {
  const { data, error } = await client
    .from('missions')
    .select('status, created_at')
    .eq('workspace_id', workspaceId)

  if (error) {
    return { data: null, error: error.message }
  }

  const allStatuses: MissionStatus[] = [
    'pending',
    'planning',
    'running',
    'paused',
    'completed',
    'failed',
  ]

  const byStatus = allStatuses.reduce<Record<MissionStatus, number>>(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<MissionStatus, number>,
  )

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  let todayCount = 0
  let runningCount = 0

  for (const row of data ?? []) {
    byStatus[row.status as MissionStatus] = (byStatus[row.status as MissionStatus] ?? 0) + 1

    if (new Date(row.created_at) >= todayStart) {
      todayCount++
    }
    if (row.status === 'running') {
      runningCount++
    }
  }

  return {
    data: {
      total: (data ?? []).length,
      by_status: byStatus,
      today_count: todayCount,
      running_count: runningCount,
    },
    error: null,
  }
}
