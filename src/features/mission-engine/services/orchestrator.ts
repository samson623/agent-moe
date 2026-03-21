/**
 * Mission Orchestrator — autonomous plan → execute pipeline.
 *
 * Called once when a mission is created. Handles the full lifecycle:
 * 1. Plan the mission (AI decomposition into jobs)
 * 2. Execute all jobs through the ExecutionEngine
 * 3. Update mission status based on outcome
 *
 * Runs entirely server-side. The caller fire-and-forgets this function.
 */

import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { getMissionPlanner } from '@/features/ai/mission-planner'
import { loadWorkspacePreferences } from './preferences-loader'
import { createExecutionEngine } from './execution-engine'
import { createJobsBatch } from '@/lib/supabase/queries/jobs'
import { updateMissionStatus } from '@/lib/supabase/queries/missions'
import { logActivity } from '@/lib/supabase/queries/activity'
import { notifyMissionStage } from '@/features/telegram/notifier'
import type { JobInsert, Json } from '@/lib/supabase/types'
import type { Job as AIJob } from '@/features/ai/types'

function toTitleCase(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function toJobInsert(aiJob: AIJob, missionId: string, workspaceId: string): JobInsert {
  return {
    id: aiJob.id,
    mission_id: missionId,
    workspace_id: workspaceId,
    title: toTitleCase(aiJob.type),
    status: 'pending',
    operator_team: aiJob.operatorTeam,
    model_used: null,
    input_data: aiJob.input as unknown as Json,
    output_data: {} as Json,
    depends_on: aiJob.dependsOn,
    job_type: aiJob.type,
  }
}

/**
 * Autonomously plans and executes a mission end-to-end.
 * Never throws — all errors are caught and reflected in mission status.
 */
export async function planAndExecuteMission(
  missionId: string,
  workspaceId: string,
): Promise<void> {
  const client = createAdminClient()

  try {
    // ── Phase 1: Plan ──────────────────────────────────────────────────────
    await updateMissionStatus(client, missionId, 'planning')

    const { data: missionRow } = await client
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single()

    if (!missionRow) {
      console.error(`[Orchestrator] Mission ${missionId} not found`)
      return
    }

    // Telegram: notify planning started
    notifyMissionStage(missionRow.user_id, missionId, 'planning').catch(() => {})

    const workspace = await loadWorkspacePreferences(workspaceId)
    const planner = getMissionPlanner()
    const planResult = await planner.plan(missionRow.instruction, workspace)

    if (!planResult.success) {
      console.error(`[Orchestrator] Planning failed for ${missionId}:`, planResult.error)
      await updateMissionStatus(client, missionId, 'failed')
      await logActivity(client, {
        workspace_id: workspaceId,
        actor_type: 'system',
        action: 'mission.failed',
        entity_type: 'mission',
        entity_id: missionId,
        summary: `Planning failed: ${planResult.error.message}`,
      })
      return
    }

    const aiJobs: AIJob[] = await planner.decompose(planResult.data)
    const jobInserts: JobInsert[] = aiJobs.map((j) => toJobInsert(j, missionId, workspaceId))

    const { error: insertError } = await createJobsBatch(client, jobInserts)
    if (insertError) {
      console.error(`[Orchestrator] Failed to store jobs for ${missionId}:`, insertError)
      await updateMissionStatus(client, missionId, 'failed')
      return
    }

    await logActivity(client, {
      workspace_id: workspaceId,
      actor_type: 'system',
      action: 'mission.planned',
      entity_type: 'mission',
      entity_id: missionId,
      summary: `Mission decomposed into ${jobInserts.length} jobs`,
      details: {
        job_count: jobInserts.length,
        estimated_duration_minutes: planResult.data.estimatedDurationMinutes,
        model: planResult.model,
        tokens_used: planResult.tokensUsed ?? null,
        duration_ms: planResult.durationMs,
      } as Record<string, unknown>,
    })

    // ── Phase 2: Execute ───────────────────────────────────────────────────
    await updateMissionStatus(client, missionId, 'running')
    // Telegram: notify operators working
    notifyMissionStage(missionRow.user_id, missionId, 'working', `${jobInserts.length} jobs queued`).catch(() => {})

    const engine = createExecutionEngine(missionId, workspaceId)
    const summary = await engine.execute()

    // ── Phase 3: Finalize ──────────────────────────────────────────────────
    const statusMap = {
      completed: 'completed',
      failed: 'failed',
      blocked: 'paused',
      partial: 'paused',
    } as const

    const finalStatus = statusMap[summary.finalStatus]
    await updateMissionStatus(client, missionId, finalStatus)

    await logActivity(client, {
      workspace_id: workspaceId,
      actor_type: 'system',
      action: `mission.${finalStatus}`,
      entity_type: 'mission',
      entity_id: missionId,
      summary: `Execution finished: ${summary.jobsCompleted}/${summary.jobsExecuted} jobs completed`,
      details: summary as unknown as Record<string, unknown>,
    })

    // Telegram: notify final status
    const telegramStage = finalStatus === 'completed' ? 'completed' : 'failed' as const
    notifyMissionStage(
      missionRow.user_id,
      missionId,
      telegramStage,
      `${summary.jobsCompleted}/${summary.jobsExecuted} jobs completed`,
    ).catch(() => {})
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[Orchestrator] Unhandled error for mission ${missionId}:`, message)
    await updateMissionStatus(client, missionId, 'failed').catch(() => {})
    await logActivity(client, {
      workspace_id: workspaceId,
      actor_type: 'system',
      action: 'mission.failed',
      entity_type: 'mission',
      entity_id: missionId,
      summary: `Orchestrator error: ${message}`,
    }).catch(() => {})
  }
}
