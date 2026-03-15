import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getVideoPackage, updateVideoPackage } from '@/lib/supabase/queries/video-packages'
import { renderVideoPackage } from '@/features/video-rendering/services/render-service'
import { uploadRenderToStorage } from '@/features/video-rendering/services/render-storage'
import type { VideoCompositionProps } from '@/features/video-rendering/remotion/compositions/VideoPackageComposition'
import { readCustomSceneImages } from '@/features/video-rendering/scene-image-metadata'

export const dynamic = 'force-dynamic'

/**
 * POST /api/video-packages/[id]/render
 * Trigger an async video render for this package.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { workspace_id } = body

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const client = await createAdminClient()

    // Fetch the video package
    const { data: pkg, error: fetchError } = await getVideoPackage(client, id, workspace_id)

    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }

    if (!pkg) {
      return NextResponse.json({ error: 'Video package not found' }, { status: 404 })
    }

    // Guard: don't allow concurrent renders
    const currentStatus = (pkg.metadata as Record<string, unknown>)?.render_status
    if (currentStatus === 'rendering') {
      return NextResponse.json({ error: 'Render already in progress' }, { status: 409 })
    }

    // Mark as rendering
    await updateVideoPackage(client, id, workspace_id, {
      metadata: {
        ...pkg.metadata,
        render_status: 'rendering',
        render_progress: 0,
        render_error: null,
      },
    })

    // Build input props from the package data
    const inputProps: VideoCompositionProps = {
      title: pkg.title,
      platform: pkg.platform,
      hook: pkg.hook,
      scenes: pkg.scenes,
      thumbnailConcept: pkg.thumbnail_concept,
      caption: pkg.caption,
      cta: pkg.cta,
    }

    // Fire-and-forget: render in background
    ;(async () => {
      try {
        const customSceneImages = readCustomSceneImages(pkg.metadata, pkg.scenes.length)
        console.log(
          '[video-render] Starting render with custom scene images:',
          JSON.stringify(customSceneImages),
        )

        const result = await renderVideoPackage({
          videoPackageId: id,
          platform: pkg.platform,
          inputProps,
          customSceneImages,
          onProgress: async (progress) => {
            // Update progress in metadata (throttled — every 10%)
            if (progress % 10 === 0) {
              // Re-read current metadata to avoid overwriting concurrent changes
              const { data: current } = await getVideoPackage(client, id, workspace_id)
              const freshMeta = (current?.metadata ?? pkg.metadata) as Record<string, unknown>
              await updateVideoPackage(client, id, workspace_id, {
                metadata: {
                  ...freshMeta,
                  render_status: 'rendering',
                  render_progress: progress,
                },
              }).catch(() => {})
            }
          },
        })

        // Upload to storage
        const renderUrl = await uploadRenderToStorage(
          result.outputPath,
          id,
          workspace_id,
        )

        // Re-read current metadata before final update to preserve any
        // scene-image changes made while the render was running
        const { data: latest } = await getVideoPackage(client, id, workspace_id)
        const latestMeta = (latest?.metadata ?? pkg.metadata) as Record<string, unknown>

        // Mark as completed
        await updateVideoPackage(client, id, workspace_id, {
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
      } catch (err) {
        console.error('[video-render]', err)
        // Re-read current metadata before saving error status
        const { data: latest } = await getVideoPackage(client, id, workspace_id).catch(() => ({ data: null }))
        const latestMeta = (latest?.metadata ?? pkg.metadata) as Record<string, unknown>
        await updateVideoPackage(client, id, workspace_id, {
          metadata: {
            ...latestMeta,
            render_status: 'failed',
            render_progress: 0,
            render_error: err instanceof Error ? err.message : 'Unknown render error',
          },
        }).catch(() => {})
      }
    })()

    return NextResponse.json({ queued: true })
  } catch (err) {
    console.error('[POST /api/video-packages/[id]/render]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/video-packages/[id]/render
 * Poll the current render status.
 */
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
    const { data: pkg, error } = await getVideoPackage(client, id, workspaceId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!pkg) {
      return NextResponse.json({ error: 'Video package not found' }, { status: 404 })
    }

    const meta = pkg.metadata as Record<string, unknown>

    return NextResponse.json({
      render_status: meta.render_status ?? 'idle',
      render_progress: meta.render_progress ?? 0,
      render_url: meta.render_url ?? null,
      render_error: meta.render_error ?? null,
      rendered_at: meta.rendered_at ?? null,
      render_duration_ms: meta.render_duration_ms ?? null,
    })
  } catch (err) {
    console.error('[GET /api/video-packages/[id]/render]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
