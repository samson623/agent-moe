import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getTrendSignals,
  createTrendSignal,
} from '@/lib/supabase/queries/trend-signals'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { SignalMomentum } from '@/features/growth-engine/types'

const CreateSignalSchema = z.object({
  workspace_id: z.string().uuid(),
  topic: z.string().min(1).max(500),
  category: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  opportunity_score: z.number().int().min(0).max(100).optional(),
  audience_fit: z.number().min(0).max(1).optional(),
  momentum: z.enum(['explosive', 'rising', 'stable', 'falling']).optional(),
  platform: z.string().optional(),
  source_urls: z.array(z.string()).optional(),
  competitor_gaps: z.array(z.string()).optional(),
  market_angles: z.array(z.object({
    angle: z.string(),
    rationale: z.string(),
    cta_angle: z.string(),
  })).optional(),
  content_ideas: z.array(z.object({
    title: z.string(),
    format: z.string(),
    hook: z.string(),
    estimated_reach: z.enum(['low', 'medium', 'high', 'viral']).optional(),
  })).optional(),
  raw_research: z.record(z.unknown()).optional(),
  scanned_at: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const momentum = searchParams.get('momentum') as SignalMomentum | 'all' | null
    const category = searchParams.get('category') ?? undefined
    const platform = searchParams.get('platform') ?? undefined
    const minScore = searchParams.get('min_score') ? parseInt(searchParams.get('min_score')!, 10) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0
    const sort = searchParams.get('sort') as 'opportunity' | 'score' | 'recent' | null

    const client = await createAdminClient()
    const { data, error, total } = await getTrendSignals(client, workspaceId, {
      momentum: momentum ?? undefined,
      category,
      platform,
      minScore,
      limit,
      offset,
      sort: sort ?? 'opportunity',
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, count: total })
  } catch (err) {
    console.error('[GET /api/trend-signals]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = CreateSignalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { workspace_id, ...rest } = parsed.data
    const client = await createAdminClient()

    const { data, error } = await createTrendSignal(client, {
      workspace_id,
      ...rest,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: 'trend_signal_created',
      entity_type: 'trend_signal',
      entity_id: data?.id ?? '',
      summary: `Trend signal created: ${parsed.data.topic}`,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/trend-signals]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
