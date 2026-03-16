import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VideoFactoryGenerateSchema } from '@/features/video-factory/types'
import { generateVideoFactoryBatch } from '@/features/video-factory/services/video-factory'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/video-factory/generate
//
// Takes a single topic and generates 3 video packages in parallel
// (TikTok, YouTube Shorts, Instagram Reels).
//
// Request body:
//   workspace_id: string (uuid)
//   topic: string (1-500 chars)
//   duration_seconds?: number (10-180, default 30)
//   tone?: string (default 'educational')
//
// Response: { batchId, topic, packages: [{ platform, packageId, confidenceScore }] }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // --- Auth check ---
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // --- Parse + validate body ---
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = VideoFactoryGenerateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id, topic, duration_seconds, tone, platforms } = parsed.data

    // --- Verify workspace ownership ---
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // --- Generate 3 video packages ---
    const result = await generateVideoFactoryBatch({
      topic,
      durationSeconds: duration_seconds,
      tone,
      workspaceId: workspace_id,
      platforms,
    })

    if (result.packages.length === 0) {
      return NextResponse.json(
        { error: 'All 3 platform generations failed. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[video-factory/generate] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
