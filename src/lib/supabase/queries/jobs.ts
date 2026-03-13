/**
 * Job query helpers.
 *
 * All functions accept a typed Supabase client so they work from both
 * Server Components (server client) and API routes (server or admin client).
 *
 * Error handling: every function returns `{ data, error }` — callers decide
 * how to surface errors rather than this layer throwing.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Local type aliases
// ---------------------------------------------------------------------------

type Job = Database['public']['Tables']['jobs']['Row']
type JobInsert = Database['public']['Tables']['jobs']['Insert']
type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Exported filter / status / team types
// ---------------------------------------------------------------------------

export type DbJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type DbOperatorTeam =
  | 'content_strike'
  | 'growth_operator'
  | 'revenue_closer'
  | 'brand_guardian'

export interface JobFilters {
  mission_id?: string
  status?: DbJobStatus
  operator_team?: DbOperatorTeam
}

// ---------------------------------------------------------------------------
// Re-export PaginatedResult so callers don't need to import from missions
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationOptions {
  page?: number
  pageSize?: number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of jobs for a workspace.
 * Supports filtering by mission_id, status, and operator_team.
 * Ordered by created_at DESC.
 */
export async function getJobs(
  client: TypedClient,
  workspaceId: string,
  filters: JobFilters = {},
  pagination: PaginationOptions = {},
): Promise<{ data: PaginatedResult<Job> | null; error: string | null }> {
  const page = Math.max(1, pagination.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, pagination.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.mission_id) {
    query = query.eq('mission_id', filters.mission_id)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.operator_team) {
    query = query.eq('operator_team', filters.operator_team)
  }

  const { data, error, count } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  const total = count ?? 0

  return {
    data: {
      data: (data ?? []) as unknown as Job[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    error: null,
  }
}

/**
 * Returns a single job by ID.
 */
export async function getJob(
  client: TypedClient,
  jobId: string,
): Promise<{ data: Job | null; error: string | null }> {
  const { data, error } = await client
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    // PostgREST returns PGRST116 when no row is found — treat as null, not error
    if (error.code === 'PGRST116') {
      return { data: null, error: null }
    }
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Job, error: null }
}

/**
 * Returns ALL jobs for a mission, ordered by priority ASC then created_at ASC.
 * Used by the queue system to evaluate dependency graphs.
 */
export async function getJobsByMission(
  client: TypedClient,
  missionId: string,
): Promise<{ data: Job[]; error: string | null }> {
  const { data, error } = await client
    .from('jobs')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  // Sort in-memory: primary = (no explicit priority col, use created_at ordering from DB)
  // The DB schema doesn't have a priority column on jobs — ordering by created_at ASC is sufficient.
  return { data: (data ?? []) as unknown as Job[], error: null }
}

/**
 * Inserts a new job and returns the created row.
 */
export async function createJob(
  client: TypedClient,
  job: JobInsert,
): Promise<{ data: Job | null; error: string | null }> {
  const { data, error } = await client
    .from('jobs')
    .insert(job)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Job, error: null }
}

/**
 * Bulk-inserts multiple jobs and returns all created rows.
 * Uses a single DB round-trip for efficiency.
 */
export async function createJobsBatch(
  client: TypedClient,
  jobs: JobInsert[],
): Promise<{ data: Job[]; error: string | null }> {
  if (jobs.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await client.from('jobs').insert(jobs).select()

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as Job[], error: null }
}

// ---------------------------------------------------------------------------
// Status update extras
// ---------------------------------------------------------------------------

export interface UpdateJobStatusExtras {
  model_used?: 'claude' | 'gpt5_nano'
  output_data?: Json
  error_message?: string
}

/**
 * Updates the status of a job and applies lifecycle timestamps.
 *
 * Lifecycle rules:
 * - Transitioning to 'running'            → sets started_at
 * - Transitioning to 'completed'|'failed' → sets completed_at
 */
export async function updateJobStatus(
  client: TypedClient,
  jobId: string,
  status: DbJobStatus,
  extras: UpdateJobStatusExtras = {},
): Promise<{ data: Job | null; error: string | null }> {
  const now = new Date().toISOString()

  const patch: Database['public']['Tables']['jobs']['Update'] = {
    status,
    ...(extras.model_used !== undefined ? { model_used: extras.model_used } : {}),
    ...(extras.output_data !== undefined ? { output_data: extras.output_data } : {}),
    ...(extras.error_message !== undefined ? { error_message: extras.error_message } : {}),
  }

  if (status === 'running') {
    patch.started_at = now
  } else if (status === 'completed' || status === 'failed') {
    patch.completed_at = now
    // Duration is tracked in activity_logs, not on the job row itself
  }

  const { data, error } = await client
    .from('jobs')
    .update(patch)
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Job, error: null }
}

/**
 * Returns pending jobs whose every dependency is in the completed set.
 *
 * Algorithm (in-memory, suitable for 3–10 jobs per mission):
 * 1. Fetch all jobs for the mission.
 * 2. Collect IDs of completed jobs into a Set.
 * 3. Filter pending jobs where every ID in depends_on is in that Set.
 *
 * This avoids complex SQL and keeps the queue logic readable and testable.
 */
export async function getReadyJobs(
  client: TypedClient,
  missionId: string,
): Promise<{ data: Job[]; error: string | null }> {
  const { data: allJobs, error } = await getJobsByMission(client, missionId)

  if (error) {
    return { data: [], error }
  }

  const completedIds = new Set<string>(
    allJobs.filter((j) => j.status === 'completed').map((j) => j.id),
  )

  const ready = allJobs.filter((j) => {
    if (j.status !== 'pending') return false
    return j.depends_on.every((depId) => completedIds.has(depId))
  })

  return { data: ready, error: null }
}
