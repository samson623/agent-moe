/**
 * GET /api/missions/[id]/activity
 *
 * Returns activity log entries related to a specific mission.
 * Queries by entity_id matching the mission ID or any job within that mission.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id: missionId } = await context.params
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 },
      )
    }

    const client = createAdminClient()

    // Get all job IDs for this mission so we can include job-level logs
    const { data: jobs } = await client
      .from('jobs')
      .select('id')
      .eq('mission_id', missionId)

    const entityIds = [missionId, ...(jobs ?? []).map((j) => j.id)]

    // Fetch activity logs for the mission and all its jobs
    const { data: logs, error } = await client
      .from('activity_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('entity_id', entityIds)
      .order('occurred_at', { ascending: true })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs: logs ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
