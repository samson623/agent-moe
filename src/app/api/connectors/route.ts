import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnectors, createConnector } from '@/lib/supabase/queries/connectors'
import type { ConnectorPlatform } from '@/lib/supabase/queries/connectors'

async function getWorkspaceId(): Promise<{ workspaceId: string | null; error: NextResponse | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { workspaceId: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: workspace } = (await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null }

  if (!workspace) return { workspaceId: null, error: NextResponse.json({ error: 'Workspace not found' }, { status: 404 }) }
  return { workspaceId: workspace.id, error: null }
}

export async function GET() {
  try {
    const { workspaceId, error } = await getWorkspaceId()
    if (error) return error

    const connectors = await getConnectors(workspaceId!)

    // Strip credentials before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safe = connectors.map(({ credentials, ...c }) => c)
    return NextResponse.json({ connectors: safe })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { workspaceId, error } = await getWorkspaceId()
    if (error) return error

    const body = await req.json() as { platform?: ConnectorPlatform; name?: string; config?: Record<string, unknown> }

    if (!body.platform) return NextResponse.json({ error: 'platform is required' }, { status: 400 })
    if (!body.name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const connector = await createConnector({
      workspace_id: workspaceId!,
      platform: body.platform,
      name: body.name.trim(),
      status: 'pending',
      credentials: {},
      config: body.config ?? {},
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credentials, ...safe } = connector
    return NextResponse.json({ connector: safe }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    // Handle unique constraint violation (platform already connected)
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: 'A connector for this platform already exists in this workspace' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
