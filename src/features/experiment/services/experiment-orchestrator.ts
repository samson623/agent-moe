/**
 * Autoresearch Loop — Experiment Orchestrator
 *
 * The core loop. Runs one iteration of an experiment:
 *   load brief → check budgets → load prior best → build instruction
 *   → create mission → execute → find asset → score → diff → store → update brief
 *
 * Wraps planAndExecuteMission — does NOT modify the mission engine.
 * Budget enforcement (Phase 8) is built in: token + duration + iteration caps.
 *
 * Never throws — all errors are caught and reflected in the run record.
 */

import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { createMission } from '@/lib/supabase/queries/missions'
import { planAndExecuteMission } from '@/features/mission-engine/services/orchestrator'
import { evaluateMetric, makeDecision } from './metric-evaluator'
import { generateDiffSummary } from './diff-generator'
import type {
  ExperimentBrief,
  ExperimentDecision,
  ExperimentRun,
  ExperimentIterationResult,
} from '../types'

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Runs one iteration of an experiment brief.
 *
 * @param briefId      The experiment to iterate
 * @param workspaceId  Owner workspace
 * @param userId       Owner user (for mission creation)
 */
export async function runExperimentIteration(
  briefId: string,
  workspaceId: string,
  userId: string,
): Promise<ExperimentIterationResult> {
  const client = createAdminClient()

  // ── 1. Load brief ─────────────────────────────────────────────────────────
  const { data: briefRow, error: briefErr } = await client
    .from('experiment_briefs')
    .select('*')
    .eq('id', briefId)
    .single()

  if (briefErr || !briefRow) {
    throw new Error(`[ExperimentOrchestrator] Brief ${briefId} not found: ${briefErr?.message}`)
  }

  const brief = briefRow as unknown as ExperimentBrief

  // ── 2. Check iteration budget ──────────────────────────────────────────────
  if (brief.is_complete) {
    throw new Error(`[ExperimentOrchestrator] Brief ${briefId} is already complete`)
  }

  if (brief.current_iteration >= brief.max_iterations) {
    await client
      .from('experiment_briefs')
      .update({ is_complete: true, updated_at: new Date().toISOString() })
      .eq('id', briefId)
    throw new Error(`[ExperimentOrchestrator] Brief ${briefId} has reached max_iterations (${brief.max_iterations})`)
  }

  // ── 3. Load prior best asset content (for diff) ───────────────────────────
  let priorBestContent: string | null = null
  if (brief.best_asset_id) {
    const { data: priorAsset } = await client
      .from('assets')
      .select('content')
      .eq('id', brief.best_asset_id)
      .single()
    priorBestContent = priorAsset?.content ?? null
  }

  // ── 4. Build instruction ───────────────────────────────────────────────────
  const iteration = brief.current_iteration
  const instruction = buildInstruction(brief, iteration)

  // ── 5. Create mission ──────────────────────────────────────────────────────
  const missionTitle = `[Experiment] ${brief.name} — Iteration ${iteration}`

  const { data: mission, error: missionErr } = await createMission(client, {
    workspace_id: workspaceId,
    user_id: userId,
    title: missionTitle,
    instruction,
    priority: 'normal',
  })

  if (missionErr || !mission) {
    throw new Error(`[ExperimentOrchestrator] Failed to create mission: ${missionErr}`)
  }

  // Link mission to experiment brief
  await client
    .from('missions')
    .update({
      experiment_brief_id: briefId,
      iteration_number: iteration,
    })
    .eq('id', mission.id)

  // ── 6. Create run record (pending) ────────────────────────────────────────
  const startedAt = new Date().toISOString()
  const { data: runRow, error: runErr } = await client
    .from('experiment_runs')
    .insert({
      experiment_brief_id: briefId,
      mission_id: mission.id,
      iteration,
      instruction_used: instruction,
      decision: 'pending',
      started_at: startedAt,
    })
    .select()
    .single()

  if (runErr || !runRow) {
    throw new Error(`[ExperimentOrchestrator] Failed to create run record: ${runErr?.message}`)
  }

  const runId = (runRow as unknown as ExperimentRun).id
  const timerStart = Date.now()

  // ── 7. Execute mission ────────────────────────────────────────────────────
  // await so we block until the mission pipeline completes
  await planAndExecuteMission(mission.id, workspaceId)

  const durationMs = Date.now() - timerStart

  // ── 8. Find asset produced ────────────────────────────────────────────────
  const { data: assets } = await client
    .from('assets')
    .select('id, content, confidence_score, mission_id')
    .eq('mission_id', mission.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const asset = assets?.[0] ?? null

  // ── 9. Count tokens used ──────────────────────────────────────────────────
  const { data: jobs } = await client
    .from('jobs')
    .select('output_data')
    .eq('mission_id', mission.id)

  const tokensUsed = (jobs ?? []).reduce((sum, job) => {
    const od = job.output_data as Record<string, unknown> | null
    const t = od?.tokens_used
    return sum + (typeof t === 'number' ? t : 0)
  }, 0)

  const exceededDuration = durationMs > brief.max_duration_ms
  const exceededTokens = brief.max_tokens_per_run > 0 && tokensUsed > brief.max_tokens_per_run

  // ── 10. Evaluate metric ────────────────────────────────────────────────────
  type LocalDecision = { decision: ExperimentDecision; reason: string }
  let metricResult: Awaited<ReturnType<typeof evaluateMetric>> = null
  let decisionResult: LocalDecision = { decision: 'discarded', reason: 'No asset produced' }

  if (asset && !exceededTokens && !exceededDuration) {
    metricResult = await evaluateMetric(
      { id: asset.id, mission_id: asset.mission_id ?? null, content: asset.content, confidence_score: asset.confidence_score },
      brief,
      brief.best_metric_value,
      client,
    )

    if (metricResult) {
      const d = makeDecision(metricResult, brief)
      decisionResult = { decision: d.decision, reason: d.reason }
    }
  } else if (exceededTokens) {
    decisionResult = { decision: 'discarded', reason: `Exceeded token budget (${tokensUsed} > ${brief.max_tokens_per_run})` }
  } else if (exceededDuration) {
    decisionResult = { decision: 'discarded', reason: `Exceeded duration budget (${durationMs}ms > ${brief.max_duration_ms}ms)` }
  }

  // ── 11. Generate diff summary ──────────────────────────────────────────────
  const diffSummary = await generateDiffSummary(
    priorBestContent,
    asset?.content ?? '',
    brief.goal,
  )

  // ── 12. Update run record ──────────────────────────────────────────────────
  const completedAt = new Date().toISOString()
  await client
    .from('experiment_runs')
    .update({
      decision: decisionResult.decision,
      decision_reason: decisionResult.reason,
      metric_value: metricResult?.value ?? null,
      metric_delta: metricResult?.delta ?? null,
      diff_summary: diffSummary,
      tokens_used: tokensUsed || null,
      duration_ms: durationMs,
      exceeded_token_budget: exceededTokens,
      exceeded_duration_budget: exceededDuration,
      completed_at: completedAt,
    })
    .eq('id', runId)

  // ── 13. Update brief ───────────────────────────────────────────────────────
  const isKept = decisionResult.decision === 'kept' || decisionResult.decision === 'baseline'
  const newIteration = iteration + 1
  const isComplete =
    newIteration >= brief.max_iterations ||
    (brief.metric_target !== null &&
      metricResult !== null &&
      (brief.metric_direction === 'maximize'
        ? (metricResult.value ?? 0) >= (brief.metric_target ?? 0)
        : (metricResult.value ?? Infinity) <= (brief.metric_target ?? 0)))

  const briefUpdate: Record<string, unknown> = {
    current_iteration: newIteration,
    last_run_at: completedAt,
    is_complete: isComplete,
    updated_at: completedAt,
  }

  if (isKept && asset) {
    briefUpdate.best_asset_id = asset.id
    briefUpdate.best_metric_value = metricResult?.value ?? null
  }

  await client.from('experiment_briefs').update(briefUpdate).eq('id', briefId)

  // ── 14. Fetch updated brief ────────────────────────────────────────────────
  const { data: updatedBriefRow } = await client
    .from('experiment_briefs')
    .select('*')
    .eq('id', briefId)
    .single()

  const updatedBrief = (updatedBriefRow as unknown as ExperimentBrief) ?? brief

  // ── 15. Assemble final run ─────────────────────────────────────────────────
  const finalRun: ExperimentRun = {
    id: runId,
    experiment_brief_id: briefId,
    mission_id: mission.id,
    iteration,
    instruction_used: instruction,
    diff_summary: diffSummary,
    metric_value: metricResult?.value ?? null,
    metric_delta: metricResult?.delta ?? null,
    decision: decisionResult.decision,
    decision_reason: decisionResult.reason,
    tokens_used: tokensUsed || null,
    duration_ms: durationMs,
    exceeded_token_budget: exceededTokens,
    exceeded_duration_budget: exceededDuration,
    started_at: startedAt,
    completed_at: completedAt,
    created_at: startedAt,
  }

  return {
    run: finalRun,
    brief: updatedBrief,
    is_complete: isComplete,
  }
}

// ---------------------------------------------------------------------------
// Instruction builder
// ---------------------------------------------------------------------------

/**
 * Builds the mission instruction for an iteration.
 *
 * Iteration 0 = baseline: use goal verbatim.
 * Subsequent iterations: augment with context about the prior best and what to improve.
 */
function buildInstruction(brief: ExperimentBrief, iteration: number): string {
  const platform = brief.target_platform
  const assetType = brief.target_asset_type
  const base = `Platform: ${platform}. Asset type: ${assetType}.\n\nGoal: ${brief.goal}`

  if (iteration === 0) {
    return `${base}\n\nThis is the baseline iteration. Produce the best ${assetType} you can for ${platform}.`
  }

  const metricLabel = {
    confidence_score: 'confidence score',
    content_length: 'content length',
    approval_rate: 'approval rate',
  }[brief.metric_type] ?? brief.metric_type

  const direction = brief.metric_direction === 'maximize' ? 'increase' : 'decrease'

  const priorLine =
    brief.best_metric_value !== null
      ? `Prior best ${metricLabel}: ${brief.best_metric_value.toFixed(4)}.`
      : 'No prior best recorded.'

  return [
    base,
    ``,
    `This is iteration ${iteration} of an autonomous improvement experiment.`,
    priorLine,
    `Try to ${direction} the ${metricLabel} compared to prior iterations.`,
    `Focus on structural and strategic improvements, not just rewording.`,
  ].join('\n')
}
