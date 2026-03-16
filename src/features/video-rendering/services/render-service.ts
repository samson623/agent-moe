import 'server-only'

import path from 'path'
import fs from 'fs'
import type { VideoCompositionProps } from '../remotion/compositions/VideoPackageComposition'
import { getPlatformConfig, calculateTotalDuration } from '../remotion/lib/platform-config'
import { prepareSceneImages } from '@/features/video-rendering/services/stock-image-service'

const PUBLIC_DIR = path.join(process.cwd(), 'public')

/**
 * Copy a locally-uploaded image into the Remotion bundle directory so that
 * the headless Chromium instance serving the bundle can resolve the URL.
 * External URLs are returned as-is.
 *
 * Local paths keep their leading `/` so they resolve as absolute paths from
 * the bundle server root — this is more reliable than relative URLs, and
 * works correctly with Remotion's `<Img>` component.
 */
function resolveImageUrl(url: string, bundleDir: string): string {
  if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }

  if (url.startsWith('/')) {
    const srcPath = path.join(PUBLIC_DIR, url)
    if (fs.existsSync(srcPath)) {
      // Mirror the public-dir path inside the bundle so the URL works
      const destPath = path.join(bundleDir, url)
      const destDir = path.dirname(destPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }
      fs.copyFileSync(srcPath, destPath)
      console.log(`[render-service] Copied local image into bundle: ${url}`)
    } else {
      console.warn(`[render-service] Local image not found on disk: ${srcPath}`)
    }
  }

  // Keep the leading slash — absolute URLs resolve reliably from the bundle server root
  return url
}

export interface RenderOptions {
  videoPackageId: string
  platform: string
  inputProps: VideoCompositionProps
  customSceneImages?: string[][]
  onProgress?: (progress: number) => void
}

export interface RenderResult {
  outputPath: string
  durationMs: number
}

const BUNDLE_DIR = path.join(process.cwd(), 'remotion-bundle')
const RENDER_DIR = path.join(process.cwd(), 'public', 'renders')

let cachedBundlePath: string | null = null
let bundlePromise: Promise<string> | null = null

/**
 * Bundle Remotion compositions. Cached after first invocation.
 */
async function ensureBundle(): Promise<string> {
  if (cachedBundlePath && fs.existsSync(cachedBundlePath)) {
    return cachedBundlePath
  }

  if (bundlePromise) {
    return bundlePromise
  }

  const { bundle } = await import('@remotion/bundler')

  const entryPoint = path.join(
    process.cwd(),
    'src',
    'features',
    'video-rendering',
    'remotion',
    'index.ts',
  )

  bundlePromise = bundle({
    entryPoint,
    outDir: BUNDLE_DIR,
  })

  try {
    cachedBundlePath = await bundlePromise
    return cachedBundlePath
  } finally {
    bundlePromise = null
  }
}

/**
 * Invalidate the cached bundle so next render re-bundles fresh.
 * Useful when Remotion source files have changed.
 */
export function invalidateBundle(): void {
  cachedBundlePath = null
  bundlePromise = null
}

/**
 * Render a video package to MP4. This is CPU-intensive and should be called
 * asynchronously (fire-and-forget from an API route).
 */
export async function renderVideoPackage(options: RenderOptions): Promise<RenderResult> {
  const startTime = Date.now()
  const { renderMedia, selectComposition } = await import('@remotion/renderer')

  // Ensure output directory exists
  if (!fs.existsSync(RENDER_DIR)) {
    fs.mkdirSync(RENDER_DIR, { recursive: true })
  }

  // Bundle Remotion project (rebuilds if remotion-bundle/ was deleted)
  console.log('[render-service] Bundling Remotion compositions…')
  const serveUrl = await ensureBundle()
  console.log('[render-service] Bundle ready at:', serveUrl)

  // Select composition for the target platform
  const compositionId = `video-package-${options.platform}`
  const platformConfig = getPlatformConfig(options.platform)

  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps: options.inputProps,
  })

  // Calculate actual duration from scene data
  const sceneDurations = options.inputProps.scenes.map((s) => s.duration_seconds)
  const totalSeconds = calculateTotalDuration(sceneDurations)
  composition.durationInFrames = Math.ceil(totalSeconds * platformConfig.fps)

  // Resolve background images. Custom scene uploads override auto-selected
  // scene visuals, while hook / thumbnail / CTA still come from the stock flow.
  if (!options.inputProps.sceneImages) {
    try {
      // Sort scenes by order so they align with the composition's sortedScenes.
      const sortedScenes = [...options.inputProps.scenes].sort((a, b) => a.order - b.order)

      const sceneImages = await prepareSceneImages(
        sortedScenes.map((s) => ({ visual_direction: s.visual_direction })),
        options.platform,
      )
      const customSceneImages = options.customSceneImages ?? []
      const resolvedSceneImages = sceneImages.map((url) => resolveImageUrl(url, serveUrl))

      console.log(
        '[render-service] Custom scene images from metadata:',
        JSON.stringify(customSceneImages),
      )

      // We explicitly copy local public assets into the bundle. This avoids
      // Remotion re-copying the entire public directory, which races with
      // concurrent renders on Windows when /public/renders already contains MP4s.
      options.inputProps.sceneImages = resolvedSceneImages

      // Build sceneImageGroups in sorted-scene order so the composition can use
      // narrationImageGroups[index] directly against its own sortedScenes[index].
      // customSceneImages is indexed by sceneOrder - 1 (set at upload time via resolveSceneIndex).
      options.inputProps.sceneImageGroups = sortedScenes.map((scene, sortedIndex) => {
        const sceneIndex = scene.order - 1
        const customGroup = (customSceneImages[sceneIndex] ?? []).filter(Boolean)
        if (customGroup.length > 0) {
          return customGroup.map((url) => resolveImageUrl(url, serveUrl))
        }

        const fallbackImage = resolvedSceneImages[sortedIndex + 2]
        return fallbackImage ? [fallbackImage] : []
      })

      console.log(
        '[render-service] Final sceneImageGroups:',
        JSON.stringify(options.inputProps.sceneImageGroups),
      )

      // Log per-scene breakdown for debugging
      sortedScenes.forEach((scene, i) => {
        const group = options.inputProps.sceneImageGroups?.[i] ?? []
        const source = (customSceneImages[scene.order - 1] ?? []).length > 0 ? 'CUSTOM' : 'STOCK'
        console.log(
          `[render-service]   Scene ${scene.order} "${scene.title}": ${group.length} image(s) [${source}]`,
          group,
        )
      })
    } catch (err) {
      console.warn('[render-service] Failed to fetch scene images, proceeding without:', err)
    }
  }

  console.log('[render-service] Starting renderMedia with inputProps keys:', Object.keys(options.inputProps))
  console.log('[render-service]   sceneImages count:', options.inputProps.sceneImages?.length ?? 0)
  console.log('[render-service]   sceneImageGroups count:', options.inputProps.sceneImageGroups?.length ?? 0)

  const outputPath = path.join(RENDER_DIR, `${options.videoPackageId}.mp4`)

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: options.inputProps,
    concurrency: 1, // Conservative for dev machine
    onProgress: ({ progress }) => {
      options.onProgress?.(Math.round(progress * 100))
    },
  })

  return {
    outputPath,
    durationMs: Date.now() - startTime,
  }
}
