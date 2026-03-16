import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getVideoPackage } from '@/lib/supabase/queries/video-packages'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /api/video-factory/[batchId]/status?workspace_id=...&package_ids=id1,id2,id3
//
// Returns render status for all packages in a video factory batch.
// The batchId is used for route organization but the actual lookup
// is by package_ids (since batches aren't persisted to a separate table).
//
// Response:
// {
//   batchId: string,
//   status: 'generating' | 'rendering' | 'ready_for_review' | 'partially_failed' | 'failed',
//   packages: [
//     {
//       packageId: string,
//       platform: string,
//       title: string,
//       render_status: 'idle' | 'rendering' | 'completed' | 'failed',
//       render_progress: number,
//       render_url: string | null,
//       render_error: string | null,
//       confidence_score: number | null,
//     }
//   ]
// }
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    const { batchId } = await params
    const workspaceId = request.nextUrl.searchParams.get('workspace_id')
    const packageIdsParam = request.nextUrl.searchParams.get('package_ids')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    if (!packageIdsParam) {
      return NextResponse.json({ error: 'package_ids is required (comma-separated)' }, { status: 400 })
    }

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const packageIds = packageIdsParam.split(',').filter(Boolean)
    if (packageIds.length === 0) {
      return NextResponse.json({ error: 'No valid package_ids provided' }, { status: 400 })
    }

    const client = createAdminClient()

    // Fetch all packages in parallel
    const packageResults = await Promise.all(
      packageIds.map(async (id) => {
        const { data: pkg, error } = await getVideoPackage(client, id, workspaceId)

        if (error || !pkg) {
          return {
            packageId: id,
            platform: 'unknown',
            title: 'Unknown',
            render_status: 'failed' as const,
            render_progress: 0,
            render_url: null,
            render_error: error ?? 'Package not found',
            confidence_score: null,
          }
        }

        const meta = pkg.metadata as Record<string, unknown>

        return {
          packageId: pkg.id,
          platform: pkg.platform,
          title: pkg.title,
          render_status: (meta.render_status as string) ?? 'idle',
          render_progress: (meta.render_progress as number) ?? 0,
          render_url: (meta.render_url as string) ?? null,
          render_error: (meta.render_error as string) ?? null,
          confidence_score: pkg.confidence_score,
        }
      }),
    )

    // Derive overall batch status
    const statuses = packageResults.map((p) => p.render_status)
    let batchStatus: string

    if (statuses.every((s) => s === 'completed')) {
      batchStatus = 'ready_for_review'
    } else if (statuses.every((s) => s === 'failed')) {
      batchStatus = 'failed'
    } else if (statuses.some((s) => s === 'failed') && statuses.some((s) => s === 'completed')) {
      batchStatus = 'partially_failed'
    } else if (statuses.some((s) => s === 'rendering')) {
      batchStatus = 'rendering'
    } else {
      batchStatus = 'generating'
    }

    return NextResponse.json({
      batchId,
      status: batchStatus,
      packages: packageResults,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[GET /api/video-factory/[batchId]/status]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
