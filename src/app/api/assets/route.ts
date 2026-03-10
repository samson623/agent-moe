import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAssets, createAsset } from '@/lib/supabase/queries/assets'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { AssetStatus, AssetType, Platform, OperatorTeam } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const ASSET_TYPES: AssetType[] = [
  'post', 'thread', 'script', 'caption', 'cta',
  'thumbnail_concept', 'carousel', 'video_concept', 'email', 'report',
]
const PLATFORMS: Platform[] = [
  'x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'email', 'universal',
]
const ASSET_STATUSES: AssetStatus[] = [
  'draft', 'review', 'approved', 'published', 'archived', 'rejected',
]
const OPERATOR_TEAMS: OperatorTeam[] = [
  'content_strike', 'growth_operator', 'revenue_closer', 'brand_guardian',
]

const createAssetSchema = z.object({
  workspace_id: z.string().uuid(),
  type: z.enum(['post', 'thread', 'script', 'caption', 'cta', 'thumbnail_concept', 'carousel', 'video_concept', 'email', 'report']),
  platform: z.enum(['x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'email', 'universal']).optional().default('universal'),
  title: z.string().max(500).nullable().optional().default(null),
  body: z.string().min(1),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived', 'rejected']).optional().default('draft'),
  mission_id: z.string().uuid().nullable().optional().default(null),
  metadata: z.record(z.unknown()).optional().default({}),
  confidence_score: z.number().min(0).max(1).nullable().optional().default(null),
  operator_team: z.enum(['content_strike', 'growth_operator', 'revenue_closer', 'brand_guardian']).optional().default('content_strike'),
})

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

    const statusParam = searchParams.get('status') as AssetStatus | null
    if (statusParam && !ASSET_STATUSES.includes(statusParam)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ASSET_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const typeParam = searchParams.get('type') as AssetType | null
    if (typeParam && !ASSET_TYPES.includes(typeParam)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${ASSET_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    const platformParam = searchParams.get('platform') as Platform | null
    if (platformParam && !PLATFORMS.includes(platformParam)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${PLATFORMS.join(', ')}` },
        { status: 400 },
      )
    }

    const operatorTeamParam = searchParams.get('operator_team') as OperatorTeam | null
    if (operatorTeamParam && !OPERATOR_TEAMS.includes(operatorTeamParam)) {
      return NextResponse.json(
        { error: `Invalid operator_team. Must be one of: ${OPERATOR_TEAMS.join(', ')}` },
        { status: 400 },
      )
    }

    const missionId = searchParams.get('mission_id') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20))

    const client = createAdminClient()
    const { data, error } = await getAssets(
      client,
      workspaceId,
      {
        ...(statusParam && { status: statusParam }),
        ...(typeParam && { type: typeParam }),
        ...(platformParam && { platform: platformParam }),
        ...(operatorTeamParam && { operator_team: operatorTeamParam }),
        ...(missionId && { mission_id: missionId }),
        ...(search && { search }),
      },
      { page, pageSize },
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      data: data!.data,
      count: data!.count,
      page: data!.page,
      pageSize: data!.pageSize,
      totalPages: data!.totalPages,
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

    const parsed = createAssetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const client = createAdminClient()
    const { confidence_score: rawScore, operator_team: rawTeam, metadata: rawMeta, title: rawTitle, ...restData } = parsed.data
    const assetInput = {
      ...restData,
      title: rawTitle ?? 'Untitled',
      operator_team: rawTeam ?? 'content_strike' as const,
      ...(rawScore !== null && rawScore !== undefined ? { confidence_score: rawScore } : {}),
      ...(rawMeta !== undefined ? { metadata: rawMeta as import('@/lib/supabase/types').Json } : {}),
    }
    const { data: asset, error } = await createAsset(client, assetInput)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: parsed.data.workspace_id,
      actor_type: 'system',
      action: 'asset.created',
      entity_type: 'asset',
      entity_id: asset!.id,
      summary: `Asset created: ${asset!.title ?? asset!.type} (${asset!.platform})`,
    })

    return NextResponse.json({ data: asset }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
