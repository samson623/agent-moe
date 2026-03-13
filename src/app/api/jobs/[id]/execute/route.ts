/**
 * POST /api/jobs/[id]/execute
 *
 * Triggers synchronous execution of ready jobs through the Mission Engine
 * until the mission queue reaches a terminal state (completed/blocked/failed).
 *
 * The engine processes jobs whose dependencies are all completed, so even if
 * the targeted job is not yet unblocked, other ready jobs in the same mission
 * will be dispatched.
 *
 * Returns 200 with an ExecutionSummary when the engine run completes.
 * Returns 404 if the job doesn't exist.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getJob } from '@/lib/supabase/queries/jobs'
import { updateMissionStatus } from '@/lib/supabase/queries/missions'
import { createExecutionEngine } from '@/features/mission-engine/services/execution-engine'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const executeBodySchema = z.object({
  workspace_id: z.string().uuid({ message: 'workspace_id must be a valid UUID' }),
})

// ---------------------------------------------------------------------------
// Route context — Next.js 15 async params
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id: jobId } = await context.params

    // 1. Parse and validate request body
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = executeBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id } = parsed.data

    const client = createAdminClient()

    // 2. Fetch the job to get its mission_id
    const { data: job, error: fetchError } = await getJob(client, jobId)

    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // 3. Mark mission as running (non-fatal if it fails).
    const { error: runningStatusError } = await updateMissionStatus(
      client,
      job.mission_id,
      'running',
    )
    if (runningStatusError) {
      console.error(
        `[POST /jobs/[id]/execute] Failed to set mission ${job.mission_id} to running: ${runningStatusError}`,
      )
    }

    // 4. Create the execution engine bound to this mission
    const engine = createExecutionEngine(job.mission_id, workspace_id)

    // 5. Run the engine synchronously until completion/block/failure.
    //    We await the full result so the HTTP response carries the outcome summary.
    //    The engine is responsible for its own internal error handling per-job;
    //    a failure within one job does not throw here.
    const summary = await engine.execute()

    // 6. Reflect mission-level status from queue execution outcome.
    const nextMissionStatus =
      summary.finalStatus === 'completed'
        ? 'completed'
        : summary.finalStatus === 'failed'
          ? 'failed'
          : 'paused'

    const { error: finalStatusError } = await updateMissionStatus(
      client,
      job.mission_id,
      nextMissionStatus,
    )
    if (finalStatusError) {
      console.error(
        `[POST /jobs/[id]/execute] Failed to set mission ${job.mission_id} to ${nextMissionStatus}: ${finalStatusError}`,
      )
    }

    return NextResponse.json({
      message: 'Execution completed',
      jobId,
      summary,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
