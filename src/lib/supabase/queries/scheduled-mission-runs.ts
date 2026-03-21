/**
 * Supabase query helpers for scheduled_mission_runs.
 *
 * scheduled_mission_runs is not yet in the generated Database type — uses the same
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
  ScheduledMissionRun,
  ScheduledMissionRunInput,
  ScheduledMissionRunUpdate,
} from '@/features/scheduler/types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Inserts a new run record and returns the created row.
 */
export async function createRun(
  client: TypedClient,
  input: ScheduledMissionRunInput,
): Promise<{ data: ScheduledMissionRun | null; error: string | null }> {
  try {
    const { data, error } = await (client as unknown as SupabaseClient)
      .from('scheduled_mission_runs')
      .insert({
        scheduled_mission_id: input.scheduled_mission_id,
        mission_id: input.mission_id ?? null,
        status: input.status ?? 'running',
        execution_mode: input.execution_mode,
        result_summary: input.result_summary ?? null,
        result_data: input.result_data ?? {},
        error_message: input.error_message ?? null,
        tokens_used: input.tokens_used ?? null,
        duration_ms: input.duration_ms ?? null,
        started_at: input.started_at ?? new Date().toISOString(),
        completed_at: input.completed_at ?? null,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: (error as { message: string }).message }
    }

    return { data: data as unknown as ScheduledMissionRun | null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Partially updates an existing run record by ID.
 * Typically used to record the final status, result, and timing after execution.
 */
export async function updateRun(
  client: TypedClient,
  id: string,
  updates: ScheduledMissionRunUpdate,
): Promise<{ data: ScheduledMissionRun | null; error: string | null }> {
  try {
    const { data, error } = await (client as unknown as SupabaseClient)
      .from('scheduled_mission_runs')
      .update({ ...updates })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { data: null, error: (error as { message: string }).message }
    }

    return { data: data as unknown as ScheduledMissionRun | null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Returns run history for a specific scheduled mission, newest first.
 */
export async function getRecentRuns(
  client: TypedClient,
  scheduledMissionId: string,
  limit = 20,
): Promise<{ data: ScheduledMissionRun[] | null; error: string | null }> {
  try {
    const { data, error } = await (client as unknown as SupabaseClient)
      .from('scheduled_mission_runs')
      .select('*')
      .eq('scheduled_mission_id', scheduledMissionId)
      .order('created_at', { ascending: false })
      .limit(Math.min(100, Math.max(1, limit)))

    if (error) {
      return { data: null, error: (error as { message: string }).message }
    }

    return { data: (data ?? []) as unknown as ScheduledMissionRun[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}
