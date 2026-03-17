import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnector, updateConnectorStatus, updateConnectorCredentials } from '@/lib/supabase/queries/connectors'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const connector = await getConnector(id)
    if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 })

    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', connector.workspace_id)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }
    if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Wipe credentials and mark disconnected
    await Promise.all([
      updateConnectorCredentials(id, {}),
      updateConnectorStatus(id, 'disconnected'),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
