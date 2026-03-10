import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOfferStats, getPricingLadder } from '@/lib/supabase/queries/offers'

export const dynamic = 'force-dynamic'

function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '$0'
  const dollars = cents / 100
  return `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')
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

    const adminClient = createAdminClient()

    const [statsResult, ladderResult] = await Promise.all([
      getOfferStats(adminClient, workspaceId),
      getPricingLadder(adminClient, workspaceId),
    ])

    if (statsResult.error) {
      return NextResponse.json({ error: statsResult.error }, { status: 500 })
    }

    if (ladderResult.error) {
      return NextResponse.json({ error: ladderResult.error }, { status: 500 })
    }

    const stats = statsResult.data!
    const ladder = ladderResult.data

    // Compute price_range_display
    let price_range_display: string

    if (ladder.length === 0) {
      price_range_display = 'No offers configured'
    } else {
      // Null price_cents = free ($0); ladder is ordered ascending nulls first
      const minOffer = ladder[0]!
      const maxOffer = ladder[ladder.length - 1]!

      const minDisplay = formatCents(minOffer.price_cents)
      const maxDisplay = formatCents(maxOffer.price_cents)

      price_range_display =
        minDisplay === maxDisplay ? minDisplay : `${minDisplay} → ${maxDisplay}`
    }

    return NextResponse.json({
      data: {
        ...stats,
        price_range_display,
        pricing_ladder_count: ladder.length,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
