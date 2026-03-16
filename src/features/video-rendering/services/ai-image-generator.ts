/**
 * AI Image Generator — DALL-E fallback for scene visuals
 *
 * When stock photos from Pexels are irrelevant or unavailable,
 * this service generates custom images using OpenAI's DALL-E API.
 *
 * Style: Dark tech aesthetic, cinematic lighting, purple/green/amber glows,
 * matching the Agent MOE brand.
 */

import 'server-only'

import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import type { SceneContext } from './image-relevance-scorer'

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'] ?? 'missing-key',
    })
  }
  return _client
}

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const BRAND_STYLE = `Cinematic, dark background with subtle purple and cyan lighting,
modern tech aesthetic, high contrast, professional quality,
digital art style with photorealistic elements`

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

export interface GeneratedImage {
  url: string
  localPath: string
  prompt: string
}

/**
 * Generate a scene background image using DALL-E.
 *
 * Builds a prompt from the scene context + brand style guidelines.
 * Downloads the image to the public directory for Remotion to access.
 *
 * Returns null if generation fails (caller should fall back to gradient).
 */
export async function generateSceneImage(
  scene: SceneContext,
  videoPackageId: string,
  sceneIndex: number,
  orientation: 'landscape' | 'portrait' = 'portrait',
): Promise<GeneratedImage | null> {
  const client = getClient()

  if (!process.env['OPENAI_API_KEY']) {
    console.warn('[AIImageGenerator] No OPENAI_API_KEY — skipping image generation')
    return null
  }

  // Build a visual prompt from the scene context
  const prompt = buildPrompt(scene, orientation)

  try {
    console.log(`[AIImageGenerator] Generating image for scene ${sceneIndex + 1}: "${scene.title ?? 'Untitled'}"`)

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: orientation === 'portrait' ? '1024x1792' : '1792x1024',
      quality: 'standard',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      console.warn('[AIImageGenerator] No image URL in response')
      return null
    }

    // Download to local public directory
    const outputDir = path.join(process.cwd(), 'public', 'video-scene-images', videoPackageId)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const filename = `ai-scene-${sceneIndex + 1}-${Date.now()}.png`
    const localPath = path.join(outputDir, filename)
    const publicPath = `/video-scene-images/${videoPackageId}/${filename}`

    // Download the image
    const imgResponse = await fetch(imageUrl)
    if (!imgResponse.ok) {
      console.warn('[AIImageGenerator] Failed to download generated image')
      return null
    }

    const buffer = Buffer.from(await imgResponse.arrayBuffer())
    fs.writeFileSync(localPath, buffer)

    console.log(`[AIImageGenerator] Generated and saved: ${publicPath}`)

    return {
      url: publicPath,
      localPath,
      prompt,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.warn(`[AIImageGenerator] Generation failed: ${message}`)
    return null
  }
}

/**
 * Build a DALL-E prompt from scene context + brand guidelines.
 */
function buildPrompt(scene: SceneContext, orientation: 'landscape' | 'portrait'): string {
  const aspectNote = orientation === 'portrait'
    ? 'Vertical composition (9:16 aspect ratio), optimized for mobile viewing.'
    : 'Horizontal composition (16:9 aspect ratio).'

  // Combine visual direction with brand style
  return `${scene.visualDirection}

Style requirements: ${BRAND_STYLE}
${aspectNote}
No text, no watermarks, no logos. Clean background suitable for overlaying text in a video.
The image should work as a video scene background with text overlays on top.`
}

/**
 * Generate images for multiple scenes in batch.
 * Returns an array aligned with the input scenes (null for failed generations).
 */
export async function generateSceneImagesBatch(
  scenes: SceneContext[],
  videoPackageId: string,
  orientation: 'landscape' | 'portrait' = 'portrait',
): Promise<(GeneratedImage | null)[]> {
  // Generate sequentially to avoid rate limits
  const results: (GeneratedImage | null)[] = []

  for (let i = 0; i < scenes.length; i++) {
    const result = await generateSceneImage(scenes[i]!, videoPackageId, i, orientation)
    results.push(result)
  }

  return results
}
