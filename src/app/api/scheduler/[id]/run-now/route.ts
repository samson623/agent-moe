import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getScheduledMission } from '@/lib/supabase/queries/scheduled-missions'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Trigger immediate execution by setting next_run_at to now.
 * The mission-runner.ts script (running every 1 minute) will pick it up
 * on its next tick.
 *
 * This does NOT execute inline — it queues for the runner. This keeps
 * the API route fast and avoids timeout issues with heavy missions.
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const client = createAdminClient()

    const { data: existing, error: fetchError } = await getScheduledMission(client, id)
    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Scheduled mission not found' }, { status: 404 })
    }

    // Set next_run_at to now and ensure it's active so the runner picks it up
    const now = new Date().toISOString()
    const { error: updateError } = await (client as unknown as import('@supabase/supabase-js').SupabaseClient)
      .from('scheduled_missions')
      .update({
        next_run_at: now,
        is_active: true,
        consecutive_failures: 0,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: (updateError as { message: string }).message }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: existing.workspace_id,
      actor_type: 'system',
      action: 'scheduled_mission.run_now',
      entity_type: 'scheduled_mission',
      entity_id: id,
      summary: `Scheduled mission queued for immediate execution: ${existing.name}`,
    })

    return NextResponse.json({
      queued: true,
      mission_id: id,
      message: 'Mission queued — the runner will execute it within 1 minute.',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
