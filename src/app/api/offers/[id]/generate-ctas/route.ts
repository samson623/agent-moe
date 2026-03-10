import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOffer } from '@/lib/supabase/queries/offers'
import { ctaEngine } from '@/features/revenue-lab/cta-engine'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id: offer_id } = await params

    // Auth: verify user owns the offer's workspace
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: offer, error: offerError } = await getOffer(adminClient, offer_id)

    if (offerError) {
      return NextResponse.json({ error: offerError }, { status: 500 })
    }

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Verify workspace ownership
    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', offer.workspace_id)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }

    if (!workspace) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    const platforms: string[] = Array.isArray(body.platforms)
      ? body.platforms
      : ['general', 'x', 'linkedin']

    const content_types: string[] = Array.isArray(body.content_types)
      ? body.content_types
      : ['post', 'video_script']

    const countPerCombination: number | undefined =
      typeof body.count_per_combination === 'number' && body.count_per_combination > 0
        ? (body.count_per_combination as number)
        : undefined

    const result = await ctaEngine.generateCTAs(
      {
        offer_id,
        workspace_id: offer.workspace_id,
        platforms,
        content_types,
        ...(countPerCombination !== undefined ? { count_per_combination: countPerCombination } : {}),
      },
      offer,
    )

    return NextResponse.json({ data: result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
