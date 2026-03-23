import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getExperimentBrief,
  updateExperimentBrief,
  deleteExperimentBrief,
} from '@/lib/supabase/queries/experiments'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  goal: z.string().min(1).max(2000).optional(),
  operator_team: z.string().optional(),
  target_platform: z.string().optional(),
  target_asset_type: z.string().optional(),
  metric_type: z.enum(['confidence_score', 'content_length', 'approval_rate']).optional(),
  metric_direction: z.enum(['maximize', 'minimize']).optional(),
  metric_target: z.number().nullable().optional(),
  keep_threshold: z.number().min(0).optional(),
  max_tokens_per_run: z.number().int().positive().optional(),
  max_duration_ms: z.number().int().positive().optional(),
  max_iterations: z.number().int().min(1).max(100).optional(),
  cron_expression: z.string().optional(),
  timezone: z.string().optional(),
  is_active: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const client = createAdminClient()
  const { data, error } = await getExperimentBrief(client, id)
  if (error) return NextResponse.json({ error }, { status: 404 })
  return NextResponse.json({ experiment: data })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const client = createAdminClient()
    const { data, error } = await updateExperimentBrief(client, id, parsed.data)
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ experiment: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const client = createAdminClient()
  const { error } = await deleteExperimentBrief(client, id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
