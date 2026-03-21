import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getScheduledMission } from '@/lib/supabase/queries/scheduled-missions'
import { getRecentRuns } from '@/lib/supabase/queries/scheduled-mission-runs'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params
    const { searchParams } = request.nextUrl
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))

    const client = createAdminClient()

    // Verify mission exists
    const { data: mission, error: missionError } = await getScheduledMission(client, id)
    if (missionError) {
      return NextResponse.json({ error: missionError }, { status: 500 })
    }
    if (!mission) {
      return NextResponse.json({ error: 'Scheduled mission not found' }, { status: 404 })
    }

    const { data: runs, error } = await getRecentRuns(client, id, limit)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ runs, mission_id: id, limit })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
