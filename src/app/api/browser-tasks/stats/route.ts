import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getBrowserTaskStats } from '@/lib/supabase/queries/browser-tasks'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const client = await createAdminClient()
    const { data, error } = await getBrowserTaskStats(client, workspaceId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/browser-tasks/stats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
