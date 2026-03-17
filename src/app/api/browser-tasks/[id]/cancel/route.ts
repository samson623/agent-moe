import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getBrowserTask, updateBrowserTask } from '@/lib/supabase/queries/browser-tasks'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const client = await createAdminClient()

    const { data: task, error: fetchError } = await getBrowserTask(client, id)

    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot cancel a task with status: ${task.status}` },
        { status: 409 },
      )
    }

    const { data: updated, error: updateError } = await updateBrowserTask(client, id, {
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[POST /api/browser-tasks/[id]/cancel]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
