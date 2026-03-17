/**
 * Browser task query helpers (Phase 8).
 *
 * browser_tasks is not yet in the generated Database type — uses the same
 * `as unknown as BrowserTask` cast pattern until types are regenerated
 * after migration push.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'
import type { BrowserTask, BrowserTaskInput, BrowserTaskStats } from '@/features/browser-agent/types'

type TypedClient = SupabaseClient<Database>

export interface GetBrowserTasksOptions {
  status?: string
  task_type?: string
  mission_id?: string
  limit?: number
  offset?: number
}

/**
 * Returns a paginated, filtered list of browser tasks for a workspace.
 * Default order: created_at DESC.
 */
export async function getBrowserTasks(
  client: TypedClient,
  workspaceId: string,
  options: GetBrowserTasksOptions = {},
): Promise<{ data: BrowserTask[] | null; error: string | null; total: number }> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 20))
  const offset = Math.max(0, options.offset ?? 0)

  let query = (client as unknown as SupabaseClient)
    .from('browser_tasks')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options.status) query = query.eq('status', options.status)
  if (options.task_type) query = query.eq('task_type', options.task_type)
  if (options.mission_id) query = query.eq('mission_id', options.mission_id)

  const { data, error, count } = await query

  if (error) {
    return { data: null, error: (error as { message: string }).message, total: 0 }
  }

  return {
    data: (data ?? []) as unknown as BrowserTask[],
    error: null,
    total: count ?? 0,
  }
}

/**
 * Returns a single browser task by ID.
 */
export async function getBrowserTask(
  client: TypedClient,
  id: string,
): Promise<{ data: BrowserTask | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: data as unknown as BrowserTask | null, error: null }
}

/**
 * Creates a new browser task.
 */
export async function createBrowserTask(
  client: TypedClient,
  input: BrowserTaskInput,
): Promise<{ data: BrowserTask | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_tasks')
    .insert({
      workspace_id: input.workspace_id,
      mission_id: input.mission_id ?? null,
      job_id: input.job_id ?? null,
      schedule_id: input.schedule_id ?? null,
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

  return { data: data as unknown as BrowserTask | null, error: null }
}

/**
 * Partially updates an existing browser task.
 */
export async function updateBrowserTask(
  client: TypedClient,
  id: string,
  updates: Partial<BrowserTask>,
): Promise<{ data: BrowserTask | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: data as unknown as BrowserTask | null, error: null }
}

/**
 * Deletes a browser task.
 */
export async function deleteBrowserTask(
  client: TypedClient,
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await (client as unknown as SupabaseClient)
    .from('browser_tasks')
    .delete()
    .eq('id', id)

  return { error: error ? (error as { message: string }).message : null }
}

/**
 * Returns pending tasks ordered by priority (highest first).
 */
export async function getPendingBrowserTasks(
  client: TypedClient,
  workspaceId: string,
  limit = 10,
): Promise<{ data: BrowserTask[] | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: (data ?? []) as unknown as BrowserTask[], error: null }
}

/**
 * Returns aggregate stats for a workspace's browser tasks.
 */
export async function getBrowserTaskStats(
  client: TypedClient,
  workspaceId: string,
): Promise<{ data: BrowserTaskStats | null; error: string | null }> {
  const { data, error } = await (client as unknown as SupabaseClient)
    .from('browser_tasks')
    .select('status, completed_at')
    .eq('workspace_id', workspaceId)

  if (error) {
    return { data: null, error: (error as { message: string }).message }
  }

  const rows = (data ?? []) as Array<{ status: string; completed_at: string | null }>

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats: BrowserTaskStats = {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    running: rows.filter((r) => r.status === 'running').length,
    completed: rows.filter((r) => r.status === 'completed').length,
    failed: rows.filter((r) => r.status === 'failed').length,
    cancelled: rows.filter((r) => r.status === 'cancelled').length,
    timeout: rows.filter((r) => r.status === 'timeout').length,
    completed_today: rows.filter((r) => {
      if (r.status !== 'completed' || !r.completed_at) return false
      return new Date(r.completed_at) >= today
    }).length,
  }

  return { data: stats, error: null }
}
