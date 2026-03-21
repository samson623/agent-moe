/**
 * Supabase query helpers for scheduled_missions.
 *
 * scheduled_missions is not yet in the generated Database type — uses the same
 * `as unknown` cast pattern until types are regenerated after migration push.
 *
 * All helpers accept a typed SupabaseClient as their first argument so they
 * can be called from Server Components, API routes, or Server Actions without
 * creating a new client internally. They never throw — every function returns
 * { data, error } so callers can handle failures gracefully.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'
import type {
  ScheduledMission,
  ScheduledMissionInput,
  ScheduledMissionUpdate,
  ScheduledMissionStats,
  ScheduleType,
} from '@/features/scheduler/types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface GetScheduledMissionsOptions {
  is_active?: boolean
  schedule_type?: ScheduleType
  tags?: string[]
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of scheduled missions for a workspace.
 * Supports optional filters: is_active, schedule_type, tags (any-match).
 */
export async function getScheduledMissions(
  client: TypedClient,
  workspaceId: string,
  options: GetScheduledMissionsOptions = {},
): Promise<{ data: ScheduledMission[] | null; error: string | null; total: number }> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 20))
  const offset = Math.max(0, options.offset ?? 0)

  try {
    let query = (client as unknown as SupabaseClient)
      .from('scheduled_missions')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (options.is_active !== undefined) {
      query = query.eq('is_active', options.is_active)
    }

    if (options.schedule_type !== undefined) {
      query = query.eq('schedule_type', options.schedule_type)
    }

    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags)
    }

    const { data, error, count } = await query

    if (error) {
      return { data: null, error: (error as { message: string }).message, total: 0 }
    }

    return {
      data: (data ?? []) as unknown as ScheduledMission[],
      error: null,
      total: count ?? 0,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
      total: 0,
    }
  }
}

/**
 * Returns a single scheduled mission by ID.
 */
export async function getScheduledMission(
  client: TypedClient,
  id: string,
): Promise<{ data: ScheduledMission | null; error: string | null }> {
  try {
    const { data, error } = await (client as unknown as SupabaseClient)
      .from('scheduled_missions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return { data: null, error: null }
      }
      return { data: null, error: (error as { message: string }).message }
    }

    return { data: data as unknown as ScheduledMission | null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Creates a new scheduled mission for the given workspace.
 */
export async function createScheduledMission(
  client: TypedClient,
  workspaceId: string,
  input: ScheduledMissionInput,
): Promise<{ data: ScheduledMission | null; error: string | null }> {
  try {
    const { data, error } = await (client as unknown as SupabaseClient)
      .from('scheduled_missions')
      .insert({
        workspace_id: workspaceId,
        name: input.name,
        instruction: input.instruction,
        schedule_type: input.schedule_type,
        cron_expression: input.cron_expression ?? null,
        scheduled_at: input.scheduled_at ?? null,
        timezone: input.timezone ?? 'America/New_York',
        execution_mode: input.execution_mode ?? 'auto',
        permission_level: input.permission_level ?? 'autonomous',
        operator_team: input.operator_team ?? null,
        tags: input.tags ?? [],
        config: input.config ?? {},
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: (error as { message: string }).message }
    }

    return { data: data as unknown as ScheduledMission | null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Partially updates a scheduled mission by ID.
 */
export async function updateScheduledMission(
  client: TypedClient,
  id: string,
  updates: ScheduledMissionUpdate,
): Promise<{ data: ScheduledMission | null; error: string | null }> {
  try {
    const { data, error } = await (client as unknown as SupabaseClient)
      .from('scheduled_missions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { data: null, error: (error as { message: string }).message }
    }

    return { data: data as unknown as ScheduledMission | null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Deletes a scheduled mission by ID.
 */
export async function deleteScheduledMission(
  client: TypedClient,
  id: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await (client as unknown as SupabaseClient)
      .from('scheduled_missions')
      .delete()
      .eq('id', id)

    return { error: error ? (error as { message: string }).message : null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Returns all active scheduled missions across all workspaces.
 * Intended for use by the scheduler runner bootstrap — call with admin client.
 */
export async function getActiveScheduledMissions(
  client: TypedClient,
): Promise<{ data: ScheduledMission[] | null; error: string | null }> {
  try {
    const { data, error } = await (client as unknown as SupabaseClient)
      .from('scheduled_missions')
      .select('*')
      .eq('is_active', true)
      .order('next_run_at', { ascending: true })

    if (error) {
      return { data: null, error: (error as { message: string }).message }
    }

    return { data: (data ?? []) as unknown as ScheduledMission[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Returns all active scheduled missions whose next_run_at is at or before `now`.
 * This is the critical query used by the scheduler runner on each tick.
 * Call with admin client (no workspace filter needed).
 */
export async function getDueScheduledMissions(
  client: TypedClient,
  now: Date,
): Promise<{ data: ScheduledMission[] | null; error: string | null }> {
  try {
    const { data, error } = await (client as unknown as SupabaseClient)
      .from('scheduled_missions')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString())
      .order('next_run_at', { ascending: true })

    if (error) {
      return { data: null, error: (error as { message: string }).message }
    }

    return { data: (data ?? []) as unknown as ScheduledMission[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Compute summary stats for a workspace's scheduled missions.
 * Counts runs_today and failures_today from scheduled_mission_runs via a
 * single missions query + a single runs query, merged in JS.
 */
export async function getScheduledMissionStats(
  client: TypedClient,
  workspaceId: string,
): Promise<{ data: ScheduledMissionStats | null; error: string | null }> {
  try {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    // Fetch all missions for the workspace (status counts)
    const { data: missions, error: missionsError } = await (client as unknown as SupabaseClient)
      .from('scheduled_missions')
      .select('id, is_active')
      .eq('workspace_id', workspaceId)

    if (missionsError) {
      return { data: null, error: (missionsError as { message: string }).message }
    }

    const missionIds: string[] = (missions ?? []).map((m: { id: string }) => m.id)

    // Fetch today's runs for those missions
    let runs_today = 0
    let failures_today = 0

    if (missionIds.length > 0) {
      const { data: runs, error: runsError } = await (client as unknown as SupabaseClient)
        .from('scheduled_mission_runs')
        .select('status')
        .in('scheduled_mission_id', missionIds)
        .gte('created_at', todayStart.toISOString())

      if (runsError) {
        return { data: null, error: (runsError as { message: string }).message }
      }

      const runsArr = (runs ?? []) as Array<{ status: string }>
      runs_today = runsArr.length
      failures_today = runsArr.filter((r) => r.status === 'failed').length
    }

    const allMissions = (missions ?? []) as Array<{ is_active: boolean }>

    const stats: ScheduledMissionStats = {
      total: allMissions.length,
      active: allMissions.filter((m) => m.is_active).length,
      runs_today,
      failures_today,
    }

    return { data: stats, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}
