/**
 * GET /api/jobs
 *
 * Lists jobs for a workspace with optional filters and pagination.
 *
 * Query parameters:
 *   workspace_id    (required, UUID)
 *   mission_id      (optional, UUID)
 *   status          (optional) pending | running | completed | failed | cancelled
 *   operator_team   (optional) content_strike | growth_operator | revenue_closer | brand_guardian
 *   page            (optional, default 1)
 *   limit           (optional, default 20, max 100)
 *
 * Response: { jobs, total, page, limit }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getJobs } from '@/lib/supabase/queries/jobs'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JOB_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const
const OPERATOR_TEAMS = [
  'content_strike',
  'growth_operator',
  'revenue_closer',
  'brand_guardian',
] as const

// ---------------------------------------------------------------------------
// Query-params schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  workspace_id: z.string().uuid({ message: 'workspace_id must be a valid UUID' }),
  mission_id: z.string().uuid({ message: 'mission_id must be a valid UUID' }).optional(),
  status: z.enum(JOB_STATUSES).optional(),
  operator_team: z.enum(OPERATOR_TEAMS).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl

    // Collect raw query params into a plain object for Zod parsing
    const rawParams = {
      workspace_id: searchParams.get('workspace_id') ?? undefined,
      mission_id: searchParams.get('mission_id') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      operator_team: searchParams.get('operator_team') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    }

    const parsed = querySchema.safeParse(rawParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id, mission_id, status, operator_team, page, limit } = parsed.data

    const client = createAdminClient()

    const { data, error } = await getJobs(
      client,
      workspace_id,
      {
        ...(mission_id !== undefined && { mission_id }),
        ...(status !== undefined && { status }),
        ...(operator_team !== undefined && { operator_team }),
      },
      { page, pageSize: limit },
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      jobs: data!.data,
      total: data!.count,
      page: data!.page,
      limit: data!.pageSize,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
