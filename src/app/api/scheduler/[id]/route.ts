import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getScheduledMission,
  updateScheduledMission,
  deleteScheduledMission,
} from '@/lib/supabase/queries/scheduled-missions'
import { ScheduledMissionUpdateSchema } from '@/features/scheduler/types'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const client = createAdminClient()
    const { data: mission, error } = await getScheduledMission(client, id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    if (!mission) {
      return NextResponse.json({ error: 'Scheduled mission not found' }, { status: 404 })
    }

    return NextResponse.json({ mission })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = ScheduledMissionUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const client = createAdminClient()

    const { data: existing, error: fetchError } = await getScheduledMission(client, id)
    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Scheduled mission not found' }, { status: 404 })
    }

    const { data: mission, error: updateError } = await updateScheduledMission(client, id, parsed.data)

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: existing.workspace_id,
      actor_type: 'system',
      action: 'scheduled_mission.updated',
      entity_type: 'scheduled_mission',
      entity_id: id,
      summary: `Scheduled mission updated: ${existing.name}`,
    })

    return NextResponse.json({ mission })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error: deleteError } = await deleteScheduledMission(client, id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: existing.workspace_id,
      actor_type: 'system',
      action: 'scheduled_mission.deleted',
      entity_type: 'scheduled_mission',
      entity_id: id,
      summary: `Scheduled mission deleted: ${existing.name}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
