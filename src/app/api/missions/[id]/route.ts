import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getMission, updateMissionStatus } from '@/lib/supabase/queries/missions'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

const MISSION_STATUSES = [
  'pending', 'planning', 'running', 'paused', 'completed', 'failed',
] as const

const updateStatusSchema = z.object({
  status: z.enum(MISSION_STATUSES),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const client = createAdminClient()
    const { data: mission, error } = await getMission(client, id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
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

    const parsed = updateStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const client = createAdminClient()

    const { data: existing } = await getMission(client, id)
    if (!existing) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    const { data: mission, error } = await updateMissionStatus(
      client,
      id,
      parsed.data.status,
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: existing.workspace_id,
      actor_type: 'system',
      action: 'mission.status_updated',
      entity_type: 'mission',
      entity_id: id,
      summary: `Mission status changed to ${parsed.data.status}`,
      details: {
        previous_status: existing.status,
        new_status: parsed.data.status,
      },
    })

    return NextResponse.json({ mission })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
