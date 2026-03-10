import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getCampaignStats } from '@/lib/supabase/queries/campaigns'

export const dynamic = 'force-dynamic'

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

    const client = createAdminClient()
    const { data: stats, error } = await getCampaignStats(client, workspaceId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
