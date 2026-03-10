/**
 * JobQueue — manages the job execution queue for a mission
 *
 * Handles: advancing the queue, checking readiness, tracking state.
 * Works directly with the jobs DB table via admin client.
 *
 * Design notes:
 * - Stateless class: every method hits the DB for fresh data.
 *   This ensures correctness when running in a serverless context where
 *   in-memory state between invocations cannot be trusted.
 * - All DB calls go through the jobs query helpers for consistency.
 * - No throwing to callers — internal errors are logged and safe defaults returned.
 */

import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import {
  getJobsByMission,
  getReadyJobs,
  updateJobStatus,
} from '@/lib/supabase/queries/jobs'
import type { Database, Json } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Local type alias
// ---------------------------------------------------------------------------

type Job = Database['public']['Tables']['jobs']['Row']

// ---------------------------------------------------------------------------
// Terminal statuses — jobs in these states will not run again
// ---------------------------------------------------------------------------

const TERMINAL_STATUSES = new Set<Job['status']>(['completed', 'failed', 'cancelled'])

// ---------------------------------------------------------------------------
// JobQueue class
// ---------------------------------------------------------------------------

export class JobQueue {
  constructor(
    private readonly missionId: string,
    private readonly workspaceId: string,
  ) {}

  // ---------------------------------------------------------------------------
  // Read methods
  // ---------------------------------------------------------------------------

  /**
   * Returns all jobs for this mission ordered by created_at ASC.
   */
  async getAll(): Promise<Job[]> {
    const client = createAdminClient()
    const { data, error } = await getJobsByMission(client, this.missionId)
    if (error) {
      console.error(`[JobQueue] getAll failed for mission ${this.missionId}: ${error}`)
      return []
    }
    return data
  }

  /**
   * Returns jobs that are ready to run:
   * - status = 'pending'
   * - all IDs in depends_on are in the completed set
   */
  async getReady(): Promise<Job[]> {
    const client = createAdminClient()
    const { data, error } = await getReadyJobs(client, this.missionId)
    if (error) {
      console.error(`[JobQueue] getReady failed for mission ${this.missionId}: ${error}`)
      return []
    }
    return data
  }

  /**
   * Returns jobs currently in 'running' status.
   */
  async getRunning(): Promise<Job[]> {
    const all = await this.getAll()
    return all.filter((j) => j.status === 'running')
  }

  /**
   * Returns true if all jobs are in terminal states (completed / failed / cancelled).
   * An empty job list is considered complete (nothing left to do).
   */
  async isComplete(): Promise<boolean> {
    const all = await this.getAll()
    if (all.length === 0) return true
    return all.every((j) => TERMINAL_STATUSES.has(j.status))
  }

  /**
   * Returns true if the mission is blocked:
   * - There are no ready jobs (nothing can run next)
   * - There is at least one pending job (work remains)
   * - At least one failed job exists (a dependency failed)
   *
   * A blocked mission cannot auto-advance without human intervention
   * or a retry mechanism.
   */
  async isBlocked(): Promise<boolean> {
    const all = await this.getAll()
    if (all.length === 0) return false

    const hasPending = all.some((j) => j.status === 'pending')
    if (!hasPending) return false

    const hasFailed = all.some((j) => j.status === 'failed')
    if (!hasFailed) return false

    const ready = await this.getReady()
    return ready.length === 0
  }

  // ---------------------------------------------------------------------------
  // Write methods
  // ---------------------------------------------------------------------------

  /**
   * Marks a job as running and records started_at.
   */
  async markRunning(jobId: string): Promise<void> {
    const client = createAdminClient()
    const { error } = await updateJobStatus(client, jobId, 'running')
    if (error) {
      console.error(`[JobQueue] markRunning failed for job ${jobId}: ${error}`)
    }
  }

  /**
   * Marks a job as completed with its output payload.
   */
  async markCompleted(
    jobId: string,
    output: Record<string, unknown>,
    durationMs: number,
    modelUsed: 'claude' | 'gpt5_nano',
  ): Promise<void> {
    const client = createAdminClient()
    const { error } = await updateJobStatus(client, jobId, 'completed', {
      output_data: output as Json,
      duration_ms: durationMs,
      model_used: modelUsed,
    })
    if (error) {
      console.error(`[JobQueue] markCompleted failed for job ${jobId}: ${error}`)
    }
  }

  /**
   * Marks a job as failed and records the error message.
   */
  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    const client = createAdminClient()
    const { error } = await updateJobStatus(client, jobId, 'failed', {
      error_message: errorMessage,
    })
    if (error) {
      console.error(`[JobQueue] markFailed failed for job ${jobId}: ${error}`)
    }
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  /**
   * Returns a progress snapshot for the UI.
   *
   * progress is a 0–100 integer representing completed / total.
   */
  async getStats(): Promise<{
    total: number
    pending: number
    running: number
    completed: number
    failed: number
    progress: number
  }> {
    const all = await this.getAll()

    const total = all.length
    const pending = all.filter((j) => j.status === 'pending').length
    const running = all.filter((j) => j.status === 'running').length
    const completed = all.filter((j) => j.status === 'completed').length
    const failed = all.filter((j) => j.status === 'failed').length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, pending, running, completed, failed, progress }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createJobQueue(missionId: string, workspaceId: string): JobQueue {
  return new JobQueue(missionId, workspaceId)
}
