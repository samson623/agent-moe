import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getExperimentBriefs, createExperimentBrief } from '@/lib/supabase/queries/experiments'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  goal: z.string().min(1).max(2000),
  operator_team: z.string().optional(),
  target_platform: z.string().optional(),
  target_asset_type: z.string().optional(),
  metric_type: z.enum(['confidence_score', 'content_length', 'approval_rate']).optional(),
  metric_direction: z.enum(['maximize', 'minimize']).optional(),
  metric_target: z.number().optional(),
  keep_threshold: z.number().min(0).optional(),
  max_tokens_per_run: z.number().int().positive().optional(),
  max_duration_ms: z.number().int().positive().optional(),
  max_iterations: z.number().int().min(1).max(100).optional(),
  cron_expression: z.string().optional(),
  timezone: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')
    if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

    const client = createAdminClient()
    const { data, error } = await getExperimentBriefs(client, workspaceId)
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ experiments: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspace_id, ...input } = parsed.data
    const client = createAdminClient()
    const { data, error } = await createExperimentBrief(client, workspace_id, user.id, input)
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ experiment: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
