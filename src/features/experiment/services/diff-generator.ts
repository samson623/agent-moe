/**
 * Autoresearch Loop — Diff Generator
 *
 * Produces a 1-2 sentence human-readable summary of what changed between
 * two iterations of an experiment and why it might matter.
 *
 * Uses GPT-5 Nano — cheap, fast, single-turn. No tool use needed.
 * Sent to Telegram morning digest so the user understands each iteration
 * without reading raw content diffs.
 *
 * Baseline (no previous content): returns a fixed string, no API call.
 */

import OpenAI from 'openai'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GPT_NANO_MODEL = process.env['OPENAI_NANO_MODEL'] ?? 'gpt-5-nano'
const MAX_CONTENT_CHARS = 1200  // Truncate each side before sending to GPT-5 Nano

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const DiffOutputSchema = z.object({
  summary: z.string(),
})

// ---------------------------------------------------------------------------
// generateDiffSummary
// ---------------------------------------------------------------------------

/**
 * Summarize what changed between two content iterations.
 *
 * @param previousContent  The prior iteration's content (or null for baseline)
 * @param newContent       The current iteration's content
 * @param goal             The experiment goal (provides context for the diff)
 * @returns                1-2 sentence plain-English summary, never empty
 */
export async function generateDiffSummary(
  previousContent: string | null,
  newContent: string,
  goal: string,
): Promise<string> {
  // Baseline — no prior to compare, no API call needed
  if (!previousContent) {
    return 'Baseline content established.'
  }

  // Identical content — skip API call
  if (previousContent.trim() === newContent.trim()) {
    return 'No meaningful change from prior iteration.'
  }

  try {
    const client = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })

    const prevTruncated = truncate(previousContent, MAX_CONTENT_CHARS)
    const newTruncated  = truncate(newContent, MAX_CONTENT_CHARS)

    const response = await client.chat.completions.create({
      model: GPT_NANO_MODEL,
      max_tokens: 128,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a concise experiment analyst. Compare two versions of content and write a 1-2 sentence plain-English summary of what changed and why it might affect the outcome. Focus on structural or strategic changes, not surface wording. Respond with JSON: {"summary": "<1-2 sentences>"}',
        },
        {
          role: 'user',
          content: `EXPERIMENT GOAL: ${goal}

PREVIOUS VERSION:
${prevTruncated}

NEW VERSION:
${newTruncated}

What changed, and why might it matter? Respond with JSON only.`,
        },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const parsed = DiffOutputSchema.safeParse(JSON.parse(raw))

    if (parsed.success && parsed.data.summary.trim()) {
      return parsed.data.summary.trim()
    }

    return 'Content updated — diff summary unavailable.'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[DiffGenerator] GPT-5 Nano call failed:', msg)
    return 'Content updated — diff summary failed.'
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + `\n…[truncated ${text.length - maxChars} chars]`
}
