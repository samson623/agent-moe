import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { createVideoPackage } from '@/lib/supabase/queries/video-packages'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { VideoPackagePlatform } from '@/lib/supabase/queries/video-packages'
import { VideoPackageOperator } from '@/features/video-packaging/video-package-operator'
import type { VideoPackageInput } from '@/features/video-packaging/types'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const PLATFORMS = ['x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'email', 'universal'] as const

const generateSchema = z.object({
  workspace_id: z.string().uuid(),
  topic: z.string().min(1).max(500),
  platform: z.enum(PLATFORMS),
  tone: z.string().optional(),
  scene_count: z.number().int().min(1).max(10).optional(),
  hook_count: z.number().int().min(1).max(5).optional(),
  mission_id: z.string().uuid().optional(),
})

// ---------------------------------------------------------------------------
// Platform compatibility
//
// VideoPackageInput.platform only accepts the four video-native platforms.
// linkedin, email, and universal are valid for the DB/route but the operator
// maps them to a sensible fallback so generation still succeeds.
// ---------------------------------------------------------------------------

type OperatorPlatform = VideoPackageInput['platform']

const OPERATOR_PLATFORM_MAP: Record<VideoPackagePlatform, OperatorPlatform> = {
  tiktok: 'tiktok',
  instagram: 'instagram',
  youtube: 'youtube',
  x: 'x',
  linkedin: 'x',        // closest native equivalent for operator prompting
  email: 'youtube',     // long-form, closest equivalent
  universal: 'youtube', // generic fallback
}

// ---------------------------------------------------------------------------
// POST /api/video-packages/generate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const {
      workspace_id,
      topic,
      platform,
      tone = 'educational',
      scene_count = 4,
      hook_count = 3,
      mission_id,
    } = parsed.data

    // -------------------------------------------------------------------------
    // AI generation — VideoPackageOperator (Content Strike Team)
    // Claude handles the full creative pass: hook variants, scene breakdown,
    // thumbnail concept, caption, and CTA in a single structured output.
    // -------------------------------------------------------------------------

    const operatorInput: VideoPackageInput = {
      topic,
      platform: OPERATOR_PLATFORM_MAP[platform],
      tone,
      hook_count,
      scene_count,
    }

    const operator = new VideoPackageOperator()

    let operatorResult
    try {
      operatorResult = await operator.generateVideoPackage(operatorInput)
    } catch (err) {
      const details = err instanceof Error ? err.message : 'Unknown operator error'
      return NextResponse.json(
        { error: 'Video package generation failed', details },
        { status: 500 },
      )
    }

    if (!operatorResult.success) {
      return NextResponse.json(
        {
          error: 'Video package generation failed',
          details: operatorResult.error.message,
        },
        { status: 500 },
      )
    }

    const output = operatorResult.data

    const client = createAdminClient()

    const { data, error } = await createVideoPackage(client, {
      workspace_id,
      mission_id: mission_id ?? null,
      title: output.title,
      platform,
      hook: {
        primary: output.hook.primary,
        variants: output.hook.variants,
      },
      scenes: output.scenes.map((scene) => ({
        order: scene.order,
        title: scene.title,
        script: scene.script,
        visual_direction: scene.visual_direction,
        duration_seconds: scene.duration_seconds,
        ...(scene.image_url ? { image_url: scene.image_url } : {}),
      })),
      thumbnail_concept: {
        headline: output.thumbnail_concept.headline,
        visual_description: output.thumbnail_concept.visual_description,
        color_scheme: output.thumbnail_concept.color_scheme,
        text_overlay: output.thumbnail_concept.text_overlay,
      },
      caption: output.caption,
      cta: {
        text: output.cta.text,
        type: output.cta.type,
        destination: output.cta.destination,
      },
      status: 'draft',
      confidence_score: output.confidence_score,
      metadata: {
        generated_by: 'video_package_operator',
        topic,
        tone,
        scene_count: output.scenes.length,
        hook_count: output.hook.variants.length + 1,
        generation_version: '1.0.0',
        rationale: output.rationale,
        tokens_used: operatorResult.tokensUsed,
        duration_ms: operatorResult.durationMs,
      },
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Failed to save video package' }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: 'video_package_generated',
      entity_type: 'video_package',
      entity_id: data.id,
      summary: `Video package generated for topic "${topic}" on ${platform} via VideoPackageOperator`,
      details: {
        topic,
        platform,
        tone,
        scene_count: output.scenes.length,
        hook_count: output.hook.variants.length + 1,
        confidence_score: output.confidence_score,
        mission_id: mission_id ?? null,
      },
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
