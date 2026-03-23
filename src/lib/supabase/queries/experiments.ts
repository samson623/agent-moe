/**
 * Experiment query helpers.
 *
 * All functions use the admin client (or a passed client) and return
 * { data, error } — callers decide how to surface errors.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExperimentBrief, ExperimentRun, CreateExperimentBriefInput, UpdateExperimentBriefInput } from '@/features/experiment/types'

type Client = SupabaseClient

// ---------------------------------------------------------------------------
// experiment_briefs
// ---------------------------------------------------------------------------

export async function getExperimentBriefs(
  client: Client,
  workspaceId: string,
): Promise<{ data: ExperimentBrief[]; error: string | null }> {
  const { data, error } = await client
    .from('experiment_briefs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as ExperimentBrief[], error: null }
}

export async function getExperimentBrief(
  client: Client,
  briefId: string,
): Promise<{ data: ExperimentBrief | null; error: string | null }> {
  const { data, error } = await client
    .from('experiment_briefs')
    .select('*')
    .eq('id', briefId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as unknown as ExperimentBrief, error: null }
}

export async function createExperimentBrief(
  client: Client,
  workspaceId: string,
  userId: string,
  input: CreateExperimentBriefInput,
): Promise<{ data: ExperimentBrief | null; error: string | null }> {
  const { data, error } = await client
    .from('experiment_briefs')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      name: input.name,
      goal: input.goal,
      operator_team: input.operator_team ?? 'content_strike',
      target_platform: input.target_platform ?? 'x',
      target_asset_type: input.target_asset_type ?? 'post',
      metric_type: input.metric_type ?? 'confidence_score',
      metric_direction: input.metric_direction ?? 'maximize',
      metric_target: input.metric_target ?? null,
      keep_threshold: input.keep_threshold ?? 0,
      max_tokens_per_run: input.max_tokens_per_run ?? 50000,
      max_duration_ms: input.max_duration_ms ?? 120000,
      max_iterations: input.max_iterations ?? 10,
      cron_expression: input.cron_expression ?? '0 6 * * *',
      timezone: input.timezone ?? 'America/New_York',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as unknown as ExperimentBrief, error: null }
}

export async function updateExperimentBrief(
  client: Client,
  briefId: string,
  input: UpdateExperimentBriefInput,
): Promise<{ data: ExperimentBrief | null; error: string | null }> {
  const { data, error } = await client
    .from('experiment_briefs')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', briefId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as unknown as ExperimentBrief, error: null }
}

export async function deleteExperimentBrief(
  client: Client,
  briefId: string,
): Promise<{ error: string | null }> {
  const { error } = await client.from('experiment_briefs').delete().eq('id', briefId)
  if (error) return { error: error.message }
  return { error: null }
}

// ---------------------------------------------------------------------------
// experiment_runs
// ---------------------------------------------------------------------------

export async function getExperimentRuns(
  client: Client,
  briefId: string,
): Promise<{ data: ExperimentRun[]; error: string | null }> {
  const { data, error } = await client
    .from('experiment_runs')
    .select('*')
    .eq('experiment_brief_id', briefId)
    .order('iteration', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as ExperimentRun[], error: null }
}

export async function createExperimentRun(
  client: Client,
  run: Partial<ExperimentRun> & { experiment_brief_id: string; iteration: number; instruction_used: string },
): Promise<{ data: ExperimentRun | null; error: string | null }> {
  const { data, error } = await client
    .from('experiment_runs')
    .insert(run)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as unknown as ExperimentRun, error: null }
}

export async function updateExperimentRun(
  client: Client,
  runId: string,
  update: Partial<ExperimentRun>,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('experiment_runs')
    .update(update)
    .eq('id', runId)

  if (error) return { error: error.message }
  return { error: null }
}
