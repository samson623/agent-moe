import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getBrowserTasks, createBrowserTask } from '@/lib/supabase/queries/browser-tasks'
import { BrowserTaskInputSchema } from '@/features/browser-agent/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const status = searchParams.get('status') ?? undefined
    const task_type = searchParams.get('task_type') ?? undefined
    const mission_id = searchParams.get('mission_id') ?? undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0

    const client = await createAdminClient()
    const { data, error, total } = await getBrowserTasks(client, workspaceId, {
      status,
      task_type,
      mission_id,
      limit,
      offset,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, count: total })
  } catch (err) {
    console.error('[GET /api/browser-tasks]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = BrowserTaskInputSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const client = await createAdminClient()
    const { data, error } = await createBrowserTask(client, parsed.data)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/browser-tasks]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
