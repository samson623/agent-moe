import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getCampaign,
  addAssetsToCampaign,
  removeAssetFromCampaign,
} from '@/lib/supabase/queries/campaigns'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

const addAssetsSchema = z.object({
  asset_ids: z
    .array(z.string().uuid())
    .min(1, 'At least one asset_id is required')
    .max(50, 'Maximum 50 asset_ids per request'),
})

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = addAssetsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const client = createAdminClient()

    // Verify campaign exists
    const { data: existing, error: fetchError } = await getCampaign(client, id)
    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { data: campaign, error } = await addAssetsToCampaign(
      client,
      id,
      parsed.data.asset_ids,
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params
    const { searchParams } = request.nextUrl

    const assetId = searchParams.get('asset_id')
    if (!assetId) {
      return NextResponse.json(
        { error: 'asset_id query parameter is required' },
        { status: 400 },
      )
    }

    const uuidResult = z.string().uuid().safeParse(assetId)
    if (!uuidResult.success) {
      return NextResponse.json(
        { error: 'asset_id must be a valid UUID' },
        { status: 400 },
      )
    }

    const client = createAdminClient()

    // Verify campaign exists
    const { data: existing, error: fetchError } = await getCampaign(client, id)
    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { data: campaign, error } = await removeAssetFromCampaign(
      client,
      id,
      assetId,
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
