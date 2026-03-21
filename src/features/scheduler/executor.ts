/**
 * Shared Executor Module — Scheduled Mission Execution Logic
 *
 * Extracted so it can be used by:
 *   1. scripts/mission-runner.ts (standalone runner on Task Scheduler)
 *   2. API routes (e.g. run-now inline execution if needed)
 *
 * This module does NOT depend on Next.js or 'server-only' — it's pure Node.js
 * so the standalone runner script can import it via tsx.
 */

import { execSync } from 'child_process'
import OpenAI from 'openai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExecutionResult {
  summary: string
  data: Record<string, unknown>
  tokensUsed: number
}

export interface ExecutorConfig {
  openaiApiKey: string
  nanoModel: string
  /** Extra env vars to pass to claude -p subprocess */
  env?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Auto-routing heuristic
// ---------------------------------------------------------------------------

const HEAVY_KEYWORDS = [
  'research', 'analyze', 'generate content', 'write article', 'create post',
  'plan', 'strategy', 'deep dive', 'comprehensive', 'multi-step',
  'browse', 'scrape', 'web', 'compare', 'evaluate', 'report',
]

/**
 * Determines if an instruction should be routed to the heavy model (Claude).
 * Uses instruction length and keyword matching.
 */
export function shouldAutoRouteToHeavy(instruction: string): boolean {
  const lower = instruction.toLowerCase()

  // Long instructions usually need reasoning
  if (instruction.length > 500) return true

  // Check for heavy-task keywords
  return HEAVY_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * Resolves 'auto' mode to either 'light' or 'heavy' based on the instruction.
 */
export function resolveExecutionMode(
  mode: 'light' | 'heavy' | 'auto' | string,
  instruction: string,
): 'light' | 'heavy' {
  if (mode === 'light') return 'light'
  if (mode === 'heavy') return 'heavy'
  return shouldAutoRouteToHeavy(instruction) ? 'heavy' : 'light'
}

// ---------------------------------------------------------------------------
// Light execution — GPT-5 Nano
// ---------------------------------------------------------------------------

/**
 * Execute a mission using GPT-5 Nano (fast, cheap).
 * Single-turn JSON completion — no tool use.
 */
export async function executeLightMission(
  instruction: string,
  config: ExecutorConfig,
): Promise<ExecutionResult> {
  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  const response = await openai.chat.completions.create({
    model: config.nanoModel,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are Agent MOE, an autonomous marketing AI operator. Execute the task and return results as JSON with keys: "summary" (1-3 sentence result summary) and "data" (structured output relevant to the task).',
      },
      { role: 'user', content: instruction },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw) as Record<string, unknown>
  const tokensUsed =
    (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0)

  return {
    summary: typeof parsed['summary'] === 'string' ? parsed['summary'] : raw.slice(0, 500),
    data: parsed,
    tokensUsed,
  }
}

// ---------------------------------------------------------------------------
// Heavy execution — claude -p subprocess
// ---------------------------------------------------------------------------

/**
 * Execute a mission using `claude -p` subprocess (free via Max subscription).
 * Runs synchronously with a 2-minute timeout.
 */
export function executeHeavyMission(
  instruction: string,
  config: ExecutorConfig,
): ExecutionResult {
  const prompt = `You are Agent MOE, an autonomous marketing AI operator. Execute this task:\n\n${instruction}\n\nReturn your response as JSON with keys: "summary" (1-3 sentence result summary) and "data" (structured output).`

  const output = execSync(`echo ${JSON.stringify(prompt)} | claude -p --output-format json`, {
    encoding: 'utf-8',
    timeout: 120_000,
    cwd: process.cwd(),
    env: { ...process.env, ...(config.env ?? {}) },
  })

  let result: Record<string, unknown>
  try {
    const envelope = JSON.parse(output) as Record<string, unknown>
    const text = typeof envelope['result'] === 'string' ? envelope['result'] : output

    try {
      result = JSON.parse(text) as Record<string, unknown>
    } catch {
      result = { summary: text.slice(0, 500), data: { raw_output: text } }
    }
  } catch {
    result = { summary: output.slice(0, 500), data: { raw_output: output } }
  }

  return {
    summary: typeof result['summary'] === 'string' ? result['summary'] : output.slice(0, 500),
    data: result,
    tokensUsed: 0,
  }
}

// ---------------------------------------------------------------------------
// Schedule computation
// ---------------------------------------------------------------------------

/**
 * Compute the next run time based on schedule type.
 * Returns null for one-shot ('once') missions or unknown types.
 */
export function computeNextRun(
  scheduleType: string,
  _cronExpression: string | null,
  _timezone: string,
): Date | null {
  const now = new Date()

  switch (scheduleType) {
    case 'once':
      return null

    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000)

    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)

    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    case 'custom_cron':
      // Basic fallback — in production use a proper cron parser
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)

    default:
      return null
  }
}
