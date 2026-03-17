import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSchedule, updateSchedule } from '@/lib/supabase/queries/browser-task-schedules'
import { getScheduler } from '@/features/browser-agent/scheduler'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const client = await createAdminClient()

    const { data: schedule, error: fetchError } = await getSchedule(client, id)
    if (fetchError) return NextResponse.json({ error: fetchError }, { status: 500 })
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

    const newActive = !schedule.is_active
    const { data, error } = await updateSchedule(client, id, { is_active: newActive })

    if (error) return NextResponse.json({ error }, { status: 500 })

    // Update scheduler
    try {
      const scheduler = getScheduler()
      if (newActive && data) {
        scheduler.register(data)
      } else {
        scheduler.unregister(id)
      }
    } catch {
      // Scheduler may not be running
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[POST /api/browser-task-schedules/[id]/toggle]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
