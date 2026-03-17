import fs from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getVideoPackage, updateVideoPackage } from '@/lib/supabase/queries/video-packages'
import { prepareSceneImages } from '@/features/video-rendering/services/stock-image-service'
import {
  readCustomSceneImages,
  writeCustomSceneImages,
} from '@/features/video-rendering/scene-image-metadata'

export const dynamic = 'force-dynamic'

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'video-scene-images')
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

function isSceneImageUrl(value: string): boolean {
  if (value.startsWith('/')) {
    return true
  }

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const jsonActionSchema = z.object({
  workspace_id: z.string().uuid(),
  action: z.enum(['auto_fill_all', 'auto_fill_scene', 'set_scene_urls']),
  scene_order: z.number().int().positive().optional(),
  urls: z
    .array(z.string().min(1).refine(isSceneImageUrl, 'Each URL must be absolute or start with /'))
    .optional(),
})

function getExtensionForMimeType(mimeType: string): string | null {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return null
  }
}

/**
 * Resolve a 1-based scene_order to a 0-based slot index.
 * Full slot layout: [hook(0), thumbnail(1), narration scenes(2..n+1), cta(n+2)]
 * Total slots = narrationSceneCount + 3
 */
function resolveSceneIndex(sceneOrder: number, totalSlots: number): number | null {
  const index = sceneOrder - 1
  return index >= 0 && index < totalSlots ? index : null
}

function localFilePathFromPublicUrl(url: string): string | null {
  if (!url.startsWith('/video-scene-images/')) {
    return null
  }

  const relative = url.replace('/video-scene-images/', '')
  const candidate = path.join(UPLOAD_ROOT, relative)
  const normalizedRoot = path.normalize(UPLOAD_ROOT)
  const normalizedCandidate = path.normalize(candidate)

  return normalizedCandidate.startsWith(normalizedRoot) ? normalizedCandidate : null
}

function diffRemovedUrls(previousUrls: string[], nextUrls: string[]): string[] {
  const nextSet = new Set(nextUrls)
  return previousUrls.filter((url) => !nextSet.has(url))
}

async function removeLocalUpload(url: string): Promise<void> {
  const localPath = localFilePathFromPublicUrl(url)
  if (!localPath) return

  await fs.rm(localPath, { force: true }).catch(() => {})
}

async function loadPackageOrError(
  videoPackageId: string,
  workspaceId: string,
) {
  const client = createAdminClient()
  const result = await getVideoPackage(client, videoPackageId, workspaceId)

  if (result.error) {
    return {
      client,
      errorResponse: NextResponse.json({ error: result.error }, { status: 500 }),
      pkg: null,
    }
  }

  if (!result.data) {
    return {
      client,
      errorResponse: NextResponse.json({ error: 'Video package not found' }, { status: 404 }),
      pkg: null,
    }
  }

  return { client, errorResponse: null, pkg: result.data }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const workspaceId = formData.get('workspace_id')
    const sceneOrderValue = formData.get('scene_order')
    const files = [
      ...formData.getAll('files'),
      ...(!formData.get('file') ? [] : [formData.get('file')]),
    ].filter((value): value is File => value instanceof File)

    if (typeof workspaceId !== 'string' || !workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    const sceneOrder = Number(sceneOrderValue)
    if (!Number.isInteger(sceneOrder) || sceneOrder <= 0) {
      return NextResponse.json({ error: 'scene_order must be a positive integer' }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 })
    }

    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'Each image must be 8MB or smaller' }, { status: 400 })
      }

      if (!getExtensionForMimeType(file.type)) {
        return NextResponse.json(
          { error: 'Only JPG, PNG, and WEBP images are supported' },
          { status: 400 },
        )
      }
    }

    const { client, errorResponse, pkg } = await loadPackageOrError(id, workspaceId)
    if (errorResponse || !pkg) {
      return errorResponse!
    }

    const sceneIndex = resolveSceneIndex(sceneOrder, pkg.scenes.length + 3)
    if (sceneIndex === null) {
      return NextResponse.json({ error: 'scene_order is out of range' }, { status: 400 })
    }

    const currentImages = readCustomSceneImages(pkg.metadata, pkg.scenes.length + 3)

    await fs.mkdir(path.join(UPLOAD_ROOT, id), { recursive: true })

    const uploadedUrls: string[] = []

    for (const file of files) {
      const extension = getExtensionForMimeType(file.type)!
      const filename = `scene-${sceneOrder}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
      const publicUrl = `/video-scene-images/${id}/${filename}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.writeFile(path.join(UPLOAD_ROOT, id, filename), buffer)
      uploadedUrls.push(publicUrl)
    }

    currentImages[sceneIndex] = [...(currentImages[sceneIndex] ?? []), ...uploadedUrls]
    const metadata = writeCustomSceneImages(pkg.metadata, currentImages)

    const { data, error } = await updateVideoPackage(client, id, workspaceId, { metadata })

    if (error) {
      await Promise.all(uploadedUrls.map((url) => removeLocalUpload(url)))
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, uploaded_urls: uploadedUrls })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => null)
    const parsed = jsonActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id, action, scene_order, urls } = parsed.data
    const { client, errorResponse, pkg } = await loadPackageOrError(id, workspace_id)
    if (errorResponse || !pkg) {
      return errorResponse!
    }

    const currentImages = readCustomSceneImages(pkg.metadata, pkg.scenes.length + 3)

    // set_scene_urls doesn't need auto-generated images — handle it early
    if (action === 'set_scene_urls') {
      if (!scene_order) {
        return NextResponse.json({ error: 'scene_order is required' }, { status: 400 })
      }

      const sceneIndex = resolveSceneIndex(scene_order, pkg.scenes.length + 3)
      if (sceneIndex === null) {
        return NextResponse.json({ error: 'scene_order is out of range' }, { status: 400 })
      }

      const previousUrls = currentImages[sceneIndex] ?? []
      const nextUrls = urls ?? []

      diffRemovedUrls(previousUrls, nextUrls).forEach((url) => {
        void removeLocalUpload(url)
      })

      currentImages[sceneIndex] = nextUrls
      const metadata = writeCustomSceneImages(pkg.metadata, currentImages)
      const { data, error } = await updateVideoPackage(client, id, workspace_id, { metadata })

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ data, updated_scene: scene_order })
    }

    // Auto-fill actions need stock images from Pexels
    const autoImages = await prepareSceneImages(
      pkg.scenes.map((scene) => ({ visual_direction: scene.visual_direction })),
      pkg.platform,
    )

    const generatedSceneImages = autoImages.slice(2, 2 + pkg.scenes.length + 3)

    if (action === 'auto_fill_all') {
      currentImages.forEach((group) => {
        group.forEach((url) => {
          void removeLocalUpload(url)
        })
      })

      const metadata = writeCustomSceneImages(
        pkg.metadata,
        generatedSceneImages.map((url) => (url ? [url] : [])),
      )
      const { data, error } = await updateVideoPackage(client, id, workspace_id, { metadata })

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ data, auto_filled: 'all' })
    }

    if (!scene_order) {
      return NextResponse.json({ error: 'scene_order is required' }, { status: 400 })
    }

    const sceneIndex = resolveSceneIndex(scene_order, pkg.scenes.length + 3)
    if (sceneIndex === null) {
      return NextResponse.json({ error: 'scene_order is out of range' }, { status: 400 })
    }

    // action === 'auto_fill_scene'
    ;(currentImages[sceneIndex] ?? []).forEach((url) => {
      void removeLocalUpload(url)
    })

    currentImages[sceneIndex] = generatedSceneImages[sceneIndex] ? [generatedSceneImages[sceneIndex]!] : []
    const metadata = writeCustomSceneImages(pkg.metadata, currentImages)
    const { data, error } = await updateVideoPackage(client, id, workspace_id, { metadata })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, auto_filled: scene_order })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => null) as
      | { workspace_id?: string; scene_order?: number }
      | null

    const workspaceId = body?.workspace_id
    const sceneOrder = body?.scene_order

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    if (!sceneOrder || !Number.isInteger(sceneOrder) || sceneOrder <= 0) {
      return NextResponse.json({ error: 'scene_order must be a positive integer' }, { status: 400 })
    }

    const { client, errorResponse, pkg } = await loadPackageOrError(id, workspaceId)
    if (errorResponse || !pkg) {
      return errorResponse!
    }

    const sceneIndex = resolveSceneIndex(sceneOrder, pkg.scenes.length + 3)
    if (sceneIndex === null) {
      return NextResponse.json({ error: 'scene_order is out of range' }, { status: 400 })
    }

    const currentImages = readCustomSceneImages(pkg.metadata, pkg.scenes.length + 3)
    await Promise.all((currentImages[sceneIndex] ?? []).map((url) => removeLocalUpload(url)))
    currentImages[sceneIndex] = []
    const metadata = writeCustomSceneImages(pkg.metadata, currentImages)

    const { data, error } = await updateVideoPackage(client, id, workspaceId, { metadata })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, cleared_scene: sceneOrder })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
