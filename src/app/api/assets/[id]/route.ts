import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAsset, updateAsset, deleteAsset } from '@/lib/supabase/queries/assets'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

const updateAssetSchema = z.object({
  title: z.string().max(500).nullable().optional(),
  body: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
  status: z
    .enum(['draft', 'review', 'approved', 'published', 'archived', 'rejected'])
    .optional(),
  platform: z
    .enum(['x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'email', 'universal'])
    .optional(),
  confidence_score: z.number().min(0).max(1).nullable().optional(),
  offer_id: z.string().uuid().nullable().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params

    const client = createAdminClient()
    const { data, error } = await getAsset(client, id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateAssetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      )
    }

    const client = createAdminClient()
    const { confidence_score: rawScore, metadata: rawMeta, title: rawTitle, ...restUpdates } = parsed.data
    const updates = {
      ...restUpdates,
      ...(rawTitle !== undefined ? { title: rawTitle ?? undefined } : {}),
      ...(rawScore !== undefined ? { confidence_score: rawScore ?? undefined } : {}),
      ...(rawMeta !== undefined ? { metadata: rawMeta as import('@/lib/supabase/types').Json } : {}),
    }
    const { data: asset, error } = await updateAsset(client, id, updates)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    await logActivity(client, {
      workspace_id: asset.workspace_id,
      actor_type: 'system',
      action: 'asset.updated',
      entity_type: 'asset',
      entity_id: asset.id,
      summary: `Asset updated: ${asset.title ?? asset.type} — fields: ${Object.keys(parsed.data).join(', ')}`,
    })

    return NextResponse.json({ data: asset })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params

    const client = createAdminClient()

    const { data: existing } = await getAsset(client, id)
    if (!existing) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const { error } = await deleteAsset(client, id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: existing.workspace_id,
      actor_type: 'system',
      action: 'asset.deleted',
      entity_type: 'asset',
      entity_id: id,
      summary: `Asset deleted: ${existing.title ?? existing.type} (${existing.platform})`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
