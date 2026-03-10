import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getVideoPackage,
  updateVideoPackage,
  deleteVideoPackage,
} from '@/lib/supabase/queries/video-packages'
import { logActivity } from '@/lib/supabase/queries/activity'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const PLATFORMS = ['x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'email', 'universal'] as const
const STATUSES = ['draft', 'review', 'approved', 'published', 'archived', 'rejected'] as const

const patchVideoPackageSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  platform: z.enum(PLATFORMS).optional(),
  hook: z
    .object({
      primary: z.string().min(1),
      variants: z.array(z.string()),
    })
    .optional(),
  scenes: z
    .array(
      z.object({
        order: z.number().int().nonnegative(),
        title: z.string().min(1),
        script: z.string().min(1),
        visual_direction: z.string().min(1),
        duration_seconds: z.number().nonnegative(),
      }),
    )
    .optional(),
  thumbnail_concept: z
    .object({
      headline: z.string().min(1),
      visual_description: z.string().min(1),
      color_scheme: z.string().min(1),
      text_overlay: z.string(),
    })
    .optional(),
  caption: z.string().nullable().optional(),
  cta: z
    .object({
      text: z.string().min(1),
      type: z.string().min(1),
      destination: z.string().optional(),
    })
    .nullable()
    .optional(),
  status: z.enum(STATUSES).optional(),
  confidence_score: z.number().min(0).max(1).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  mission_id: z.string().uuid().nullable().optional(),
  asset_id: z.string().uuid().nullable().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET /api/video-packages/[id]
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const client = createAdminClient()
    const { data, error } = await getVideoPackage(client, id, workspaceId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Video package not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/video-packages/[id]
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = patchVideoPackageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id, ...updates } = parsed.data

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const client = createAdminClient()
    const { data, error } = await updateVideoPackage(client, id, workspace_id, updates)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Video package not found' }, { status: 404 })
    }

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: 'video_package_updated',
      entity_type: 'video_package',
      entity_id: id,
      summary: `Video package updated: "${data.title}" — fields: ${Object.keys(updates).join(', ')}`,
    })

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/video-packages/[id]
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    // Accept workspace_id from query string or JSON body
    const { searchParams } = request.nextUrl
    let workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null
      workspaceId = typeof body?.workspace_id === 'string' ? body.workspace_id : null
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const client = createAdminClient()

    // Fetch before deleting so we have title for the activity log
    const { data: existing } = await getVideoPackage(client, id, workspaceId)
    if (!existing) {
      return NextResponse.json({ error: 'Video package not found' }, { status: 404 })
    }

    const { error } = await deleteVideoPackage(client, id, workspaceId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id: workspaceId,
      actor_type: 'system',
      action: 'video_package_deleted',
      entity_type: 'video_package',
      entity_id: id,
      summary: `Video package deleted: "${existing.title}" (${existing.platform})`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
