import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnector } from '@/lib/supabase/queries/connectors'
import { ConnectorPublisher } from '@/features/connectors/publisher'
import type { PublishInput } from '@/features/connectors/types'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: workspaceRow } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }
    if (!workspaceRow) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    const workspaceId = workspaceRow.id

    const connector = await getConnector(id)
    if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 })

    const { data: ownerCheck } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', connector.workspace_id)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }
    if (!ownerCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as Partial<PublishInput>

    if (!body.content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 })
    if (!body.contentType) return NextResponse.json({ error: 'contentType is required' }, { status: 400 })

    const publisher = new ConnectorPublisher()
    const result = await publisher.publishAsset({
      workspaceId,
      connectorId: id,
      assetId: body.assetId,
      content: body.content,
      contentType: body.contentType,
      platform: connector.platform,
      title: body.title,
      mediaUrls: body.mediaUrls,
      hashtags: body.hashtags,
      scheduledAt: body.scheduledAt,
      metadata: body.metadata,
    })

    return NextResponse.json({ result }, { status: result.success ? 200 : 422 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
