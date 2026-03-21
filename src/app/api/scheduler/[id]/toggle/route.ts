import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getScheduledMission,
  updateScheduledMission,
} from '@/lib/supabase/queries/scheduled-missions'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

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

    const newState = !existing.is_active

    // When re-activating, reset consecutive failures
    const updates: Record<string, unknown> = { is_active: newState }
    if (newState) {
      updates['consecutive_failures'] = 0
    }

    const { data: mission, error: updateError } = await updateScheduledMission(client, id, updates)

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: existing.workspace_id,
      actor_type: 'system',
      action: newState ? 'scheduled_mission.activated' : 'scheduled_mission.deactivated',
      entity_type: 'scheduled_mission',
      entity_id: id,
      summary: `Scheduled mission ${newState ? 'activated' : 'deactivated'}: ${existing.name}`,
    })

    return NextResponse.json({ mission, toggled_to: newState })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
