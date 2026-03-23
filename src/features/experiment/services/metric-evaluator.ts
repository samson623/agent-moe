/**
 * Autoresearch Loop — Metric Evaluator
 *
 * Scores a completed asset against an experiment brief's objective metric,
 * then decides whether the iteration should be kept or discarded.
 *
 * Fully deterministic — no AI calls. Pure TypeScript + optional Supabase query.
 *
 * Supported metric types:
 *   confidence_score — reads assets.confidence_score (0–1 float, set by operator)
 *   content_length   — counts characters in assets.content
 *   approval_rate    — queries approvals table for experiment's asset history
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExperimentBrief, ExperimentDecision, MetricResult } from '../types'

// ---------------------------------------------------------------------------
// Asset shape (only the fields we need — avoids importing full DB types)
// ---------------------------------------------------------------------------

export interface EvaluableAsset {
  id: string
  mission_id: string | null
  content: string
  confidence_score: number
}

// ---------------------------------------------------------------------------
// evaluateMetric
// ---------------------------------------------------------------------------

/**
 * Score an asset against the brief's metric.
 *
 * Returns null if the metric cannot be computed (e.g. no approvals data yet).
 * Callers should treat null as "undecidable" and default to discard.
 *
 * @param asset           The asset produced by this iteration
 * @param brief           The experiment brief (contains metric_type + direction)
 * @param priorBestValue  The best observed metric value so far (null on baseline)
 * @param supabase        Admin client — required only for approval_rate metric
 */
export async function evaluateMetric(
  asset: EvaluableAsset,
  brief: ExperimentBrief,
  priorBestValue: number | null,
  supabase?: SupabaseClient,
): Promise<MetricResult | null> {
  let value: number

  switch (brief.metric_type) {
    case 'confidence_score': {
      value = asset.confidence_score
      break
    }

    case 'content_length': {
      value = asset.content.length
      break
    }

    case 'approval_rate': {
      if (!supabase) {
        console.warn('[MetricEvaluator] approval_rate requires a supabase client — returning null')
        return null
      }
      const rate = await computeApprovalRate(supabase, brief.id)
      if (rate === null) return null
      value = rate
      break
    }

    default: {
      console.warn(`[MetricEvaluator] Unknown metric_type: ${brief.metric_type}`)
      return null
    }
  }

  const delta = priorBestValue !== null ? value - priorBestValue : null

  return {
    value,
    delta,
    raw_source: describeSource(brief.metric_type, value, asset),
  }
}

// ---------------------------------------------------------------------------
// makeDecision
// ---------------------------------------------------------------------------

export interface DecisionResult {
  decision: ExperimentDecision
  reason: string
}

/**
 * Decide whether to keep or discard an iteration based on its metric result.
 *
 * Rules:
 *   - Baseline (priorBestValue was null → delta is null): always 'baseline'
 *   - Direction = maximize: keep if delta >= keep_threshold
 *   - Direction = minimize: keep if (-delta) >= keep_threshold  (lower is better)
 *   - Otherwise: discard
 */
export function makeDecision(
  result: MetricResult,
  brief: ExperimentBrief,
): DecisionResult {
  // Baseline iteration — no prior to compare against
  if (result.delta === null) {
    return {
      decision: 'baseline',
      reason: `Baseline established: ${brief.metric_type} = ${formatValue(result.value)}`,
    }
  }

  const threshold = brief.keep_threshold ?? 0

  if (brief.metric_direction === 'maximize') {
    if (result.delta >= threshold) {
      return {
        decision: 'kept',
        reason: `Improved by ${formatDelta(result.delta)} (threshold: ${threshold}) — new best: ${formatValue(result.value)}`,
      }
    } else {
      return {
        decision: 'discarded',
        reason: `Delta ${formatDelta(result.delta)} below threshold ${threshold} — kept prior best: ${formatValue(result.value - result.delta)}`,
      }
    }
  } else {
    // minimize: a negative delta means improvement
    const improvement = -result.delta
    if (improvement >= threshold) {
      return {
        decision: 'kept',
        reason: `Reduced by ${formatDelta(improvement)} (threshold: ${threshold}) — new best: ${formatValue(result.value)}`,
      }
    } else {
      return {
        decision: 'discarded',
        reason: `Reduction ${formatDelta(improvement)} below threshold ${threshold} — kept prior best: ${formatValue(result.value + improvement)}`,
      }
    }
  }
}

// ---------------------------------------------------------------------------
// approval_rate helper
// ---------------------------------------------------------------------------

/**
 * Compute the approval rate for an experiment brief across all its iterations.
 * = (approved assets) / (approved + rejected assets) for this experiment.
 * Returns null if there are no decided assets yet.
 */
async function computeApprovalRate(
  supabase: SupabaseClient,
  briefId: string,
): Promise<number | null> {
  // Find all missions for this experiment brief
  const { data: missions, error: missErr } = await supabase
    .from('missions')
    .select('id')
    .eq('experiment_brief_id', briefId)

  if (missErr || !missions?.length) return null

  const missionIds = missions.map((m) => m.id)

  // Find all assets produced by those missions
  const { data: assets, error: assetErr } = await supabase
    .from('assets')
    .select('id')
    .in('mission_id', missionIds)

  if (assetErr || !assets?.length) return null

  const assetIds = assets.map((a) => a.id)

  // Count approved and rejected approvals for those assets
  const { data: approvals, error: apprErr } = await supabase
    .from('approvals')
    .select('status')
    .in('asset_id', assetIds)
    .in('status', ['approved', 'rejected'])

  if (apprErr || !approvals?.length) return null

  const approved = approvals.filter((a) => a.status === 'approved').length
  const total = approvals.length

  return total > 0 ? approved / total : null
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatValue(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(4)
}

function formatDelta(d: number): string {
  const sign = d >= 0 ? '+' : ''
  return `${sign}${Number.isInteger(d) ? d : d.toFixed(4)}`
}

function describeSource(
  metricType: ExperimentBrief['metric_type'],
  value: number,
  asset: EvaluableAsset,
): string {
  switch (metricType) {
    case 'confidence_score':
      return `assets.confidence_score = ${value.toFixed(4)} (asset ${asset.id.slice(0, 8)})`
    case 'content_length':
      return `len(assets.content) = ${value} chars (asset ${asset.id.slice(0, 8)})`
    case 'approval_rate':
      return `approval_rate = ${(value * 100).toFixed(1)}% across experiment history`
  }
}
