/**
 * ExecutionEngine — orchestrates sequential job execution with dependency awareness
 *
 * Takes a mission and runs its jobs in the right order:
 * 1. Find ready jobs (pending + all deps complete)
 * 2. Execute each ready job through its operator
 * 3. Store output in DB + advance queue
 * 4. Repeat until all jobs complete or mission is blocked
 *
 * In Phase 2 this runs jobs sequentially. Parallel execution is a Phase 3 enhancement.
 *
 * Bridge pattern:
 * The DB stores jobs as `jobs.Row` (snake_case, DB-native types).
 * The AI operator layer consumes `ai/types.ts#Job` (camelCase, enum-typed).
 * This engine bridges the two by mapping DB rows → AI Job objects before
 * passing them to operators, and storing operator outputs back to the DB.
 */

import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/supabase/queries/activity'
import { OperatorFactory } from '@/features/ai/operator-factory'
import {
  type Workspace,
  type JobInput,
  type ExecutionResult,
  JobType,
  JobStatus,
  OperatorTeam,
  ModelChoice,
  type Job as AIJob,
} from '@/features/ai/types'
import { loadWorkspacePreferences } from '@/features/mission-engine/services/preferences-loader'
import { JobQueue, createJobQueue } from '@/features/mission-engine/services/job-queue'
import { createAssetFromJobOutput, createApprovalIfNeeded } from './asset-pipeline'
import type { Database } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Local DB type alias
// ---------------------------------------------------------------------------

type DbJob = Database['public']['Tables']['jobs']['Row']
type DbOperatorTeam = Database['public']['Enums']['operator_team']

// ---------------------------------------------------------------------------
// Public interface types
// ---------------------------------------------------------------------------

export interface ExecutionOptions {
  /** Stop after N jobs (for incremental execution). Default: run all. */
  maxJobs?: number
  /** Log what would run without making any AI calls. */
  dryRun?: boolean
}

export interface ExecutionSummary {
  missionId: string
  jobsExecuted: number
  jobsCompleted: number
  jobsFailed: number
  totalDurationMs: number
  finalStatus: 'completed' | 'partial' | 'blocked' | 'failed'
}

// ---------------------------------------------------------------------------
// DB → AI type bridge helpers
// ---------------------------------------------------------------------------

/**
 * Maps a DB operator_team value to the AI OperatorTeam enum.
 */
function mapDbTeamToOperatorTeam(team: DbOperatorTeam): OperatorTeam {
  const map: Record<DbOperatorTeam, OperatorTeam> = {
    content_strike: OperatorTeam.CONTENT_STRIKE,
    growth_operator: OperatorTeam.GROWTH_OPERATOR,
    revenue_closer: OperatorTeam.REVENUE_CLOSER,
    brand_guardian: OperatorTeam.BRAND_GUARDIAN,
    browser_agent: OperatorTeam.BROWSER_AGENT,
  }
  return map[team]
}

/**
 * Derives a JobType from the DB job row.
 *
 * Priority: job_type column → input_data.job_type → team-based default.
 */
function deriveJobType(dbJob: DbJob): JobType {
  // 1. Use the job_type column directly (set by orchestrator)
  if (dbJob.job_type && Object.values(JobType).includes(dbJob.job_type as JobType)) {
    return dbJob.job_type as JobType
  }

  // 2. Check input_data for legacy jobs
  const inputData = dbJob.input_data
  if (
    inputData !== null &&
    typeof inputData === 'object' &&
    'job_type' in inputData &&
    typeof (inputData as Record<string, unknown>)['job_type'] === 'string'
  ) {
    const candidate = (inputData as Record<string, unknown>)['job_type'] as string
    if (Object.values(JobType).includes(candidate as JobType)) {
      return candidate as JobType
    }
  }

  // 3. Fallback: derive a sensible default per operator team
  const defaults: Record<DbOperatorTeam, JobType> = {
    content_strike: JobType.CONTENT_GENERATION,
    growth_operator: JobType.TREND_ANALYSIS,
    revenue_closer: JobType.OFFER_MAPPING,
    brand_guardian: JobType.SAFETY_REVIEW,
    browser_agent: JobType.BROWSER_SCRAPE,
  }
  return defaults[dbJob.operator_team]
}

/**
 * Maps the DB job's input_data → AI JobInput type.
 *
 * The MissionPlanner serialises a fully-formed JobInput into input_data when
 * creating jobs. We cast it back here — if the field is missing or malformed
 * the operator will surface a SCHEMA_VALIDATION_FAILED error.
 */
function mapDbJobInputToJobInput(dbJob: DbJob): JobInput {
  return dbJob.input_data as unknown as JobInput
}

/**
 * Maps a DB jobs.Row → AI types.ts Job for operator consumption.
 */
function bridgeDbJobToAIJob(dbJob: DbJob): AIJob {
  return {
    id: dbJob.id,
    missionId: dbJob.mission_id,
    type: deriveJobType(dbJob),
    operatorTeam: mapDbTeamToOperatorTeam(dbJob.operator_team),
    status: JobStatus.PENDING,
    priority: 1,
    dependsOn: dbJob.depends_on,
    input: mapDbJobInputToJobInput(dbJob),
    createdAt: dbJob.created_at,
    ...(dbJob.started_at !== null ? { startedAt: dbJob.started_at } : {}),
    ...(dbJob.completed_at !== null ? { completedAt: dbJob.completed_at } : {}),
  }
}

/**
 * Maps AI ModelChoice → DB model_used enum value.
 */
function modelChoiceToDb(model: ModelChoice): 'claude' | 'gpt5_nano' {
  return model === ModelChoice.CLAUDE ? 'claude' : 'gpt5_nano'
}

/**
 * Safely coerces an operator output value into a plain DB-safe record.
 * Arrays are boxed under `result`; primitives under `value`; nulls become `{}`.
 */
function coerceOutputToRecord(output: unknown): Record<string, unknown> {
  if (output === null || output === undefined) return {}
  if (Array.isArray(output)) return { result: output }
  if (typeof output === 'object') return output as Record<string, unknown>
  return { value: output }
}

/**
 * Extracts confidenceScore from an unknown output payload at runtime.
 * Returns undefined when the field is absent or not a number.
 */
function extractConfidenceScore(data: unknown): number | undefined {
  if (data !== null && typeof data === 'object' && 'confidenceScore' in data) {
    const score = (data as Record<string, unknown>).confidenceScore
    return typeof score === 'number' ? score : undefined
  }
  return undefined
}

function formatDurationForLog(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

// ---------------------------------------------------------------------------
// ExecutionEngine
// ---------------------------------------------------------------------------

export class ExecutionEngine {
  constructor(
    private readonly missionId: string,
    private readonly workspaceId: string,
  ) {}

  /**
   * Execute the mission's job queue until all jobs are done or the queue is blocked.
   *
   * Returns an ExecutionSummary with final counts and overall status.
   * Never throws — all errors are captured in job records and the summary.
   */
  async execute(options: ExecutionOptions = {}): Promise<ExecutionSummary> {
    const { maxJobs, dryRun = false } = options
    const engineStart = Date.now()

    const MAX_RETRIES = 2
    const retryCount = new Map<string, number>()

    let jobsExecuted = 0
    let jobsCompleted = 0
    let jobsFailed = 0

    // Load workspace preferences once per execution
    let workspace: Workspace
    try {
      workspace = await loadWorkspacePreferences(this.workspaceId)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[ExecutionEngine] Failed to load workspace preferences: ${message}`)
      return {
        missionId: this.missionId,
        jobsExecuted: 0,
        jobsCompleted: 0,
        jobsFailed: 0,
        totalDurationMs: Date.now() - engineStart,
        finalStatus: 'failed',
      }
    }

    const queue = createJobQueue(this.missionId, this.workspaceId)

    // Main execution loop
    while (true) {
      // Respect maxJobs ceiling
      if (maxJobs !== undefined && jobsExecuted >= maxJobs) {
        break
      }

      // Check terminal conditions before fetching ready jobs
      const [isComplete, isBlocked] = await Promise.all([
        queue.isComplete(),
        queue.isBlocked(),
      ])

      if (isComplete) break
      if (isBlocked) break

      // Get jobs ready for execution
      const readyJobs = await queue.getReady()

      if (readyJobs.length === 0) {
        // No ready jobs but not complete / blocked — shouldn't happen, guard anyway
        break
      }

      // Phase 2: sequential — process the first ready job each iteration
      const dbJob = readyJobs[0]
      if (dbJob === undefined) break

      jobsExecuted++

      if (dryRun) {
        console.log(
          `[ExecutionEngine] DRY RUN — would execute job ${dbJob.id} (${dbJob.title}) ` +
            `via ${dbJob.operator_team}`,
        )
        await queue.markCompleted(dbJob.id, { dry_run: true }, 0, 'claude')
        jobsCompleted++
        continue
      }

      await this.executeJob(dbJob, workspace, queue)

      // Read back the updated job to track success/failure counts
      const updatedJobs = await queue.getAll()
      const updatedJob = updatedJobs.find((j) => j.id === dbJob.id)

      if (updatedJob?.status === 'completed') {
        jobsCompleted++
      } else if (updatedJob?.status === 'failed') {
        const attempts = (retryCount.get(dbJob.id) ?? 0) + 1
        retryCount.set(dbJob.id, attempts)

        if (attempts <= MAX_RETRIES) {
          // Reset to pending so the engine retries this job
          console.log(
            `[ExecutionEngine] Job ${dbJob.id} failed (attempt ${attempts}/${MAX_RETRIES + 1}), retrying...`,
          )
          await queue.markPending(dbJob.id)
          // Don't count as failed yet — give it another shot
        } else {
          jobsFailed++
        }
      }
    }

    // Determine final status
    const finalComplete = await queue.isComplete()
    const finalBlocked = await queue.isBlocked()

    let finalStatus: ExecutionSummary['finalStatus']

    if (finalComplete && jobsFailed === 0) {
      finalStatus = 'completed'
    } else if (finalBlocked) {
      finalStatus = 'blocked'
    } else if (jobsCompleted === 0 && jobsFailed > 0) {
      finalStatus = 'failed'
    } else {
      finalStatus = 'partial'
    }

    return {
      missionId: this.missionId,
      jobsExecuted,
      jobsCompleted,
      jobsFailed,
      totalDurationMs: Date.now() - engineStart,
      finalStatus,
    }
  }

  // ---------------------------------------------------------------------------
  // Private: single job execution
  // ---------------------------------------------------------------------------

  /**
   * Executes a single DB job through the appropriate operator.
   *
   * Steps:
   * 1. Mark job as running
   * 2. Bridge DB job → AI Job type
   * 3. Route to the correct operator via OperatorFactory
   * 4. On success: mark completed with output
   * 5. On failure: mark failed with error message
   *
   * All errors are caught and written to the DB — they never propagate up
   * to the execute() loop, which continues with remaining jobs.
   */
  private async executeJob(
    dbJob: DbJob,
    workspace: Workspace,
    queue: JobQueue,
  ): Promise<void> {
    const jobStart = Date.now()
    const client = createAdminClient()

    await queue.markRunning(dbJob.id)

    // Log: job started
    await logActivity(client, {
      workspace_id: this.workspaceId,
      actor_type: 'operator',
      action: 'job.started',
      entity_type: 'job',
      entity_id: dbJob.id,
      summary: `Running "${dbJob.title}" via ${dbJob.operator_team.replace('_', ' ')}`,
      details: { mission_id: this.missionId, operator_team: dbJob.operator_team },
    }).catch(() => {})

    let result: ExecutionResult<unknown>

    const aiJob: AIJob = bridgeDbJobToAIJob(dbJob)
    const enrichedInput = this.enrichJobInputWithWorkspace(aiJob.input, workspace)
    const enrichedAIJob: AIJob = { ...aiJob, input: enrichedInput }

    try {
      const operator = OperatorFactory.create(mapDbTeamToOperatorTeam(dbJob.operator_team))
      result = await operator.execute(enrichedAIJob)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(
        `[ExecutionEngine] Unexpected error executing job ${dbJob.id}: ${message}`,
      )
      await queue.markFailed(dbJob.id, `Unexpected execution error: ${message}`)
      await logActivity(client, {
        workspace_id: this.workspaceId,
        actor_type: 'operator',
        action: 'job.failed',
        entity_type: 'job',
        entity_id: dbJob.id,
        summary: `"${dbJob.title}" failed: ${message}`,
        details: { mission_id: this.missionId, error: message },
      }).catch(() => {})
      return
    }

    const durationMs = Date.now() - jobStart

    if (result.success) {
      const outputRecord = coerceOutputToRecord(result.data)
      await queue.markCompleted(
        dbJob.id,
        outputRecord,
        durationMs,
        modelChoiceToDb(result.model),
      )

      // Log: job completed
      await logActivity(client, {
        workspace_id: this.workspaceId,
        actor_type: 'operator',
        action: 'job.completed',
        entity_type: 'job',
        entity_id: dbJob.id,
        summary: `"${dbJob.title}" completed in ${formatDurationForLog(durationMs)} via ${modelChoiceToDb(result.model)}`,
        details: { mission_id: this.missionId, duration_ms: durationMs, model: modelChoiceToDb(result.model) },
      }).catch(() => {})

      try {
        await createAssetFromJobOutput({
          jobId: dbJob.id,
          missionId: this.missionId,
          workspaceId: this.workspaceId,
          operatorTeam: dbJob.operator_team,
          jobType: deriveJobType(dbJob),
          output: result.data,
          model: result.model,
          confidenceScore: extractConfidenceScore(result.data),
        })

        await createApprovalIfNeeded({
          jobId: dbJob.id,
          missionId: this.missionId,
          workspaceId: this.workspaceId,
          operatorTeam: dbJob.operator_team,
          output: result.data,
        })
      } catch (pipelineErr) {
        const msg = pipelineErr instanceof Error ? pipelineErr.message : String(pipelineErr)
        console.error(
          `[ExecutionEngine] Asset pipeline error (non-fatal) for job ${dbJob.id}: ${msg}`,
        )
      }
    } else {
      await queue.markFailed(dbJob.id, result.error.message)
      // Log: job failed
      await logActivity(client, {
        workspace_id: this.workspaceId,
        actor_type: 'operator',
        action: 'job.failed',
        entity_type: 'job',
        entity_id: dbJob.id,
        summary: `"${dbJob.title}" failed: ${result.error.message}`,
        details: { mission_id: this.missionId, error: result.error.message, code: result.error.code },
      }).catch(() => {})
    }
  }

  // ---------------------------------------------------------------------------
  // Private: workspace context injection
  // ---------------------------------------------------------------------------

  /**
   * Enriches a JobInput with workspace context where the operator needs it
   * but the stored input_data didn't capture it at planning time.
   */
  private enrichJobInputWithWorkspace(input: JobInput, workspace: Workspace): JobInput {
    if (!input || typeof input !== 'object') return input

    const kind = (input as { kind?: unknown }).kind

    switch (kind) {
      case 'content':
      case 'thread':
      case 'script':
      case 'caption':
      case 'safety': {
        // Cast through unknown to avoid the index-signature constraint on the union members
        const typedInput = input as unknown as Record<string, unknown>
        if (typedInput['brandRules'] === undefined) {
          return { ...typedInput, brandRules: workspace.brandRules } as unknown as JobInput
        }
        return input
      }

      case 'mission_planning': {
        const typedInput = input as { kind: 'mission_planning'; instruction: string; workspace?: Workspace }
        if (typedInput.workspace === undefined) {
          return { ...typedInput, workspace } as unknown as JobInput
        }
        return input
      }

      case 'trend': {
        const typedInput = input as { kind: 'trend'; niche?: string }
        if (!typedInput.niche) {
          return { ...typedInput, niche: workspace.niche } as unknown as JobInput
        }
        return input
      }

      case 'offer': {
        const typedInput = input as { kind: 'offer'; availableOffers?: unknown[] }
        if (!typedInput.availableOffers || typedInput.availableOffers.length === 0) {
          return {
            ...typedInput,
            availableOffers: workspace.activeOffers,
          } as unknown as JobInput
        }
        return input
      }

      default:
        return input
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a new ExecutionEngine bound to a specific mission and workspace.
 * Engines are stateless — create a new one per request.
 */
export function createExecutionEngine(
  missionId: string,
  workspaceId: string,
): ExecutionEngine {
  return new ExecutionEngine(missionId, workspaceId)
}
