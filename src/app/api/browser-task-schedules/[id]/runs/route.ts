import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getScheduleRuns } from '@/lib/supabase/queries/browser-task-schedules'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const limit = request.nextUrl.searchParams.get('limit')
      ? parseInt(request.nextUrl.searchParams.get('limit')!, 10)
      : 20

    const client = await createAdminClient()
    const { data, error } = await getScheduleRuns(client, id, limit)

    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/browser-task-schedules/[id]/runs]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
