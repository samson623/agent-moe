import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getVideoPackages, createVideoPackage } from '@/lib/supabase/queries/video-packages'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { VideoPackagePlatform, VideoPackageStatus } from '@/lib/supabase/queries/video-packages'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const PLATFORMS = ['x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'email', 'universal'] as const

const hookSchema = z.object({
  primary: z.string().min(1),
  variants: z.array(z.string()),
})

const sceneSchema = z.object({
  order: z.number().int().nonnegative(),
  title: z.string().min(1),
  script: z.string().min(1),
  visual_direction: z.string().min(1),
  duration_seconds: z.number().nonnegative(),
})

const thumbnailConceptSchema = z.object({
  headline: z.string().min(1),
  visual_description: z.string().min(1),
  color_scheme: z.string().min(1),
  text_overlay: z.string(),
})

const ctaSchema = z.object({
  text: z.string().min(1),
  type: z.string().min(1),
  destination: z.string().optional(),
})

const createVideoPackageSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  platform: z.enum(PLATFORMS),
  hook: hookSchema,
  scenes: z.array(sceneSchema),
  thumbnail_concept: thumbnailConceptSchema,
  caption: z.string().optional(),
  cta: ctaSchema.optional(),
  mission_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ---------------------------------------------------------------------------
// GET /api/video-packages
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const platform = searchParams.get('platform') as VideoPackagePlatform | null
    const status = searchParams.get('status') as VideoPackageStatus | null
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? '20')))

    const client = createAdminClient()

    const { data, error, total } = await getVideoPackages(
      client,
      workspaceId,
      {
        ...(platform ? { platform } : {}),
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      },
      { page, pageSize },
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, total, page })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/video-packages
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createVideoPackageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const {
      workspace_id,
      title,
      platform,
      hook,
      scenes,
      thumbnail_concept,
      caption,
      cta,
      mission_id,
      asset_id,
      confidence_score,
      metadata,
    } = parsed.data

    const client = createAdminClient()

    const { data, error } = await createVideoPackage(client, {
      workspace_id,
      title,
      platform,
      hook,
      scenes,
      thumbnail_concept,
      caption: caption ?? null,
      cta: cta ?? null,
      mission_id: mission_id ?? null,
      asset_id: asset_id ?? null,
      confidence_score: confidence_score ?? null,
      metadata: metadata ?? {},
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Failed to create video package' }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: 'video_package_created',
      entity_type: 'video_package',
      entity_id: data.id,
      summary: `Video package created: "${title}" for ${platform}`,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
