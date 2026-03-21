import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getScheduledMissions,
  createScheduledMission,
} from '@/lib/supabase/queries/scheduled-missions'
import { ScheduledMissionInputSchema } from '@/features/scheduler/types'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const workspaceId = searchParams.get('workspace_id')
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 },
      )
    }

    const uuidResult = z.string().uuid().safeParse(workspaceId)
    if (!uuidResult.success) {
      return NextResponse.json(
        { error: 'workspace_id must be a valid UUID' },
        { status: 400 },
      )
    }

    const isActiveParam = searchParams.get('is_active')
    const scheduleType = searchParams.get('schedule_type')
    const tagsParam = searchParams.get('tags')
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0)

    const client = createAdminClient()
    const { data, error, total } = await getScheduledMissions(client, workspaceId, {
      is_active: isActiveParam !== null ? isActiveParam === 'true' : undefined,
      schedule_type: scheduleType as 'once' | 'daily' | 'hourly' | 'weekly' | 'custom_cron' | undefined,
      tags: tagsParam ? tagsParam.split(',').map((t) => t.trim()) : undefined,
      limit,
      offset,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ missions: data, total, limit, offset })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const workspaceId = body.workspace_id
    if (!workspaceId || !z.string().uuid().safeParse(workspaceId).success) {
      return NextResponse.json(
        { error: 'workspace_id (valid UUID) is required' },
        { status: 400 },
      )
    }

    const parsed = ScheduledMissionInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const client = createAdminClient()
    const { data: mission, error } = await createScheduledMission(client, workspaceId, parsed.data)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: workspaceId,
      actor_type: 'system',
      action: 'scheduled_mission.created',
      entity_type: 'scheduled_mission',
      entity_id: mission!.id,
      summary: `Scheduled mission created: ${parsed.data.name}`,
    })

    return NextResponse.json({ mission }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
