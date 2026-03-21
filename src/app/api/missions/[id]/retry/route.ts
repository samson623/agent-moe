/**
 * POST /api/missions/[id]/retry
 *
 * Retries a paused or failed mission by:
 * 1. Resetting all failed/pending jobs back to 'pending'
 * 2. Resetting mission status to 'running'
 * 3. Re-launching the execution engine (skips re-planning — keeps existing job graph)
 *
 * If the mission has no jobs yet (failed during planning), it re-runs the full
 * planAndExecuteMission pipeline instead.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getMission, updateMissionStatus } from '@/lib/supabase/queries/missions'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id: missionId } = await context.params
    const client = createAdminClient()

    // 1. Fetch the mission
    const { data: mission, error: missionErr } = await getMission(client, missionId)
    if (missionErr || !mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    // 2. Only allow retry for paused or failed missions
    if (mission.status !== 'paused' && mission.status !== 'failed') {
      return NextResponse.json(
        { error: `Cannot retry a mission with status '${mission.status}'` },
        { status: 409 },
      )
    }

    // 3. Check if there are existing jobs
    const { data: existingJobs } = await client
      .from('jobs')
      .select('id, status')
      .eq('mission_id', missionId)

    const jobs = existingJobs ?? []

    if (jobs.length > 0) {
      // Reset all non-completed jobs back to 'pending' so the engine can retry them
      const jobsToReset = jobs
        .filter((j) => j.status === 'failed' || j.status === 'running')
        .map((j) => j.id)

      if (jobsToReset.length > 0) {
        await client
          .from('jobs')
          .update({ status: 'pending', started_at: null, completed_at: null, error_message: null })
          .in('id', jobsToReset)
      }

      // Reset mission to 'running' and re-launch execution engine only
      await updateMissionStatus(client, missionId, 'running')

      // Fire-and-forget execution engine
      import('@/features/mission-engine/services/execution-engine')
        .then(({ createExecutionEngine }) => {
          const engine = createExecutionEngine(missionId, mission.workspace_id)
          return engine.execute()
        })
        .then((summary) => {
          const statusMap = {
            completed: 'completed',
            failed: 'failed',
            blocked: 'paused',
            partial: 'paused',
          } as const
          return updateMissionStatus(client, missionId, statusMap[summary.finalStatus])
        })
        .catch((err) => {
          console.error(`[retry] Execution engine error for ${missionId}:`, err)
          updateMissionStatus(client, missionId, 'failed').catch(() => {})
        })

      return NextResponse.json({ ok: true, mode: 'resume', jobsReset: jobsToReset.length })
    }

    // No jobs yet — full re-plan + execute
    await updateMissionStatus(client, missionId, 'pending')

    import('@/features/mission-engine/services/orchestrator')
      .then(({ planAndExecuteMission }) =>
        planAndExecuteMission(missionId, mission.workspace_id),
      )
      .catch((err) => console.error(`[retry] Orchestrator error for ${missionId}:`, err))

    return NextResponse.json({ ok: true, mode: 'replan' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
