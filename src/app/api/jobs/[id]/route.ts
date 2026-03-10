/**
 * GET  /api/jobs/[id]  — Returns a single job by ID.
 * PATCH /api/jobs/[id] — Partially updates a job (status, output_data, error_message, model_used).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getJob, updateJobStatus } from '@/lib/supabase/queries/jobs'
import type { Database, Json } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JOB_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const
const MODEL_CHOICES = ['claude', 'gpt5_nano'] as const

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const patchBodySchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  output_data: z.record(z.unknown()).optional(),
  error_message: z.string().optional(),
  model_used: z.enum(MODEL_CHOICES).optional(),
})

// ---------------------------------------------------------------------------
// Route context — Next.js 15 async params
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id: jobId } = await context.params

    const client = createAdminClient()
    const { data: job, error } = await getJob(client, jobId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH handler
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id: jobId } = await context.params

    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = patchBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { status, output_data, error_message, model_used } = parsed.data

    // Nothing to update
    if (status === undefined && output_data === undefined && error_message === undefined && model_used === undefined) {
      return NextResponse.json(
        { error: 'At least one of status, output_data, error_message, or model_used is required' },
        { status: 400 },
      )
    }

    const client = createAdminClient()

    // Verify the job exists before attempting updates
    const { data: existing, error: fetchError } = await getJob(client, jobId)
    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // If a status transition is included, use the purpose-built helper which
    // also handles lifecycle timestamps (started_at, completed_at, duration_ms).
    if (status !== undefined) {
      const { data: updatedJob, error: updateError } = await updateJobStatus(
        client,
        jobId,
        status,
        {
          ...(output_data !== undefined && { output_data: output_data as Json }),
          ...(error_message !== undefined && { error_message }),
          ...(model_used !== undefined && { model_used }),
        },
      )

      if (updateError) {
        return NextResponse.json({ error: updateError }, { status: 500 })
      }

      return NextResponse.json({ job: updatedJob })
    }

    // output_data / error_message / model_used update without a status change —
    // do a targeted UPDATE directly on the jobs table.
    const patch: Database['public']['Tables']['jobs']['Update'] = {
      ...(output_data !== undefined && { output_data: output_data as Json }),
      ...(error_message !== undefined && { error_message }),
      ...(model_used !== undefined && { model_used }),
    }

    const { data: updatedJob, error: directUpdateError } = await client
      .from('jobs')
      .update(patch)
      .eq('id', jobId)
      .select()
      .single()

    if (directUpdateError) {
      return NextResponse.json({ error: directUpdateError.message }, { status: 500 })
    }

    return NextResponse.json({ job: updatedJob })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
