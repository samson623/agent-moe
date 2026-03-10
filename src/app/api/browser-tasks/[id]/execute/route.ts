import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getBrowserTask, updateBrowserTask } from '@/lib/supabase/queries/browser-tasks'
import { TaskExecutor } from '@/features/browser-agent/task-executor'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const client = await createAdminClient()

    // Verify task exists and is in an executable state
    const { data: task, error: fetchError } = await getBrowserTask(client, id)

    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status === 'running') {
      return NextResponse.json({ error: 'Task is already running' }, { status: 409 })
    }

    if (task.status === 'completed') {
      return NextResponse.json({ error: 'Task is already completed' }, { status: 409 })
    }

    // Reset retry count if retrying a failed task
    const updatePayload: Record<string, unknown> = { status: 'pending' }
    if (task.status === 'failed' || task.status === 'timeout') {
      updatePayload.retry_count = 0
      updatePayload.error_message = null
      updatePayload.result = null
    }

    // Mark as pending so the task executor picks it up
    const { data: updated, error: updateError } = await updateBrowserTask(client, id, updatePayload)

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    // Fire-and-forget: execute the task asynchronously so the API route returns
    // immediately while the browser task runs in the background. The UI polls
    // task status via GET /api/browser-tasks/[id]. Errors are logged but do not
    // affect the response — the DB record will reflect failure when they occur.
    const executor = new TaskExecutor()
    executor.execute(id, client).catch((err) => {
      console.error('[TaskExecutor]', err)
    })

    return NextResponse.json({ data: updated, queued: true })
  } catch (err) {
    console.error('[POST /api/browser-tasks/[id]/execute]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
