/**
 * CTAEngine — Revenue Lab AI Service
 *
 * Uses gpt-5-nano (OpenAI) to generate platform-specific CTA variants for
 * offers and to score how well an offer fits a given content context.
 *
 * MODEL: gpt-5-nano
 * - generateCTAs: builds a structured prompt from the offer + platform/content
 *   type combination, calls the API, and parses the JSON response.
 * - scoreOffer: short prompt returning a single 0–100 integer score.
 *
 * Export: singleton `ctaEngine` for use across the Revenue Lab feature.
 */

import 'server-only'

import OpenAI from 'openai'
import type { OfferRow } from '@/lib/supabase/types'
import type {
  CTAVariant,
  GenerateCTAsInput,
  GenerateCTAsResult,
} from './types'

// ---------------------------------------------------------------------------
// OpenAI client
// ---------------------------------------------------------------------------

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}
const GPT_NANO_MODEL = process.env.OPENAI_NANO_MODEL ?? 'gpt-5-nano'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts JSON content from a model response that may be wrapped in a
 * markdown code block (```json … ```).
 */
function stripMarkdownCodeBlock(text: string): string {
  const match = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  if (match?.[1]) return match[1].trim()
  return text.trim()
}

/**
 * Safely reads a string field from an unknown record.
 */
function safeStr(obj: Record<string, unknown>, key: string, fallback = ''): string {
  const val = obj[key]
  return typeof val === 'string' ? val : fallback
}

/**
 * Safely reads a number field from an unknown record.
 */
function safeNum(obj: Record<string, unknown>, key: string, fallback = 0): number {
  const val = obj[key]
  return typeof val === 'number' ? val : fallback
}

/**
 * Maps an unknown urgency string to the CTAVariant union literal.
 */
function toUrgency(raw: unknown): CTAVariant['urgency_level'] {
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw
  return 'medium'
}

/**
 * Formats price_cents into a human-readable USD string.
 */
function formatPrice(priceCents: number | null): string {
  if (priceCents === null || priceCents === 0) return 'Free'
  const dollars = priceCents / 100
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/**
 * Extracts target_audience from the offer's JSON meta field.
 */
function extractTargetAudience(meta: unknown): string {
  if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) return ''
  const record = meta as Record<string, unknown>
  const audience = record['target_audience']
  return typeof audience === 'string' ? audience : ''
}

// ---------------------------------------------------------------------------
// CTAEngine
// ---------------------------------------------------------------------------

export class CTAEngine {
  /**
   * Generates CTA variants for every platform × content_type combination
   * specified in `input`. Runs each combination in parallel for speed.
   */
  async generateCTAs(
    input: GenerateCTAsInput,
    offer: OfferRow,
  ): Promise<GenerateCTAsResult> {
    const {
      offer_id,
      platforms,
      content_types,
      count_per_combination = 2,
    } = input

    const generated_at = new Date().toISOString()

    // Build all platform × content_type pairs
    const pairs: Array<{ platform: string; contentType: string }> = []
    for (const platform of platforms) {
      for (const contentType of content_types) {
        pairs.push({ platform, contentType })
      }
    }

    if (pairs.length === 0) {
      return { offer_id, variants: [], generated_at }
    }

    // Run all pairs in parallel
    const results = await Promise.allSettled(
      pairs.map(({ platform, contentType }) =>
        this.generateVariantsForPair(offer, platform, contentType, count_per_combination),
      ),
    )

    const variants: CTAVariant[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        variants.push(...result.value)
      }
    }

    return { offer_id, variants, generated_at }
  }

  /**
   * Scores how well an offer fits a given content context.
   * Returns a 0–100 integer via a fast gpt-5-nano call.
   */
  async scoreOffer(offer: OfferRow, context: string): Promise<number> {
    const price = formatPrice(offer.price_cents)
    const audience = extractTargetAudience(offer.meta)

    const prompt = [
      'You are a conversion rate expert. Score how well the following offer fits the given content context.',
      '',
      `Offer: "${offer.name}"`,
      `Type: ${offer.offer_type}`,
      `Price: ${price}`,
      `Description: ${offer.description ?? '(none)'}`,
      ...(audience ? [`Target audience: ${audience}`] : []),
      '',
      `Content context: ${context}`,
      '',
      'Respond with a single integer between 0 and 100 only. No explanation.',
    ].join('\n')

    try {
      const completion = await getOpenAI().chat.completions.create({
        model: GPT_NANO_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 8,
      })

      const raw = completion.choices[0]?.message?.content?.trim() ?? '50'
      const score = parseInt(raw, 10)
      if (isNaN(score)) return 50
      return Math.min(100, Math.max(0, score))
    } catch (err) {
      console.error('[CTAEngine.scoreOffer] Error:', err)
      return 50
    }
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /**
   * Calls gpt-5-nano for a single platform × content_type combination and
   * returns the parsed CTAVariant array.
   */
  private async generateVariantsForPair(
    offer: OfferRow,
    platform: string,
    contentType: string,
    count: number,
  ): Promise<CTAVariant[]> {
    const prompt = this.buildCTAPrompt(offer, platform, contentType, count)

    try {
      const completion = await getOpenAI().chat.completions.create({
        model: GPT_NANO_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert copywriter specialising in high-conversion social media and email CTAs. Always respond with valid JSON only — no markdown, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1200,
      })

      const text = completion.choices[0]?.message?.content ?? ''
      return this.parseCTAResponse(text, offer.id, platform, contentType)
    } catch (err) {
      console.error(
        `[CTAEngine.generateVariantsForPair] Error for ${platform}/${contentType}:`,
        err,
      )
      return []
    }
  }

  /**
   * Builds the prompt sent to gpt-5-nano for CTA generation.
   */
  private buildCTAPrompt(
    offer: OfferRow,
    platform: string,
    contentType: string,
    count: number,
  ): string {
    const price = formatPrice(offer.price_cents)
    const audience = extractTargetAudience(offer.meta)

    const variantSchema = JSON.stringify({
      headline: 'string — attention-grabbing headline',
      body: 'string — main CTA copy (platform-appropriate length)',
      button_text: 'string — short action phrase, e.g. "Get Instant Access"',
      urgency_level: '"low" | "medium" | "high"',
      tone: '"conversational" | "authoritative" | "urgent" | "educational"',
      confidence: 'number 0-100 — your confidence this will convert',
    })

    return [
      `Generate exactly ${count} CTA variant(s) for the following offer.`,
      '',
      '=== OFFER ===',
      `Name: ${offer.name}`,
      `Type: ${offer.offer_type}`,
      `Price: ${price}`,
      `Description: ${offer.description ?? '(none)'}`,
      ...(audience ? [`Target audience: ${audience}`] : []),
      `CTA URL: ${offer.cta_url ?? ''}`,
      '',
      '=== TARGET ===',
      `Platform: ${platform}`,
      `Content type: ${contentType}`,
      '',
      '=== OUTPUT FORMAT ===',
      `Return a JSON array of exactly ${count} objects. Each object must have these fields:`,
      variantSchema,
      '',
      'Tailor the copy to the platform and content type. Be specific, punchy, and benefit-led.',
      'Return JSON array only — no markdown code fences, no explanation.',
    ].join('\n')
  }

  /**
   * Parses the raw model response into CTAVariant objects.
   * Handles markdown code blocks and gracefully returns [] on parse failure.
   */
  private parseCTAResponse(
    text: string,
    offerId: string,
    platform: string,
    contentType: string,
  ): CTAVariant[] {
    const cleaned = stripMarkdownCodeBlock(text)

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch (err) {
      console.error('[CTAEngine.parseCTAResponse] JSON parse failed:', err, '\nRaw text:', text)
      return []
    }

    if (!Array.isArray(parsed)) {
      console.error('[CTAEngine.parseCTAResponse] Expected JSON array, got:', typeof parsed)
      return []
    }

    const generated_at = new Date().toISOString()

    const variants: CTAVariant[] = []

    for (const item of parsed) {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) continue

      const record = item as Record<string, unknown>

      variants.push({
        id: crypto.randomUUID(),
        offer_id: offerId,
        platform,
        content_type: contentType,
        headline: safeStr(record, 'headline', 'Check this out'),
        body: safeStr(record, 'body', ''),
        button_text: safeStr(record, 'button_text', 'Learn More'),
        urgency_level: toUrgency(record['urgency_level']),
        tone: safeStr(record, 'tone', 'conversational'),
        confidence: Math.min(100, Math.max(0, safeNum(record, 'confidence', 70))),
        generated_at,
      })
    }

    return variants
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const ctaEngine = new CTAEngine()
