/**
 * POST /api/missions/retry-paused
 *
 * Finds every mission with status 'paused' or 'failed' and retries them:
 * 1. Reset all failed/running jobs back to 'pending'
 * 2. Set mission status → 'running'
 * 3. Fire-and-forget the execution engine for each
 *
 * Used for bulk recovery after a system fix (e.g. the --max-turns bug).
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { updateMissionStatus } from '@/lib/supabase/queries/missions'

export const dynamic = 'force-dynamic'

export async function POST(): Promise<NextResponse> {
  try {
    const client = createAdminClient()

    // 1. Find all paused or failed missions
    const { data: missions, error } = await client
      .from('missions')
      .select('id, workspace_id, status')
      .in('status', ['paused', 'failed'])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!missions || missions.length === 0) {
      return NextResponse.json({ ok: true, retried: 0, message: 'No paused missions found' })
    }

    const results: Array<{ missionId: string; jobsReset: number; mode: string }> = []

    for (const mission of missions) {
      // 2. Get all jobs for this mission
      const { data: jobs } = await client
        .from('jobs')
        .select('id, status')
        .eq('mission_id', mission.id)

      const allJobs = jobs ?? []

      if (allJobs.length > 0) {
        // Reset failed and stuck-running jobs back to pending
        const toReset = allJobs
          .filter((j) => j.status === 'failed' || j.status === 'running')
          .map((j) => j.id)

        if (toReset.length > 0) {
          await client
            .from('jobs')
            .update({ status: 'pending', started_at: null, completed_at: null, error_message: null })
            .in('id', toReset)
        }

        // Set mission back to running
        await updateMissionStatus(client, mission.id, 'running')

        // Fire-and-forget the execution engine
        import('@/features/mission-engine/services/execution-engine')
          .then(({ createExecutionEngine }) => {
            const engine = createExecutionEngine(mission.id, mission.workspace_id)
            return engine.execute()
          })
          .then((summary) => {
            const statusMap = {
              completed: 'completed',
              failed: 'failed',
              blocked: 'paused',
              partial: 'paused',
            } as const
            return updateMissionStatus(client, mission.id, statusMap[summary.finalStatus])
          })
          .catch((err) => {
            console.error(`[retry-paused] Engine error for ${mission.id}:`, err)
            updateMissionStatus(client, mission.id, 'failed').catch(() => {})
          })

        results.push({ missionId: mission.id, jobsReset: toReset.length, mode: 'resume' })
      } else {
        // No jobs — full replan
        await updateMissionStatus(client, mission.id, 'pending')

        import('@/features/mission-engine/services/orchestrator')
          .then(({ planAndExecuteMission }) =>
            planAndExecuteMission(mission.id, mission.workspace_id),
          )
          .catch((err) => console.error(`[retry-paused] Orchestrator error for ${mission.id}:`, err))

        results.push({ missionId: mission.id, jobsReset: 0, mode: 'replan' })
      }
    }

    return NextResponse.json({ ok: true, retried: results.length, missions: results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
