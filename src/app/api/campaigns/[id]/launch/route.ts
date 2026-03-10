import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getCampaign,
  updateCampaign,
} from '@/lib/supabase/queries/campaigns'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const client = createAdminClient()

    // 1. Fetch the campaign
    const { data: campaign, error: fetchError } = await getCampaign(client, id)

    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // 2. Validate campaign is in 'draft' or 'paused' state
    if (campaign.status === 'active') {
      return NextResponse.json(
        { error: 'Campaign is already active' },
        { status: 409 },
      )
    }
    if (campaign.status === 'completed') {
      return NextResponse.json(
        { error: 'Campaign has already been completed and cannot be launched' },
        { status: 409 },
      )
    }
    if (campaign.status === 'archived') {
      return NextResponse.json(
        { error: 'Campaign is archived and cannot be launched' },
        { status: 409 },
      )
    }

    // 3. Check that campaign has at least 1 asset_id
    const assetIds: string[] = Array.isArray(campaign.asset_ids)
      ? campaign.asset_ids
      : []
    if (assetIds.length === 0) {
      return NextResponse.json(
        { error: 'Campaign has no assets to launch' },
        { status: 400 },
      )
    }

    // 4 & 5. Update status to 'active' — timeline milestones with 'pending' status
    // remain 'pending' (they start executing). We update status only.
    const { data: launched, error: updateError } = await updateCampaign(
      client,
      id,
      { status: 'active' },
    )

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    const missionIds: string[] = Array.isArray(campaign.mission_ids)
      ? campaign.mission_ids
      : []

    // 6. Log activity
    await logActivity(client, {
      workspace_id: campaign.workspace_id,
      actor_type: 'system',
      action: 'campaign.launched',
      entity_type: 'campaign',
      entity_id: id,
      summary: `Campaign launched: ${campaign.name}`,
      details: {
        asset_count: assetIds.length,
        mission_count: missionIds.length,
        previous_status: campaign.status,
      },
    })

    // 7. Return result
    return NextResponse.json({ campaign: launched, launched: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
