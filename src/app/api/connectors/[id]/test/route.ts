import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnector, updateConnectorStatus } from '@/lib/supabase/queries/connectors'
import { createAdapter } from '@/features/connectors/adapters'
import type { ConnectorCredentials } from '@/features/connectors/types'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const connector = await getConnector(id)
    if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 })

    // Verify ownership
    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', connector.workspace_id)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }
    if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const adapter = createAdapter(connector.platform, connector.credentials as ConnectorCredentials)
    const result = await adapter.testConnection()

    // Update status based on test result
    if (result.success) {
      if (connector.status !== 'connected') {
        await updateConnectorStatus(id, 'connected')
      }
    } else {
      await updateConnectorStatus(id, 'error', result.error)
    }

    return NextResponse.json({ result })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
