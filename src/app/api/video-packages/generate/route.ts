import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { createVideoPackage } from '@/lib/supabase/queries/video-packages'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { VideoPackagePlatform } from '@/lib/supabase/queries/video-packages'
import { VideoPackageOperator } from '@/features/video-packaging/video-package-operator'
import type { VideoPackageInput, VideoPackageOutput } from '@/features/video-packaging/types'

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

const CTA_BY_PLATFORM: Record<VideoPackagePlatform, VideoPackageOutput['cta']['type']> = {
  x: 'comment',
  linkedin: 'comment',
  instagram: 'link_in_bio',
  tiktok: 'comment',
  youtube: 'subscribe',
  email: 'visit',
  universal: 'subscribe',
}

interface GenerationOutcome {
  output: VideoPackageOutput
  generatedBy: 'video_package_operator' | 'video_package_fallback'
  durationMs: number | undefined
  tokensUsed: number | undefined
  fallbackReason?: string
}

function sentenceCase(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'Untitled'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function buildHookVariants(topic: string, platform: VideoPackagePlatform, hookCount: number): string[] {
  const variants = [
    `Most people overcomplicate ${topic}. Here is the version that actually works on ${platform}.`,
    `If you want better results from ${topic}, start with this before you buy another tool.`,
    `This is the fastest way to turn ${topic} into something you can publish this week.`,
    `Stop guessing on ${topic}. Use this simple framework instead.`,
  ]

  return variants.slice(0, Math.max(0, hookCount - 1))
}

function buildFallbackVideoPackage(
  input: VideoPackageInput,
  dbPlatform: VideoPackagePlatform,
  fallbackReason: string,
): VideoPackageOutput {
  const sceneCount = Math.max(1, input.scene_count ?? 4)
  const scenes = Array.from({ length: sceneCount }, (_, index) => {
    const order = index + 1

    if (order === 1) {
      return {
        order,
        title: 'Hook and context',
        script: `Start with the core tension around ${input.topic}. Explain why this matters right now and what the viewer will get by staying through the full video.`,
        visual_direction: `Open with bold on-screen text about ${input.topic}, a fast punch-in, and one visual example that makes the problem obvious in under three seconds.`,
        duration_seconds: 8,
      }
    }

    if (order === sceneCount) {
      return {
        order,
        title: 'Takeaway and action',
        script: `Summarize the strongest lesson from ${input.topic}, restate the payoff in plain language, and close with one clear next step the viewer can take today.`,
        visual_direction: `Shift to a cleaner frame with a simple checklist, highlight the result, and end on a single CTA card with strong contrast.`,
        duration_seconds: 8,
      }
    }

    return {
      order,
      title: `Key point ${order - 1}`,
      script: `Break down one practical insight about ${input.topic}. Keep the narration direct, specific, and easy to say out loud in a ${input.tone ?? 'clear'} tone.`,
      visual_direction: `Show one concrete visual example for ${input.topic}, combine it with short text overlays, and keep the pacing fast enough for ${dbPlatform}.`,
      duration_seconds: 10,
    }
  })

  const hookPrimary = `Here is the simplest way to make ${input.topic} work for you without wasting another week.`
  const hookVariants = buildHookVariants(input.topic, dbPlatform, input.hook_count ?? 3)

  return {
    title: `${sentenceCase(input.topic)}: ${sceneCount} steps that actually work`,
    platform: dbPlatform,
    hook: {
      primary: hookPrimary,
      variants: hookVariants,
    },
    scenes,
    thumbnail_concept: {
      headline: sentenceCase(input.topic).split(' ').slice(0, 4).join(' '),
      visual_description: `High-contrast close-up tied to ${input.topic}, with one clear focal point and enough empty space for text.`,
      color_scheme: 'Deep navy background with bright cyan accent and white headline text',
      text_overlay: 'Simple breakdown, real examples, no fluff',
    },
    caption: `A clean, publish-ready breakdown of ${input.topic} with simple steps you can apply immediately. #${input.platform} #contentstrategy #aiworkflow`,
    cta: {
      text: 'Follow for more practical breakdowns like this.',
      type: CTA_BY_PLATFORM[dbPlatform],
      destination: dbPlatform === 'youtube' ? 'Channel subscription' : undefined,
    },
    confidence_score: 0.58,
    rationale: `Fallback package used because the primary AI generation path failed: ${fallbackReason}`,
  }
}

async function generateWithResilience(
  input: VideoPackageInput,
  dbPlatform: VideoPackagePlatform,
): Promise<GenerationOutcome> {
  const operator = new VideoPackageOperator()
  const maxAttempts = 2
  let lastError = 'Unknown operator error'

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await operator.generateVideoPackage(input)

      if (result.success) {
        return {
          output: result.data,
          generatedBy: 'video_package_operator',
          durationMs: result.durationMs,
          tokensUsed: result.tokensUsed,
        }
      }

      lastError = result.error.message
      console.warn('[video-package-generate] operator attempt failed', {
        attempt,
        error: result.error.message,
      })
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown operator error'
      console.warn('[video-package-generate] operator attempt threw', {
        attempt,
        error: lastError,
      })
    }
  }

  return {
    output: buildFallbackVideoPackage(input, dbPlatform, lastError),
    generatedBy: 'video_package_fallback',
    durationMs: undefined,
    tokensUsed: undefined,
    fallbackReason: lastError,
  }
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

    const generation = await generateWithResilience(operatorInput, platform)
    const output = generation.output

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
        generated_by: generation.generatedBy,
        topic,
        tone,
        scene_count: output.scenes.length,
        hook_count: output.hook.variants.length + 1,
        generation_version: '1.0.1',
        rationale: output.rationale,
        tokens_used: generation.tokensUsed,
        duration_ms: generation.durationMs,
        fallback_reason: generation.fallbackReason,
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
      summary: `Video package generated for topic "${topic}" on ${platform} via ${generation.generatedBy}`,
      details: {
        topic,
        platform,
        tone,
        scene_count: output.scenes.length,
        hook_count: output.hook.variants.length + 1,
        confidence_score: output.confidence_score,
        mission_id: mission_id ?? null,
        generated_by: generation.generatedBy,
        fallback_reason: generation.fallbackReason ?? null,
      },
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
