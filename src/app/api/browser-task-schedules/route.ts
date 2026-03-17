import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSchedules, createSchedule } from '@/lib/supabase/queries/browser-task-schedules'
import { BrowserTaskScheduleInputSchema } from '@/features/browser-agent/types'
import { getScheduler } from '@/features/browser-agent/scheduler'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const is_active = searchParams.get('is_active')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0

    const client = await createAdminClient()
    const { data, error, total } = await getSchedules(client, workspaceId, {
      is_active: is_active !== null ? is_active === 'true' : undefined,
      limit,
      offset,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, count: total })
  } catch (err) {
    console.error('[GET /api/browser-task-schedules]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = BrowserTaskScheduleInputSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const client = await createAdminClient()
    const { data, error } = await createSchedule(client, parsed.data)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Register with the in-process scheduler immediately
    if (data) {
      try {
        getScheduler().register(data)
      } catch {
        // Scheduler may not be running in edge/build — that's fine
      }
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/browser-task-schedules]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
