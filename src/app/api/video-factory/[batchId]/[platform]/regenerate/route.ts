import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getVideoPackage, deleteVideoPackage } from '@/lib/supabase/queries/video-packages'
import { generateVideoFactoryBatch } from '@/features/video-factory/services/video-factory'

export const dynamic = 'force-dynamic'

const regenerateSchema = z.object({
  workspace_id: z.string().uuid(),
  package_id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// POST /api/video-factory/[batchId]/[platform]/regenerate
//
// Regenerates a single platform's video. Deletes the old package and creates
// a new one using the original topic/settings from the old package's metadata.
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string; platform: string }> },
) {
  try {
    const { platform } = await params

    // Auth
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate body
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = regenerateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id, package_id } = parsed.data

    // Verify workspace ownership
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Load the existing package to get original settings
    const client = createAdminClient()
    const { data: pkg, error: pkgError } = await getVideoPackage(client, package_id, workspace_id)

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const meta = pkg.metadata as Record<string, unknown>
    const topic = (typeof meta.topic === 'string' ? meta.topic : pkg.title)
    const durationSeconds = (typeof meta.duration_seconds === 'number' ? meta.duration_seconds : 30)
    const tone = (typeof meta.tone === 'string' ? meta.tone : 'educational')

    // Validate platform matches
    if (pkg.platform !== platform) {
      return NextResponse.json(
        { error: `Package platform "${pkg.platform}" does not match route platform "${platform}"` },
        { status: 400 },
      )
    }

    // Delete the old package
    await deleteVideoPackage(client, package_id, workspace_id)

    // Regenerate — the factory generates for all 3 platforms, but we only need one.
    // For simplicity, we call the full factory. The client can filter by platform.
    // TODO: Add single-platform generation support to the factory service.
    const result = await generateVideoFactoryBatch({
      topic,
      durationSeconds,
      tone,
      workspaceId: workspace_id,
    })

    // Find the matching platform package
    const regenerated = result.packages.find((p) => p.platform === platform)

    if (!regenerated) {
      return NextResponse.json(
        { error: `Regeneration failed for platform "${platform}"` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: {
        batchId: result.batchId,
        platform: regenerated.platform,
        packageId: regenerated.packageId,
        confidenceScore: regenerated.confidenceScore,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/video-factory/regenerate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
