import 'server-only'

import {
  extractSmartKeywords,
  scoreImageCandidates,
  pickBestImage,
  type SceneContext,
  type ImageCandidate,
} from './image-relevance-scorer'
import { generateSceneImage } from './ai-image-generator'

// ---------------------------------------------------------------------------
// Stock Image Service — fetches scene background images from Pexels (primary)
// or Picsum (no-auth fallback) based on visual_direction text.
// ---------------------------------------------------------------------------

export interface StockImage {
  url: string           // Direct image URL (large size)
  photographer: string  // Credit
  alt: string           // Alt text
  avgColor: string      // Average color hex for fallback
}

// ---- Internal types for Pexels API response --------------------------------

interface PexelsPhoto {
  src: { large2x: string; large: string; medium: string }
  photographer: string
  alt: string
  avg_color: string
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[]
}

// ---- Cache -----------------------------------------------------------------

const imageCache = new Map<string, StockImage>()

function cacheKey(query: string, orientation: string): string {
  return `${orientation}::${query.toLowerCase().trim()}`
}

// ---- Query extraction ------------------------------------------------------

/** Common filler words to strip from visual_direction before searching. */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'show', 'showing', 'display', 'displays',
  'use', 'using', 'image', 'imagery', 'visual', 'visuals', 'scene',
  'transition', 'background', 'bright', 'dark', 'style', 'shot', 'shots',
])

/**
 * Extract 2-3 meaningful keywords from a visual_direction string.
 * Example: "Show frustrated person at desk" → "frustrated person desk"
 */
export function extractSearchTerms(visualDirection: string): string {
  const words = visualDirection
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

  // Take up to 3 most meaningful words
  return words.slice(0, 3).join(' ')
}

// ---- Orientation helper ----------------------------------------------------

type Orientation = 'landscape' | 'portrait'

function orientationForPlatform(platform: string): Orientation {
  const vertical = ['tiktok', 'reels', 'shorts', 'instagram_story', 'story']
  return vertical.some((v) => platform.toLowerCase().includes(v))
    ? 'portrait'
    : 'landscape'
}

function picsumDimensions(orientation: Orientation): { w: number; h: number } {
  return orientation === 'portrait'
    ? { w: 1080, h: 1920 }
    : { w: 1920, h: 1080 }
}

// ---- Pexels fetch ----------------------------------------------------------

async function fetchFromPexels(
  query: string,
  orientation: Orientation,
  apiKey: string,
  perPage: number = 1,
): Promise<StockImage[]> {
  const params = new URLSearchParams({
    query,
    orientation,
    per_page: String(perPage),
    size: 'large',
  })

  try {
    const res = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
      headers: { Authorization: apiKey },
      cache: 'force-cache',
    })

    if (!res.ok) return []

    const data = (await res.json()) as PexelsSearchResponse
    if (!data.photos?.length) return []

    return data.photos.map((photo) => ({
      url: photo.src.large2x || photo.src.large,
      photographer: photo.photographer,
      alt: photo.alt || query,
      avgColor: photo.avg_color || '#1a1a2e',
    }))
  } catch {
    return []
  }
}

// ---- Picsum fallback (no auth) ---------------------------------------------

function picsum(
  index: number,
  orientation: Orientation,
): StockImage {
  const { w, h } = picsumDimensions(orientation)
  return {
    url: `https://picsum.photos/${w}/${h}?random=${index}`,
    photographer: 'Picsum',
    alt: 'Random stock photo',
    avgColor: '#1a1a2e',
  }
}

// ---- Gradient fallback (offline) -------------------------------------------

const FALLBACK_GRADIENTS = [
  '#0f0c29',
  '#1a1a2e',
  '#16213e',
  '#1b1b2f',
  '#0a0e27',
  '#111827',
  '#1e1b4b',
  '#172554',
]

function gradientFallback(index: number): StockImage {
  const color = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length]!
  return {
    url: '',
    photographer: '',
    alt: 'Gradient background',
    avgColor: color,
  }
}

// ---- Public API ------------------------------------------------------------

/**
 * Fetch stock images for an array of visual_direction queries.
 * Uses Pexels API when `PEXELS_API_KEY` is set, otherwise falls back to Picsum.
 * If both fail, returns a gradient descriptor (empty url, populated avgColor).
 */
export async function fetchStockImages(
  queries: string[],
  platform: string = 'youtube',
  scenes?: (SceneContext | undefined)[],
): Promise<StockImage[]> {
  const apiKey = process.env.PEXELS_API_KEY
  const orientation = orientationForPlatform(platform)

  const results = await Promise.all(
    queries.map(async (raw, index) => {
      const scene = scenes?.[index]

      // Use AI keyword extraction if scene context is available
      let searchTerms: string
      if (scene) {
        try {
          const keywords = await extractSmartKeywords(scene)
          searchTerms = keywords[0] ?? extractSearchTerms(raw)
        } catch {
          searchTerms = extractSearchTerms(raw)
        }
      } else {
        searchTerms = extractSearchTerms(raw)
      }

      const key = cacheKey(searchTerms, orientation)

      // 1. Check cache
      const cached = imageCache.get(key)
      if (cached) return cached

      let image: StockImage | null = null

      // 2. Try Pexels with smart selection if scene context available
      if (apiKey && searchTerms.length > 0) {
        if (scene) {
          // Fetch multiple candidates and score for relevance
          const candidates = await fetchFromPexels(searchTerms, orientation, apiKey, 5)
          if (candidates.length > 0) {
            const imageCandidates: ImageCandidate[] = candidates.map((c) => ({
              url: c.url,
              alt: c.alt,
              photographer: c.photographer,
              avgColor: c.avgColor,
            }))
            try {
              const scored = await scoreImageCandidates(imageCandidates, scene)
              const best = pickBestImage(scored)
              // Only use stock image if relevance score is decent (> 0.4)
              if (best && best.relevanceScore > 0.4) {
                image = {
                  url: best.url,
                  photographer: best.photographer,
                  alt: best.alt,
                  avgColor: best.avgColor,
                }
              } else if (best) {
                console.log(`[StockImageService] Best stock image scored ${best.relevanceScore.toFixed(2)} — below 0.4, will try AI generation`)
              }
            } catch {
              // Scoring failed — use first candidate
              image = candidates[0] ?? null
            }
          }
        } else {
          // No scene context — use first result (legacy behavior)
          const candidates = await fetchFromPexels(searchTerms, orientation, apiKey, 1)
          image = candidates[0] ?? null
        }
      }

      // 3. Fallback: AI-generated image if scene context available
      if (!image && scene) {
        try {
          // We need a videoPackageId for saving — extract from cache key or generate temp
          const generated = await generateSceneImage(
            scene,
            `auto-${Date.now()}`,
            index,
            orientation,
          )
          if (generated) {
            image = {
              url: generated.url,
              photographer: 'AI Generated (DALL-E)',
              alt: `AI generated: ${scene.title ?? scene.visualDirection.slice(0, 50)}`,
              avgColor: '#1a1a2e',
            }
          }
        } catch {
          // AI generation failed — continue to Picsum
        }
      }

      // 4. Final fallback: Picsum (no auth, always works if online)
      if (!image) {
        image = picsum(index + Date.now(), orientation)
      }

      // 4. Cache and return
      imageCache.set(key, image)
      return image
    }),
  )

  return results
}

/**
 * Prepare image URLs for every visual moment in a video package:
 *   [hookImage, thumbnailImage, ...sceneImages, ctaImage]
 *
 * Returns one URL per slot. Empty string means "use gradient fallback".
 */
export async function prepareSceneImages(
  scenes: Array<{ visual_direction: string; script?: string; title?: string }>,
  platform: string = 'youtube',
): Promise<string[]> {
  // Build query list: hook intro + thumbnail + each scene + CTA outro
  const queries = [
    'cinematic intro motion graphics',            // hook
    'high contrast thumbnail hero image',         // thumbnail
    ...scenes.map((s) => s.visual_direction),      // scenes
    'call to action subscribe button',             // CTA
  ]

  // Build scene contexts for AI-powered image selection (only for scene slots)
  const sceneContexts: (SceneContext | undefined)[] = [
    undefined, // hook — no scene context
    undefined, // thumbnail — no scene context
    ...scenes.map((s) => ({
      script: s.script ?? s.visual_direction,
      visualDirection: s.visual_direction,
      title: s.title,
    })),
    undefined, // CTA — no scene context
  ]

  try {
    const images = await fetchStockImages(queries, platform, sceneContexts)
    return images.map((img) => img.url)
  } catch {
    // Total failure — return empty strings (renderer should use gradients)
    return queries.map(() => '')
  }
}

/**
 * Clear the in-memory image cache (useful in tests or after long runs).
 */
export function clearImageCache(): void {
  imageCache.clear()
}
