import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getCampaigns,
  createCampaign,
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

type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

const createCampaignSchema = z
  .object({
    workspace_id: z.string().uuid(),
    name: z.string().min(1).max(500),
    description: z.string().max(5000).optional().default(''),
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

    // Validate workspace_id is a UUID
    const uuidResult = z.string().uuid().safeParse(workspaceId)
    if (!uuidResult.success) {
      return NextResponse.json(
        { error: 'workspace_id must be a valid UUID' },
        { status: 400 },
      )
    }

    const statusParam = searchParams.get('status') as CampaignStatus | null
    if (statusParam && !CAMPAIGN_STATUSES.includes(statusParam)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${CAMPAIGN_STATUSES.join(', ')}`,
        },
        { status: 400 },
      )
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20),
    )

    const client = createAdminClient()
    const { data, error } = await getCampaigns(
      client,
      workspaceId,
      {
        ...(statusParam && { status: statusParam }),
      },
      { page, pageSize: limit },
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      campaigns: data!.data,
      total: data!.count,
      page: data!.page,
      limit: data!.pageSize,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const {
      workspace_id,
      name,
      description,
      launch_date,
      end_date,
      offer_id,
      meta,
    } = parsed.data

    const client = createAdminClient()
    const { data: campaign, error } = await createCampaign(client, {
      workspace_id,
      name,
      description: description ?? '',
      ...(launch_date !== undefined ? { launch_date } : {}),
      ...(end_date !== undefined ? { end_date } : {}),
      ...(offer_id !== undefined ? { offer_id } : {}),
      ...(meta !== undefined ? { meta: meta as import('@/lib/supabase/types').Json } : {}),
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: 'campaign.created',
      entity_type: 'campaign',
      entity_id: campaign!.id,
      summary: `Campaign created: ${name}`,
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
