/**
 * Autoresearch Loop — TypeScript Types
 *
 * Mirrors the schema defined in 00026_create_experiment_briefs.sql.
 * Used across: orchestrator, metric evaluator, diff generator, UI, API routes.
 */

// =============================================================================
// ENUMS
// =============================================================================

export type MetricType =
  | 'confidence_score'  // Read from assets.confidence_score
  | 'content_length'    // Character count of the generated asset
  | 'approval_rate'     // % of iterations that got approved

export type MetricDirection =
  | 'maximize'  // Higher is better
  | 'minimize'  // Lower is better

export type ExperimentDecision =
  | 'pending'    // Not evaluated yet
  | 'baseline'   // First iteration — establishes baseline
  | 'kept'       // Metric improved — becomes new best
  | 'discarded'  // Did not improve past threshold

// =============================================================================
// EXPERIMENT BRIEF
// =============================================================================

export interface ExperimentBrief {
  id: string
  workspace_id: string
  user_id: string

  name: string
  goal: string
  operator_team: string
  target_platform: string
  target_asset_type: string

  // Metric config
  metric_type: MetricType
  metric_direction: MetricDirection
  metric_target: number | null      // Optional absolute target (stop when reached)
  keep_threshold: number            // Min delta to accept iteration as improvement

  // Budget limits
  max_tokens_per_run: number
  max_duration_ms: number
  max_iterations: number

  // Iteration tracking
  current_iteration: number
  best_metric_value: number | null
  best_asset_id: string | null

  // Schedule
  cron_expression: string
  timezone: string
  last_run_at: string | null
  next_run_at: string | null

  // Lifecycle
  is_active: boolean
  is_complete: boolean

  created_at: string
  updated_at: string
}

// =============================================================================
// EXPERIMENT RUN
// =============================================================================

export interface ExperimentRun {
  id: string
  experiment_brief_id: string
  mission_id: string | null

  iteration: number
  instruction_used: string
  diff_summary: string | null

  metric_value: number | null
  metric_delta: number | null

  decision: ExperimentDecision
  decision_reason: string | null

  tokens_used: number | null
  duration_ms: number | null
  exceeded_token_budget: boolean
  exceeded_duration_budget: boolean

  started_at: string | null
  completed_at: string | null
  created_at: string
}

// =============================================================================
// METRIC RESULT (internal — not stored directly)
// =============================================================================

export interface MetricResult {
  value: number
  delta: number | null          // null on baseline (no prior to compare)
  raw_source: string            // e.g. "assets.confidence_score = 0.87"
}

// =============================================================================
// EXPERIMENT ITERATION RESULT (returned by orchestrator)
// =============================================================================

export interface ExperimentIterationResult {
  run: ExperimentRun
  brief: ExperimentBrief        // Updated brief state after this iteration
  is_complete: boolean          // True if max_iterations reached or target hit
}

// =============================================================================
// INPUT TYPES (for create/update API)
// =============================================================================

export interface CreateExperimentBriefInput {
  name: string
  goal: string
  operator_team?: string
  target_platform?: string
  target_asset_type?: string
  metric_type?: MetricType
  metric_direction?: MetricDirection
  metric_target?: number
  keep_threshold?: number
  max_tokens_per_run?: number
  max_duration_ms?: number
  max_iterations?: number
  cron_expression?: string
  timezone?: string
}

export interface UpdateExperimentBriefInput {
  name?: string
  goal?: string
  operator_team?: string
  target_platform?: string
  target_asset_type?: string
  metric_type?: MetricType
  metric_direction?: MetricDirection
  metric_target?: number | null
  keep_threshold?: number
  max_tokens_per_run?: number
  max_duration_ms?: number
  max_iterations?: number
  cron_expression?: string
  timezone?: string
  is_active?: boolean
}
