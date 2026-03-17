/**
 * AI Image Generator — GPT Image 1.5 for scene visuals
 *
 * When stock photos from Pexels are irrelevant or unavailable,
 * this service generates custom images using OpenAI's GPT Image 1.5 API.
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
 * Generate a scene background image using GPT Image 1.5.
 *
 * Builds a prompt from the scene context + brand style guidelines.
 * Saves the image to the public directory for Remotion to access.
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

  const prompt = buildPrompt(scene, orientation)

  try {
    console.log(`[AIImageGenerator] Generating image for scene ${sceneIndex + 1}: "${scene.title ?? 'Untitled'}"`)

    const response = await client.images.generate({
      model: 'gpt-image-1.5',
      prompt,
      n: 1,
      size: orientation === 'portrait' ? '1024x1536' : '1536x1024',
      quality: 'high',
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) {
      console.warn('[AIImageGenerator] No image data in response')
      return null
    }

    // Save to local public directory
    const outputDir = path.join(process.cwd(), 'public', 'video-scene-images', videoPackageId)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const filename = `ai-scene-${sceneIndex + 1}-${Date.now()}.png`
    const localPath = path.join(outputDir, filename)
    const publicPath = `/video-scene-images/${videoPackageId}/${filename}`

    const buffer = Buffer.from(b64, 'base64')
    fs.writeFileSync(localPath, buffer)

    console.log(`[AIImageGenerator] Generated and saved: ${publicPath} (${(buffer.length / 1024).toFixed(0)} KB)`)

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
 * Build a prompt from scene context + brand guidelines.
 */
function buildPrompt(scene: SceneContext, orientation: 'landscape' | 'portrait'): string {
  const aspectNote = orientation === 'portrait'
    ? 'Vertical composition (9:16 aspect ratio), optimized for mobile viewing.'
    : 'Horizontal composition (16:9 aspect ratio).'

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
