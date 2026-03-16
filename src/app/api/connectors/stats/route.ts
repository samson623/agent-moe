import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnectorStats } from '@/lib/supabase/queries/connectors'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const stats = await getConnectorStats(workspace.id)
    return NextResponse.json({ stats })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
