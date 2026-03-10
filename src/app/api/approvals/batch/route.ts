import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { batchDecideApprovals, getApprovalStats } from '@/lib/supabase/queries/approvals'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

const batchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(2000).optional(),
  workspace_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = batchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 422 })
    }

    const { ids, decision, notes, workspace_id } = parsed.data
    const client = createAdminClient()
    const { updated, error } = await batchDecideApprovals(client, ids, decision, notes)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: `batch_approval_${decision}`,
      entity_type: 'approval',
      entity_id: ids[0] ?? 'batch',
      summary: `Batch ${decision} ${updated} approval${updated !== 1 ? 's' : ''}`,
      details: { ids, decision, updated } as Record<string, unknown>,
    })

    const stats = await getApprovalStats(client, workspace_id)
    return NextResponse.json({ updated, stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
