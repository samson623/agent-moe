/**
 * Image Relevance Scorer — Smart image selection for video scenes
 *
 * Uses GPT-5 Nano to:
 * 1. Extract precise search keywords from scene context (script + visual_direction)
 * 2. Score image candidates against scene content for relevance
 *
 * This replaces basic stop-word stripping with AI-powered keyword extraction,
 * ensuring stock images actually match what's being talked about in each scene.
 */

import 'server-only'

import OpenAI from 'openai'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GPT_NANO_MODEL = process.env['OPENAI_NANO_MODEL'] ?? 'gpt-5-nano'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const KeywordExtractionSchema = z.object({
  keywords: z.array(z.string()).min(1).max(5),
  reasoning: z.string(),
})

const ImageScoreSchema = z.object({
  score: z.number().min(0).max(1),
  reasoning: z.string(),
})

// ---------------------------------------------------------------------------
// Client (reuses same API key as the main OpenAI client)
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
// Keyword extraction
// ---------------------------------------------------------------------------

export interface SceneContext {
  script: string
  visualDirection: string
  title?: string
}

/**
 * Extract 2-4 precise, concrete search keywords from a scene's context.
 * These keywords are optimized for stock photo search (Pexels API).
 *
 * Example:
 *   script: "Most people struggle with time management without realizing it"
 *   visual_direction: "Show frustrated person at desk with clock"
 *   → keywords: ["frustrated person desk", "time management stress", "clock deadline"]
 *
 * Falls back to basic extraction if the API call fails.
 */
export async function extractSmartKeywords(scene: SceneContext): Promise<string[]> {
  const client = getClient()

  const prompt = `Extract 2-4 concrete, visual search terms for finding stock photos that match this video scene.

SCENE TITLE: ${scene.title ?? 'Untitled'}
SCRIPT (what is being said): ${scene.script}
VISUAL DIRECTION (what should be shown): ${scene.visualDirection}

Rules:
- Each keyword should be 2-3 words, describing something visually concrete and searchable
- Focus on objects, people, actions, and settings that a stock photo would show
- Do NOT include abstract concepts — only things a camera can capture
- Prioritize what the VISUAL DIRECTION describes, use the script for context
- Make keywords specific enough to return relevant results (e.g. "person laptop coffee" not "technology")

Respond with JSON only: {"keywords": ["term1", "term2", ...], "reasoning": "brief explanation"}`

  try {
    const response = await client.chat.completions.create({
      model: GPT_NANO_MODEL,
      max_tokens: 256,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a visual search keyword extraction engine for stock photo APIs. Return only JSON.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const parsed = KeywordExtractionSchema.parse(JSON.parse(raw))
    return parsed.keywords
  } catch (err) {
    console.warn('[ImageRelevanceScorer] Keyword extraction failed, using fallback:', err instanceof Error ? err.message : err)
    return [fallbackExtract(scene)]
  }
}

/**
 * Basic keyword extraction fallback (no AI call).
 * Used when GPT-5 Nano is unavailable.
 */
function fallbackExtract(scene: SceneContext): string {
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'show', 'showing', 'display', 'use', 'using', 'image', 'visual', 'scene',
    'transition', 'background', 'bright', 'dark', 'style', 'shot', 'this',
    'that', 'it', 'its', 'has', 'have', 'had', 'do', 'does', 'did',
  ])

  const words = scene.visualDirection
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

  return words.slice(0, 3).join(' ')
}

// ---------------------------------------------------------------------------
// Image relevance scoring
// ---------------------------------------------------------------------------

export interface ImageCandidate {
  url: string
  alt: string
  photographer: string
  avgColor: string
}

export interface ScoredImage extends ImageCandidate {
  relevanceScore: number
}

/**
 * Score a batch of image candidates against a scene's content.
 * Returns the same candidates with a relevanceScore (0-1) added.
 *
 * Uses GPT-5 Nano to compare each image's alt text / description
 * against the scene's script and visual direction.
 *
 * If the API call fails, assigns a default score of 0.5 to all candidates.
 */
export async function scoreImageCandidates(
  candidates: ImageCandidate[],
  scene: SceneContext,
): Promise<ScoredImage[]> {
  if (candidates.length === 0) return []

  // If only one candidate, skip scoring — it's the only option
  if (candidates.length === 1) {
    return [{ ...candidates[0]!, relevanceScore: 0.5 }]
  }

  const client = getClient()

  // Score all candidates in a single API call for efficiency
  const candidateDescriptions = candidates
    .map((c, i) => `${i + 1}. "${c.alt}"`)
    .join('\n')

  const prompt = `Score each image for visual relevance to this video scene.

SCENE CONTEXT:
- Title: ${scene.title ?? 'Untitled'}
- Script: ${scene.script}
- Visual direction: ${scene.visualDirection}

IMAGE CANDIDATES:
${candidateDescriptions}

For each image, score 0.0-1.0 based on:
- Does the image match what the VISUAL DIRECTION asks for?
- Is it contextually relevant to the SCRIPT content?
- Would it make sense as a background for this scene?

Respond with JSON: {"scores": [{"index": 1, "score": 0.8, "reasoning": "..."}, ...]}`

  try {
    const response = await client.chat.completions.create({
      model: GPT_NANO_MODEL,
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an image relevance scoring engine. Score how well each image matches a video scene. Return only JSON.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as { scores?: Array<{ index: number; score: number }> }
    const scores = parsed.scores ?? []

    return candidates.map((candidate, i) => {
      const scoreEntry = scores.find((s) => s.index === i + 1)
      return {
        ...candidate,
        relevanceScore: scoreEntry?.score ?? 0.5,
      }
    })
  } catch (err) {
    console.warn('[ImageRelevanceScorer] Scoring failed, using default scores:', err instanceof Error ? err.message : err)
    return candidates.map((c) => ({ ...c, relevanceScore: 0.5 }))
  }
}

/**
 * Pick the best image from scored candidates.
 * Returns the candidate with the highest relevance score.
 */
export function pickBestImage(scored: ScoredImage[]): ScoredImage | null {
  if (scored.length === 0) return null
  return scored.reduce((best, current) =>
    current.relevanceScore > best.relevanceScore ? current : best,
  )
}
