/**
 * Video Factory — Orchestrator Service
 *
 * Takes a single topic and produces 3 platform-optimized video packages
 * (TikTok, YouTube Shorts, Instagram Reels) in parallel.
 *
 * Pipeline per platform:
 * 1. Generate video package via VideoPackageOperator (Claude)
 * 2. Persist to DB via createVideoPackage
 * 3. Auto-fill scene images via prepareSceneImages (Pexels stock)
 * 4. Save scene images to metadata
 *
 * All 3 platforms run concurrently via Promise.allSettled.
 */

import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { createVideoPackage, updateVideoPackage } from '@/lib/supabase/queries/video-packages'
import type { VideoPackagePlatform } from '@/lib/supabase/queries/video-packages'
import { logActivity } from '@/lib/supabase/queries/activity'
import { VideoPackageOperator } from '@/features/video-packaging/video-package-operator'
import type { VideoPackageInput, VideoPackageOutput } from '@/features/video-packaging/types'
import { prepareSceneImages } from '@/features/video-rendering/services/stock-image-service'
import { writeCustomSceneImages } from '@/features/video-rendering/scene-image-metadata'
import type {
  VideoFactoryPlatform,
  VideoFactoryGenerateResponse,
} from '../types'
import { getMutation, applyMutation } from './prompt-mutations'
import { renderVideoPackage } from '@/features/video-rendering/services/render-service'
import { uploadRenderToStorage } from '@/features/video-rendering/services/render-storage'
import { readCustomSceneImages } from '@/features/video-rendering/scene-image-metadata'
import type { VideoCompositionProps } from '@/features/video-rendering/remotion/compositions/VideoPackageComposition'
import { getVideoPackage } from '@/lib/supabase/queries/video-packages'
import type { Database } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACTORY_PLATFORMS: VideoFactoryPlatform[] = ['tiktok', 'youtube', 'instagram']

/** Map Video Factory platforms to the operator's accepted platform type */
const OPERATOR_PLATFORM_MAP: Record<VideoFactoryPlatform, VideoPackageInput['platform']> = {
  tiktok: 'tiktok',
  youtube: 'youtube',
  instagram: 'instagram',
}

/** Map Video Factory platforms to DB platform type */
const DB_PLATFORM_MAP: Record<VideoFactoryPlatform, VideoPackagePlatform> = {
  tiktok: 'tiktok',
  youtube: 'youtube',
  instagram: 'instagram',
}

/** Render platform override — maps factory platforms to Remotion composition IDs */
const RENDER_PLATFORM_MAP: Record<VideoFactoryPlatform, string> = {
  tiktok: 'tiktok',
  youtube: 'youtube-shorts',
  instagram: 'instagram',
}

/** Default CTA type per platform */
const CTA_BY_PLATFORM: Record<VideoFactoryPlatform, string> = {
  tiktok: 'comment',
  youtube: 'subscribe',
  instagram: 'link_in_bio',
}

/** Minimum confidence score to accept a generation without retrying */
const CONFIDENCE_THRESHOLD = 0.65

/** Maximum mutation attempts before accepting whatever we have */
const MAX_MUTATION_ATTEMPTS = 2

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateBatchId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function computeSceneCount(durationSeconds: number): number {
  // ~8 seconds per scene is a good baseline for short-form
  const count = Math.round(durationSeconds / 8)
  return Math.max(2, Math.min(count, 8))
}

// ---------------------------------------------------------------------------
// Fallback package (used when operator + retries all fail)
// ---------------------------------------------------------------------------

function buildFallbackPackage(
  topic: string,
  platform: VideoFactoryPlatform,
  durationSeconds: number,
  tone: string,
  error: string,
): VideoPackageOutput {
  const sceneCount = computeSceneCount(durationSeconds)
  const sceneDuration = Math.round(durationSeconds / sceneCount)

  const scenes = Array.from({ length: sceneCount }, (_, i) => {
    const order = i + 1
    if (order === 1) {
      return {
        order,
        title: 'Hook',
        script: `Here is what most people get wrong about ${topic} — and what actually works.`,
        visual_direction: `Bold text reveal about ${topic} with fast zoom, high contrast background`,
        duration_seconds: sceneDuration,
      }
    }
    if (order === sceneCount) {
      return {
        order,
        title: 'Takeaway',
        script: `That is the simplest way to make ${topic} work. Try it today.`,
        visual_direction: `Clean frame with single CTA card, strong contrast, minimal text`,
        duration_seconds: sceneDuration,
      }
    }
    return {
      order,
      title: `Point ${order - 1}`,
      script: `One key insight about ${topic} that makes the biggest difference.`,
      visual_direction: `Visual example related to ${topic} with text overlay on ${platform}`,
      duration_seconds: sceneDuration,
    }
  })

  return {
    title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} — Quick breakdown`,
    platform,
    hook: {
      primary: `Here is the simplest way to make ${topic} work for you.`,
      variants: [
        `Most people overcomplicate ${topic}. Here is what actually works.`,
        `Stop guessing on ${topic}. Use this instead.`,
      ],
    },
    scenes,
    thumbnail_concept: {
      headline: topic.split(' ').slice(0, 4).join(' '),
      visual_description: `High-contrast image related to ${topic}`,
      color_scheme: 'Deep navy background with bright cyan accent and white text',
      text_overlay: 'Simple breakdown, real examples',
    },
    caption: `A quick breakdown of ${topic} with steps you can use today. #${platform} #contentstrategy`,
    cta: {
      text: 'Follow for more practical breakdowns.',
      type: CTA_BY_PLATFORM[platform] as VideoPackageOutput['cta']['type'],
    },
    confidence_score: 0.5,
    rationale: `Fallback package — primary generation failed: ${error}`,
  }
}

// ---------------------------------------------------------------------------
// Single-platform generation
// ---------------------------------------------------------------------------

interface PlatformResult {
  platform: VideoFactoryPlatform
  packageId: string
  confidenceScore: number | null
  error: string | null
}

async function generateForPlatform(
  topic: string,
  platform: VideoFactoryPlatform,
  durationSeconds: number,
  tone: string,
  workspaceId: string,
): Promise<PlatformResult> {
  const operator = new VideoPackageOperator()
  const client = createAdminClient()
  const sceneCount = computeSceneCount(durationSeconds)

  // --- Step 1: Generate video package via Claude ---
  const operatorInput: VideoPackageInput = {
    topic,
    platform: OPERATOR_PLATFORM_MAP[platform],
    tone,
    scene_count: sceneCount,
    hook_count: 3,
  }

  let output: VideoPackageOutput
  let generatedBy: 'video_package_operator' | 'video_package_fallback' = 'video_package_operator'
  let tokensUsed: number | undefined
  let durationMs: number | undefined
  let mutationUsed: string | null = null

  // --- Quality loop: generate → score → mutate if below threshold ---
  let bestOutput: VideoPackageOutput | null = null
  let bestScore = -1
  let currentInput = operatorInput
  const totalAttempts = 1 + MAX_MUTATION_ATTEMPTS // initial + retries

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    try {
      const result = await operator.generateVideoPackage(currentInput)

      if (result.success) {
        const score = result.data.confidence_score ?? 0

        // Track best result across all attempts
        if (score > bestScore) {
          bestScore = score
          bestOutput = result.data
          tokensUsed = result.tokensUsed
          durationMs = result.durationMs
        }

        // Accept if above threshold — no need to retry
        if (score >= CONFIDENCE_THRESHOLD) {
          console.log(`[VideoFactory] ${platform} attempt ${attempt + 1}: score ${score.toFixed(2)} >= ${CONFIDENCE_THRESHOLD} — accepted`)
          break
        }

        console.log(`[VideoFactory] ${platform} attempt ${attempt + 1}: score ${score.toFixed(2)} < ${CONFIDENCE_THRESHOLD} — will mutate`)
      } else {
        console.warn(`[VideoFactory] ${platform} attempt ${attempt + 1} failed: ${result.error.message}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.warn(`[VideoFactory] ${platform} attempt ${attempt + 1} threw: ${message}`)
    }

    // Mutate for next attempt (if we haven't exhausted retries)
    if (attempt < totalAttempts - 1) {
      const mutation = getMutation(attempt + 1, tone, platform, topic)
      currentInput = applyMutation(operatorInput, mutation)
      mutationUsed = mutation.description
      console.log(`[VideoFactory] ${platform}: applying mutation — ${mutation.description}`)
    }
  }

  // Use best result across all attempts, or fallback
  if (bestOutput) {
    output = bestOutput
  } else {
    output = buildFallbackPackage(topic, platform, durationSeconds, tone, 'All generation attempts failed')
    generatedBy = 'video_package_fallback'
  }

  // --- Step 2: Persist to DB ---
  const { data: pkg, error: dbError } = await createVideoPackage(client, {
    workspace_id: workspaceId,
    title: output.title,
    platform: DB_PLATFORM_MAP[platform],
    hook: { primary: output.hook.primary, variants: output.hook.variants },
    scenes: output.scenes.map((s) => ({
      order: s.order,
      title: s.title,
      script: s.script,
      visual_direction: s.visual_direction,
      duration_seconds: s.duration_seconds,
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
      generated_by: generatedBy,
      video_factory: true,
      render_platform: RENDER_PLATFORM_MAP[platform],
      topic,
      tone,
      duration_seconds: durationSeconds,
      scene_count: output.scenes.length,
      hook_count: output.hook.variants.length + 1,
      generation_version: '1.0.0',
      rationale: output.rationale,
      mutation_used: mutationUsed,
      tokens_used: tokensUsed,
      duration_ms: durationMs,
    },
  })

  if (dbError || !pkg) {
    return {
      platform,
      packageId: '',
      confidenceScore: null,
      error: dbError ?? 'Failed to save video package',
    }
  }

  // --- Step 3: Auto-fill scene images ---
  try {
    const sceneImages = await prepareSceneImages(
      pkg.scenes.map((s) => ({ visual_direction: s.visual_direction })),
      pkg.platform,
    )

    // sceneImages layout: [hookImage, thumbnailImage, ...sceneImages, ctaImage]
    const sceneOnly = sceneImages.slice(2, 2 + pkg.scenes.length)
    const imageGroups = sceneOnly.map((url) => (url ? [url] : []))
    const metadata = writeCustomSceneImages(pkg.metadata, imageGroups)

    await updateVideoPackage(client, pkg.id, workspaceId, { metadata })
  } catch (imgErr) {
    // Non-fatal — videos can render without images
    console.warn(`[VideoFactory] Image fill failed for ${platform}/${pkg.id}:`, imgErr)
  }

  // --- Step 4: Log activity ---
  await logActivity(client, {
    workspace_id: workspaceId,
    actor_type: 'system',
    action: 'video_factory.package_generated',
    entity_type: 'video_package',
    entity_id: pkg.id,
    summary: `Video Factory: ${platform} package generated for "${topic}"`,
    details: {
      platform,
      topic,
      tone,
      duration_seconds: durationSeconds,
      confidence_score: output.confidence_score,
      generated_by: generatedBy,
    },
  }).catch(() => {})

  return {
    platform,
    packageId: pkg.id,
    confidenceScore: output.confidence_score,
    error: null,
  }
}

// ---------------------------------------------------------------------------
// Auto-render a single package (fire-and-forget background task)
// ---------------------------------------------------------------------------

async function renderPackage(
  packageId: string,
  workspaceId: string,
): Promise<void> {
  const client = createAdminClient()

  // Fetch the package we just created
  const { data: pkg, error } = await getVideoPackage(client, packageId, workspaceId)
  if (error || !pkg) {
    console.error(`[VideoFactory] Cannot render — package ${packageId} not found`)
    return
  }

  // Use render_platform from metadata (e.g. youtube-shorts) or fall back to DB platform
  const meta = pkg.metadata as Record<string, unknown>
  const renderPlatform = (typeof meta.render_platform === 'string' ? meta.render_platform : pkg.platform)

  // Mark as rendering
  await updateVideoPackage(client, packageId, workspaceId, {
    metadata: {
      ...meta,
      render_status: 'rendering',
      render_progress: 0,
      render_error: null,
    },
  })

  try {
    const customSceneImages = readCustomSceneImages(pkg.metadata, pkg.scenes.length)

    const inputProps: VideoCompositionProps = {
      title: pkg.title,
      platform: renderPlatform,
      hook: pkg.hook,
      scenes: pkg.scenes,
      thumbnailConcept: pkg.thumbnail_concept,
      caption: pkg.caption,
      cta: pkg.cta,
    }

    const result = await renderVideoPackage({
      videoPackageId: packageId,
      platform: renderPlatform,
      inputProps,
      customSceneImages,
      onProgress: async (progress) => {
        if (progress % 25 === 0) {
          const { data: current } = await getVideoPackage(client, packageId, workspaceId)
          const freshMeta = (current?.metadata ?? meta) as Record<string, unknown>
          await updateVideoPackage(client, packageId, workspaceId, {
            metadata: { ...freshMeta, render_status: 'rendering', render_progress: progress },
          }).catch(() => {})
        }
      },
    })

    // Upload to storage
    const renderUrl = await uploadRenderToStorage(result.outputPath, packageId, workspaceId)

    // Read fresh metadata and mark completed
    const { data: latest } = await getVideoPackage(client, packageId, workspaceId)
    const latestMeta = (latest?.metadata ?? meta) as Record<string, unknown>

    await updateVideoPackage(client, packageId, workspaceId, {
      metadata: {
        ...latestMeta,
        render_status: 'completed',
        render_progress: 100,
        render_url: renderUrl,
        render_error: null,
        rendered_at: new Date().toISOString(),
        render_duration_ms: result.durationMs,
      },
    })

    console.log(`[VideoFactory] Render complete for ${packageId} (${renderPlatform}): ${renderUrl}`)

    // Create approval record for user review
    try {
      const approval: Database['public']['Tables']['approvals']['Insert'] = {
        workspace_id: workspaceId,
        asset_id: null,
        status: 'pending',
        risk_level: 'low',
        risk_flags: [],
        notes: `Video Factory render — ${renderPlatform}. Package: ${packageId}. URL: ${renderUrl}`,
      }

      await client
        .from('approvals')
        .insert(approval)

      console.log(`[VideoFactory] Approval created for ${packageId}`)
    } catch (approvalErr) {
      // Non-fatal — video is still rendered even if approval creation fails
      console.warn(`[VideoFactory] Failed to create approval for ${packageId}:`, approvalErr)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown render error'
    console.error(`[VideoFactory] Render failed for ${packageId}:`, message)

    const { data: latest } = await getVideoPackage(client, packageId, workspaceId).catch(() => ({ data: null }))
    const latestMeta = (latest?.metadata ?? meta) as Record<string, unknown>

    await updateVideoPackage(client, packageId, workspaceId, {
      metadata: {
        ...latestMeta,
        render_status: 'failed',
        render_progress: 0,
        render_error: message,
      },
    }).catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export interface VideoFactoryOptions {
  topic: string
  durationSeconds?: number
  tone?: string
  workspaceId: string
  platforms?: ('tiktok' | 'youtube' | 'instagram')[]
}

export async function generateVideoFactoryBatch(
  options: VideoFactoryOptions,
): Promise<VideoFactoryGenerateResponse> {
  const {
    topic,
    durationSeconds = 30,
    tone = 'educational',
    workspaceId,
    platforms,
  } = options

  const targetPlatforms: VideoFactoryPlatform[] = platforms ?? FACTORY_PLATFORMS

  const batchId = generateBatchId()

  console.log('[VideoFactory] Starting batch generation', {
    batchId,
    topic: topic.slice(0, 80),
    durationSeconds,
    tone,
    platforms: targetPlatforms,
  })

  const start = Date.now()

  // Run selected platforms in parallel
  const results = await Promise.allSettled(
    targetPlatforms.map((platform) =>
      generateForPlatform(topic, platform, durationSeconds, tone, workspaceId),
    ),
  )

  const packages: VideoFactoryGenerateResponse['packages'] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const r = result.value
      if (r.error) {
        console.error(`[VideoFactory] ${r.platform} failed: ${r.error}`)
      } else {
        packages.push({
          platform: r.platform,
          packageId: r.packageId,
          confidenceScore: r.confidenceScore,
        })
      }
    } else {
      console.error(`[VideoFactory] Platform generation rejected:`, result.reason)
    }
  }

  const elapsed = Date.now() - start
  console.log('[VideoFactory] Batch complete', {
    batchId,
    succeeded: packages.length,
    failed: targetPlatforms.length - packages.length,
    elapsed: `${(elapsed / 1000).toFixed(1)}s`,
  })

  // --- Fire-and-forget: trigger renders for all successful packages ---
  // Renders run in background — the API response returns immediately with package IDs.
  // Client polls /api/video-factory/[batchId]/status for render progress.
  for (const pkg of packages) {
    renderPackage(pkg.packageId, workspaceId).catch((err) => {
      console.error(`[VideoFactory] Background render failed for ${pkg.packageId}:`, err)
    })
  }

  // Log batch-level activity
  const client = createAdminClient()
  await logActivity(client, {
    workspace_id: workspaceId,
    actor_type: 'system',
    action: 'video_factory.batch_completed',
    entity_type: 'video_package',
    entity_id: batchId,
    summary: `Video Factory: ${packages.length}/3 packages generated for "${topic}" in ${(elapsed / 1000).toFixed(1)}s`,
    details: {
      batch_id: batchId,
      topic,
      tone,
      duration_seconds: durationSeconds,
      packages_succeeded: packages.length,
      packages_failed: FACTORY_PLATFORMS.length - packages.length,
      elapsed_ms: elapsed,
    },
  }).catch(() => {})

  return { batchId, topic, packages }
}
