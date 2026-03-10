import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOffer, updateOffer, deleteOffer } from '@/lib/supabase/queries/offers'
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

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Authenticates the request and verifies that the offer belongs to the
 * authenticated user's workspace.
 */
async function authorizeOffer(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      offer: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const adminClient = createAdminClient()
  const { data: offer, error: offerError } = await getOffer(adminClient, id)

  if (offerError) {
    return {
      offer: null,
      error: NextResponse.json({ error: offerError }, { status: 500 }),
    }
  }

  if (!offer) {
    return {
      offer: null,
      error: NextResponse.json({ error: 'Offer not found' }, { status: 404 }),
    }
  }

  // Verify the offer's workspace belongs to the authenticated user
  const { data: workspace } = (await supabase
    .from('workspaces')
    .select('id')
    .eq('id', offer.workspace_id)
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null }

  if (!workspace) {
    return {
      offer: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { offer, error: null }
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params
    const { offer, error } = await authorizeOffer(id)
    if (error) return error

    return NextResponse.json({ data: offer })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params
    const { error: authErr } = await authorizeOffer(id)
    if (authErr) return authErr

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      name,
      description,
      offer_type,
      price_cents,
      currency,
      cta_text,
      cta_url,
      status,
      meta,
    } = body

    // Validate enum fields if provided
    if (offer_type !== undefined && !OFFER_TYPES.includes(offer_type as OfferType)) {
      return NextResponse.json(
        { error: `Invalid offer_type. Must be one of: ${OFFER_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    if (status !== undefined && !OFFER_STATUSES.includes(status as OfferStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${OFFER_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return NextResponse.json(
        { error: 'name must be a non-empty string' },
        { status: 400 },
      )
    }

    const updates = {
      ...(name !== undefined ? { name: (name as string).trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(offer_type !== undefined ? { offer_type: offer_type as OfferType } : {}),
      ...(price_cents !== undefined ? { price_cents } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(cta_text !== undefined ? { cta_text } : {}),
      ...(cta_url !== undefined ? { cta_url } : {}),
      ...(status !== undefined ? { status: status as OfferStatus } : {}),
      ...(meta !== undefined ? { meta } : {}),
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: updated, error: updateError } = await updateOffer(adminClient, id, updates)

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    if (!updated) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    return NextResponse.json({ data: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params
    const { error: authErr } = await authorizeOffer(id)
    if (authErr) return authErr

    const adminClient = createAdminClient()
    const { error: deleteError } = await deleteOffer(adminClient, id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
