import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getMissions, createMission } from '@/lib/supabase/queries/missions'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { MissionStatus, MissionPriority } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const MISSION_PRIORITIES: MissionPriority[] = ['low', 'normal', 'high', 'urgent']
const MISSION_STATUSES: MissionStatus[] = [
  'pending', 'planning', 'running', 'paused', 'completed', 'failed',
]

const createMissionSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().default(''),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
})

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

    const statusParam = searchParams.get('status') as MissionStatus | null
    if (statusParam && !MISSION_STATUSES.includes(statusParam)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${MISSION_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const priorityParam = searchParams.get('priority') as MissionPriority | null
    if (priorityParam && !MISSION_PRIORITIES.includes(priorityParam)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${MISSION_PRIORITIES.join(', ')}` },
        { status: 400 },
      )
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))

    const client = createAdminClient()
    const { data, error } = await getMissions(
      client,
      workspaceId,
      {
        ...(statusParam && { status: statusParam }),
        ...(priorityParam && { priority: priorityParam }),
      },
      { page, pageSize: limit },
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      missions: data!.data,
      total: data!.count,
      page: data!.page,
      limit: data!.pageSize,
    })
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

    const parsed = createMissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id, title, description, priority } = parsed.data

    const client = createAdminClient()
    const { data: mission, error } = await createMission(client, {
      workspace_id,
      user_id: 'system',
      title,
      instruction: description ?? '',
      priority,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: 'mission.created',
      entity_type: 'mission',
      entity_id: mission!.id,
      summary: `Mission created: ${title}`,
    })

    return NextResponse.json({ mission }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
