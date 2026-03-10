/**
 * POST /api/missions/[id]/plan
 *
 * Plans a mission: invokes the AI Mission Planner, decomposes the plan into
 * typed jobs, batch-inserts them into the DB, and advances the mission status
 * to 'planning'.
 *
 * Returns 201 with { plan, jobs } on success.
 * Returns 404 if the mission doesn't exist.
 * Returns 500 with error details if the AI planning step fails.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getMissionPlanner } from '@/features/ai/mission-planner'
import { loadWorkspacePreferences } from '@/features/mission-engine/services/preferences-loader'
import { createJobsBatch } from '@/lib/supabase/queries/jobs'
import { updateMissionStatus } from '@/lib/supabase/queries/missions'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { JobInsert, Mission, Json } from '@/lib/supabase/types'
import type { Job } from '@/features/ai/types'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const planBodySchema = z.object({
  workspace_id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Route context type — Next.js 15 async params
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a snake_case or enum string to Title Case for use as a job title
 * when the AI job doesn't supply an explicit one.
 * e.g. "content_generation" → "Content Generation"
 */
function toTitleCase(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Converts a decomposed AI Job into a DB JobInsert record.
 * The AI job already has real UUIDs (decompose() resolves localId → UUID).
 */
function toJobInsert(
  aiJob: Job,
  missionId: string,
  workspaceId: string,
): JobInsert {
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

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id: missionId } = await context.params

    // 1. Parse and validate request body
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = planBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id } = parsed.data
    const client = createAdminClient()

    // 2. Fetch the mission — 404 if not found
    const { data: missionRaw, error: missionError } = await client
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single()

    if (missionError) {
      if (missionError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
      }
      return NextResponse.json({ error: missionError.message }, { status: 500 })
    }

    if (!missionRaw) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    const mission = missionRaw as unknown as Mission

    // 3. Load workspace preferences (throws if workspace missing)
    let workspace
    try {
      workspace = await loadWorkspacePreferences(workspace_id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workspace'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    // 4. Run the AI mission planner
    const planner = getMissionPlanner()
    const planResult = await planner.plan(mission.instruction, workspace)

    if (!planResult.success) {
      return NextResponse.json(
        {
          error: 'Mission planning failed',
          details: {
            code: planResult.error.code,
            message: planResult.error.message,
            retryable: planResult.error.retryable,
          },
        },
        { status: 500 },
      )
    }

    // 5. Decompose the plan into executable AI Job objects (UUIDs resolved)
    const aiJobs: Job[] = await planner.decompose(planResult.data)

    // 6. Convert AI jobs → DB insert records
    const jobInserts: JobInsert[] = aiJobs.map((aiJob) =>
      toJobInsert(aiJob, missionId, workspace_id),
    )

    // 7. Batch-insert jobs
    const { data: insertedJobs, error: insertError } = await createJobsBatch(client, jobInserts)

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to store jobs: ${insertError}` },
        { status: 500 },
      )
    }

    // 8. Advance mission status to 'planning'
    const { error: statusError } = await updateMissionStatus(client, missionId, 'planning')

    if (statusError) {
      // Non-fatal: jobs are already stored; log and continue
      console.error('[POST /missions/[id]/plan] Failed to update mission status:', statusError)
    }

    // 9. Log activity
    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: 'mission.planned',
      entity_type: 'mission',
      entity_id: missionId,
      summary: `Mission decomposed into ${insertedJobs.length} jobs`,
      details: {
        job_count: insertedJobs.length,
        estimated_duration_minutes: planResult.data.estimatedDurationMinutes,
        model: planResult.model,
        tokens_used: planResult.tokensUsed ?? null,
        duration_ms: planResult.durationMs,
      } as Record<string, unknown>,
    })

    return NextResponse.json(
      { plan: planResult.data, jobs: insertedJobs },
      { status: 201 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
