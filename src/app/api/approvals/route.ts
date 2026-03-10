import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getApprovals, getApprovalStats } from '@/lib/supabase/queries/approvals'
import type { ApprovalStatus, RiskLevel } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const status = searchParams.get('status') as ApprovalStatus | null
    const riskLevel = searchParams.get('risk_level') as RiskLevel | null
    const missionId = searchParams.get('mission_id')
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))
    const offset = Math.max(0, Number(searchParams.get('offset') ?? '0'))

    const client = createAdminClient()

    const [listResult, stats] = await Promise.all([
      getApprovals(
        client,
        workspaceId,
        {
          ...(status ? { status } : {}),
          ...(riskLevel ? { risk_level: riskLevel } : {}),
          ...(missionId ? { mission_id: missionId } : {}),
        },
        { limit, offset },
      ),
      getApprovalStats(client, workspaceId),
    ])

    if (listResult.error) {
      return NextResponse.json({ error: listResult.error }, { status: 500 })
    }

    return NextResponse.json({
      approvals: listResult.data,
      count: listResult.count,
      stats,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
