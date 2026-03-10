import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnector, updateConnector, deleteConnector } from '@/lib/supabase/queries/connectors'

type Params = { params: Promise<{ id: string }> }

async function authorizeConnector(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { connector: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const connector = await getConnector(id)
  if (!connector) return { connector: null, error: NextResponse.json({ error: 'Connector not found' }, { status: 404 }) }

  // Verify ownership via workspace
  const { data: workspace } = (await supabase
    .from('workspaces')
    .select('id')
    .eq('id', connector.workspace_id)
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null }

  if (!workspace) return { connector: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { connector, error: null }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const { connector, error } = await authorizeConnector(id)
    if (error) return error

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credentials, ...safe } = connector!
    return NextResponse.json({ connector: safe })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const { error } = await authorizeConnector(id)
    if (error) return error

    const body = await req.json() as { name?: string; config?: Record<string, unknown> }

    // Only allow safe fields — no credentials or status via PATCH
    const updated = await updateConnector(id, {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.config !== undefined && { config: body.config }),
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credentials, ...safe } = updated
    return NextResponse.json({ connector: safe })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const { error } = await authorizeConnector(id)
    if (error) return error

    await deleteConnector(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
