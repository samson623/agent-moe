import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  getContentPerformance,
  type TimeRange,
} from '@/lib/supabase/queries/analytics'

export const dynamic = 'force-dynamic'

const TIME_RANGES = ['7d', '30d', '90d', 'all'] as const

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

    const timeRangeParam = searchParams.get('time_range') ?? '30d'
    if (!TIME_RANGES.includes(timeRangeParam as TimeRange)) {
      return NextResponse.json(
        { error: `Invalid time_range. Must be one of: ${TIME_RANGES.join(', ')}` },
        { status: 400 },
      )
    }
    const timeRange = timeRangeParam as TimeRange

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
    const { data, error } = await getContentPerformance(adminClient, workspaceId, timeRange)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
