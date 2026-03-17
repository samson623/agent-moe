/**
 * Browser task schedule query helpers.
 *
 * browser_task_schedules is not yet in the generated Database type — uses the same
 * `as unknown` cast pattern until types are regenerated after migration push.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'
import type { BrowserTaskSchedule, BrowserTaskScheduleInput, BrowserTask } from '@/features/browser-agent/types'

type TypedClient = SupabaseClient<Database>

export interface GetSchedulesOptions {
  is_active?: boolean
  limit?: number
  offset?: number
}

/**
 * Returns a paginated list of schedules for a workspace.
 */
export async function getSchedules(
  client: TypedClient,
  workspaceId: string,
  options: GetSchedulesOptions = {},
): Promise<{ data: BrowserTaskSchedule[] | null; error: string | null; total: number }> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 20))
  const offset = Math.max(0, options.offset ?? 0)

  let query = (client as unknown as SupabaseClient)
    .from('browser_task_schedules')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options.is_active !== undefined) {
    query = query.eq('is_active', options.is_active)
  }

  const { data, error, count } = await query

  if (error) {
    return { data: null, error: (error as { message: string }).message, total: 0 }
  }

  return {
    data: (data ?? []) as unknown as BrowserTaskSchedule[],
    error: null,
    total: count ?? 0,
  }
}

/**
 * Returns a single schedule by ID.
 */
export async function getSchedule(
  client: TypedClient,
  id: string,
): Promise<{ data: BrowserTaskSchedule | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_task_schedules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: data as unknown as BrowserTaskSchedule | null, error: null }
}

/**
 * Creates a new schedule.
 */
export async function createSchedule(
  client: TypedClient,
  input: BrowserTaskScheduleInput,
): Promise<{ data: BrowserTaskSchedule | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_task_schedules')
    .insert({
      workspace_id: input.workspace_id,
      name: input.name,
      schedule_type: input.schedule_type,
      cron_expression: input.cron_expression ?? null,
      scheduled_at: input.scheduled_at ?? null,
      timezone: input.timezone ?? 'UTC',
      task_type: input.task_type,
      url: input.url,
      instructions: input.instructions,
      config: input.config ?? {},
      priority: input.priority ?? 5,
      max_retries: input.max_retries ?? 3,
      timeout_ms: input.timeout_ms ?? 30000,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: data as unknown as BrowserTaskSchedule | null, error: null }
}

/**
 * Partially updates a schedule.
 */
export async function updateSchedule(
  client: TypedClient,
  id: string,
  updates: Partial<BrowserTaskSchedule>,
): Promise<{ data: BrowserTaskSchedule | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_task_schedules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: data as unknown as BrowserTaskSchedule | null, error: null }
}

/**
 * Deletes a schedule.
 */
export async function deleteSchedule(
  client: TypedClient,
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await (client as unknown as SupabaseClient)
    .from('browser_task_schedules')
    .delete()
    .eq('id', id)

  return { error: error ? (error as { message: string }).message : null }
}

/**
 * Returns all active schedules across all workspaces (for scheduler bootstrap).
 */
export async function getActiveSchedules(
  client: TypedClient,
): Promise<{ data: BrowserTaskSchedule[] | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_task_schedules')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: (data ?? []) as unknown as BrowserTaskSchedule[], error: null }
}

/**
 * Returns past task instances spawned by a schedule.
 */
export async function getScheduleRuns(
  client: TypedClient,
  scheduleId: string,
  limit = 20,
): Promise<{ data: BrowserTask[] | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_tasks')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: (data ?? []) as unknown as BrowserTask[], error: null }
}
