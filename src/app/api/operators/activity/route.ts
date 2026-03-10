import { NextRequest, NextResponse } from 'next/server'
import { getOperatorActivity } from '@/lib/supabase/queries/operators'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl

    const workspaceId = searchParams.get('workspace_id')
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 },
      )
    }

    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 20

    if (limitParam && (isNaN(limit) || limit < 1)) {
      return NextResponse.json(
        { error: 'limit must be a positive integer' },
        { status: 400 },
      )
    }

    const { data, error } = await getOperatorActivity(workspaceId, limit)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
