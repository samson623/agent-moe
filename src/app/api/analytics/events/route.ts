import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  listAnalyticsEvents,
  type TimeRange,
} from '@/lib/supabase/queries/analytics'

export const dynamic = 'force-dynamic'

const TIME_RANGES = ['7d', '30d', '90d', 'all'] as const

const trackEventSchema = z.object({
  workspace_id: z.string().uuid(),
  event_type: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: z.string().uuid(),
  properties: z.record(z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const workspaceId = searchParams.get('workspace_id')
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 },
      )
    }

    const uuidResult = z.string().uuid().safeParse(workspaceId)
    if (!uuidResult.success) {
      return NextResponse.json(
        { error: 'workspace_id must be a valid UUID' },
        { status: 400 },
      )
    }

    const timeRangeParam = searchParams.get('time_range')
    if (timeRangeParam && !TIME_RANGES.includes(timeRangeParam as TimeRange)) {
      return NextResponse.json(
        { error: `Invalid time_range. Must be one of: ${TIME_RANGES.join(', ')}` },
        { status: 400 },
      )
    }

    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50),
    )
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0)

    // Auth: verify user owns this workspace
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()
    const { data, total, error } = await listAnalyticsEvents(adminClient, workspaceId, {
      event_type: searchParams.get('event_type') ?? undefined,
      entity_type: searchParams.get('entity_type') ?? undefined,
      time_range: (timeRangeParam as TimeRange) ?? undefined,
      limit,
      offset,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, total, limit, offset })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = trackEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id, event_type, entity_type, entity_id, properties } = parsed.data

    // Auth: verify user owns this workspace
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('analytics_events')
      .insert({
        workspace_id,
        event_type,
        entity_type,
        entity_id,
        ...(properties !== undefined
          ? { properties: properties as import('@/lib/supabase/types').Json }
          : {}),
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { id: data.id } }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
