import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { decideApproval } from '@/lib/supabase/queries/approvals'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

const decideSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'revision_requested']),
  notes: z.string().max(2000).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = decideSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 422 })
    }

    const { decision, notes } = parsed.data
    const client = createAdminClient()
    const { data, error } = await decideApproval(client, id, decision, notes)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    // Log activity
    await logActivity(client, {
      workspace_id: data.workspace_id,
      actor_type: 'system',
      action: `approval_${decision}`,
      entity_type: 'approval',
      entity_id: id,
      summary: `Approval ${decision.replace('_', ' ')} for asset ${data.asset_id?.slice(0, 8) ?? 'unknown'}`,
      details: { decision, notes: notes ?? null } as Record<string, unknown>,
    })

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
