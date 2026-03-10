import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getApproval } from '@/lib/supabase/queries/approvals'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params
    const client = createAdminClient()
    const { data, error } = await getApproval(client, id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
