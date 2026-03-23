import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getExperimentBrief } from '@/lib/supabase/queries/experiments'
import { runExperimentIteration } from '@/features/experiment/services/experiment-orchestrator'

export const dynamic = 'force-dynamic'

// Allow long-running experiments to complete
export const maxDuration = 300

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = createAdminClient()
    const { data: brief, error: briefErr } = await getExperimentBrief(client, id)
    if (briefErr || !brief) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })

    if (brief.is_complete) {
      return NextResponse.json({ error: 'Experiment is already complete' }, { status: 400 })
    }

    const result = await runExperimentIteration(id, brief.workspace_id, user.id)
    return NextResponse.json({ run: result.run, brief: result.brief, is_complete: result.is_complete })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
