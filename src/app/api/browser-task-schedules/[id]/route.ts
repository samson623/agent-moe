import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSchedule, updateSchedule, deleteSchedule } from '@/lib/supabase/queries/browser-task-schedules'
import { getScheduler } from '@/features/browser-agent/scheduler'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const client = await createAdminClient()
    const { data, error } = await getSchedule(client, id)

    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/browser-task-schedules/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json() as Record<string, unknown>
    const client = await createAdminClient()

    const { data, error } = await updateSchedule(client, id, body)

    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

    // Re-register with scheduler if schedule-relevant fields changed
    try {
      const scheduler = getScheduler()
      if (data.is_active) {
        scheduler.register(data)
      } else {
        scheduler.unregister(id)
      }
    } catch {
      // Scheduler may not be running
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[PATCH /api/browser-task-schedules/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // Unregister from scheduler first
    try {
      getScheduler().unregister(id)
    } catch {
      // Scheduler may not be running
    }

    const client = await createAdminClient()
    const { error } = await deleteSchedule(client, id)

    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/browser-task-schedules/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
