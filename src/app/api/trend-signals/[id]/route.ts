import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getTrendSignal,
  updateTrendSignal,
  deleteTrendSignal,
} from '@/lib/supabase/queries/trend-signals'

export const dynamic = 'force-dynamic'

const UpdateSignalSchema = z.object({
  workspace_id: z.string().uuid(),
  topic: z.string().min(1).max(500).optional(),
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
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const client = await createAdminClient()
    const { data, error } = await getTrendSignal(client, id, workspaceId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/trend-signals/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body: unknown = await request.json()
    const parsed = UpdateSignalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { workspace_id, ...updates } = parsed.data
    const client = await createAdminClient()
    const { data, error } = await updateTrendSignal(client, id, workspace_id, updates)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[PATCH /api/trend-signals/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const client = await createAdminClient()
    const { error } = await deleteTrendSignal(client, id, workspaceId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/trend-signals/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
