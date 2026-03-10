import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOffers, createOffer } from '@/lib/supabase/queries/offers'
import type { OfferType, OfferStatus } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const OFFER_TYPES: OfferType[] = [
  'product',
  'service',
  'lead_magnet',
  'course',
  'consultation',
  'subscription',
  'affiliate',
]

const OFFER_STATUSES: OfferStatus[] = ['active', 'inactive', 'archived']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const workspaceId = searchParams.get('workspace_id')
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 },
      )
    }

    // Auth: verify user owns this workspace
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Optional filters
    const statusParam = searchParams.get('status') as OfferStatus | null
    if (statusParam && !OFFER_STATUSES.includes(statusParam)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${OFFER_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const offerTypeParam = searchParams.get('offer_type') as OfferType | null
    if (offerTypeParam && !OFFER_TYPES.includes(offerTypeParam)) {
      return NextResponse.json(
        { error: `Invalid offer_type. Must be one of: ${OFFER_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50') || 50))
    const offset = Math.max(0, Number(searchParams.get('offset') ?? '0') || 0)

    const client = createAdminClient()
    const { data: offers, error } = await getOffers(client, workspaceId, {
      ...(statusParam ? { status: statusParam } : {}),
      ...(offerTypeParam ? { offer_type: offerTypeParam } : {}),
      limit,
      offset,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data: offers, count: offers.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Auth: verify user owns the workspace
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId: string | undefined = body.workspace_id
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Validate required fields
    const { name, description, offer_type, price_cents, currency, cta_text, cta_url, status, meta } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required and must be a non-empty string' }, { status: 400 })
    }

    if (!offer_type || !OFFER_TYPES.includes(offer_type as OfferType)) {
      return NextResponse.json(
        { error: `offer_type is required and must be one of: ${OFFER_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    if (status !== undefined && !OFFER_STATUSES.includes(status as OfferStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${OFFER_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const client = createAdminClient()
    const { data: offer, error } = await createOffer(client, {
      workspace_id: workspaceId,
      name: name.trim(),
      ...(description !== undefined ? { description } : {}),
      offer_type: offer_type as OfferType,
      ...(price_cents !== undefined ? { price_cents } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(cta_text !== undefined ? { cta_text } : {}),
      ...(cta_url !== undefined ? { cta_url } : {}),
      ...(status !== undefined ? { status: status as OfferStatus } : {}),
      ...(meta !== undefined ? { meta } : {}),
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data: offer }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
