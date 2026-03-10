import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/supabase/queries/activity'

const ScanSchema = z.object({
  workspace_id: z.string().uuid(),
  topics: z.array(z.string().min(1)).min(1).max(20),
  platforms: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = ScanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { workspace_id, topics, platforms } = parsed.data
    const client = await createAdminClient()

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: 'trend_scan_queued',
      entity_type: 'workspace',
      entity_id: workspace_id,
      summary: `Trend scan queued for ${topics.length} topic${topics.length === 1 ? '' : 's'}: ${topics.slice(0, 3).join(', ')}${topics.length > 3 ? '...' : ''}`,
    })

    return NextResponse.json({
      status: 'queued',
      message: 'Scan initiated. Signals will appear in your Growth Engine shortly.',
      workspace_id,
      topics,
      platforms: platforms ?? ['all'],
      queued_at: new Date().toISOString(),
    }, { status: 202 })
  } catch (err) {
    console.error('[POST /api/trend-signals/scan]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
