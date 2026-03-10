import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getMissionStats } from '@/lib/supabase/queries/missions'
import { getWorkspaceStats } from '@/lib/supabase/queries/workspace'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 },
      )
    }

    const client = createAdminClient()

    const [workspaceResult, missionResult] = await Promise.all([
      getWorkspaceStats(client, workspaceId),
      getMissionStats(client, workspaceId),
    ])

    if (workspaceResult.error) {
      return NextResponse.json({ error: workspaceResult.error }, { status: 500 })
    }
    if (missionResult.error) {
      return NextResponse.json({ error: missionResult.error }, { status: 500 })
    }

    const ws = workspaceResult.data!
    const ms = missionResult.data!

    return NextResponse.json({
      missions_today: ms.today_count,
      missions_running: ms.running_count,
      total_missions: ms.total,
      missions_by_status: ms.by_status,
      total_assets: ws.asset_count,
      pending_approvals: ws.pending_approval_count,
      approval_rate: ws.total_jobs > 0
        ? Math.round((ws.completed_jobs / ws.total_jobs) * 100)
        : 0,
      total_jobs: ws.total_jobs,
      active_connectors: ws.active_connector_count,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
