import { NextRequest, NextResponse } from 'next/server'
import { getOperatorJobs } from '@/lib/supabase/queries/operators'
import type { OperatorTeam } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const VALID_TEAMS = new Set<OperatorTeam>([
  'content_strike',
  'growth_operator',
  'revenue_closer',
  'brand_guardian',
])

type RouteContext = { params: Promise<{ team: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { team } = await context.params

    if (!VALID_TEAMS.has(team as OperatorTeam)) {
      return NextResponse.json(
        { error: `Invalid team: ${team}. Must be one of: ${[...VALID_TEAMS].join(', ')}` },
        { status: 400 },
      )
    }

    const { searchParams } = request.nextUrl

    const workspaceId = searchParams.get('workspace_id')
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 },
      )
    }

    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 10

    if (limitParam && (isNaN(limit) || limit < 1)) {
      return NextResponse.json(
        { error: 'limit must be a positive integer' },
        { status: 400 },
      )
    }

    const { data, error } = await getOperatorJobs(
      workspaceId,
      team as OperatorTeam,
      limit,
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
