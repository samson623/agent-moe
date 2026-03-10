import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAsset, getAssetVersions, createAssetVersion } from '@/lib/supabase/queries/assets'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { Json } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const createVersionSchema = z.object({
  body: z.string().min(1),
  title: z.string().max(500).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params

    const client = createAdminClient()
    const { data: asset } = await getAsset(client, id)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const { data, error } = await getAssetVersions(client, id, asset.parent_asset_id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params

    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createVersionSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const client = createAdminClient()
    const { metadata: rawMeta, ...rest } = parsed.data
    const { data: version, error } = await createAssetVersion(client, id, {
      ...rest,
      ...(rawMeta !== undefined ? { metadata: rawMeta as Json } : {}),
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!version) {
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: version.workspace_id,
      actor_type: 'system',
      action: 'asset.version_created',
      entity_type: 'asset',
      entity_id: version.id,
      summary: `New version (v${version.version}) created for asset ${version.parent_asset_id ?? id}`,
    })

    return NextResponse.json({ data: version }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
