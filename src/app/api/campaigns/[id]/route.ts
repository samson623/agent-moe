import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getCampaign,
  updateCampaign,
  deleteCampaign,
} from '@/lib/supabase/queries/campaigns'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

const CAMPAIGN_STATUSES = [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
] as const

type RouteContext = { params: Promise<{ id: string }> }

const updateCampaignSchema = z
  .object({
    name: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(CAMPAIGN_STATUSES).optional(),
    launch_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    offer_id: z.string().uuid().nullable().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => {
      if (data.launch_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.launch_date)
      }
      return true
    },
    { message: 'end_date must be on or after launch_date', path: ['end_date'] },
  )

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const client = createAdminClient()
    const { data: campaign, error } = await getCampaign(client, id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const client = createAdminClient()

    // Fetch existing campaign to check existence and capture previous_status
    const { data: existing, error: fetchError } = await getCampaign(client, id)
    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { meta: rawMeta, ...restUpdates } = parsed.data
    const updates = {
      ...restUpdates,
      ...(rawMeta !== undefined ? { meta: rawMeta as import('@/lib/supabase/types').Json } : {}),
    }
    const { data: campaign, error: updateError } = await updateCampaign(
      client,
      id,
      updates,
    )

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    const activityDetails: Record<string, unknown> = {}
    if (updates.status && updates.status !== existing.status) {
      activityDetails.previous_status = existing.status
      activityDetails.new_status = updates.status
    }

    await logActivity(client, {
      workspace_id: existing.workspace_id,
      actor_type: 'system',
      action: 'campaign.updated',
      entity_type: 'campaign',
      entity_id: id,
      summary: `Campaign updated: ${existing.name}`,
      details: activityDetails,
    })

    return NextResponse.json({ campaign })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const client = createAdminClient()

    // Fetch existing campaign to check existence and capture workspace_id for log
    const { data: existing, error: fetchError } = await getCampaign(client, id)
    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { error: deleteError } = await deleteCampaign(client, id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: existing.workspace_id,
      actor_type: 'system',
      action: 'campaign.deleted',
      entity_type: 'campaign',
      entity_id: id,
      summary: `Campaign deleted: ${existing.name}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
