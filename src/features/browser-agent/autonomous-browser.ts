/**
 * AutonomousBrowser — Claude Computer Use agent loop
 *
 * Sends screenshots to Claude via the Computer Use beta API,
 * executes the actions Claude returns via Playwright, and repeats
 * until the task is complete or max iterations are reached.
 *
 * Import: server-side only (uses Playwright + Anthropic SDK)
 */

import type { Page } from 'playwright'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutonomousStep {
  /** Step number (1-indexed) */
  step: number
  /** Action Claude requested */
  action: string
  /** Claude's reasoning text (if any) */
  reasoning?: string
  /** Parameters for the action */
  params?: Record<string, unknown>
  /** Base64 screenshot taken after action */
  screenshot?: string
  /** Time taken for this step in ms */
  duration_ms: number
}

export interface AutonomousResult {
  /** Whether the task completed successfully */
  success: boolean
  /** Final text output from Claude */
  output?: string
  /** All steps taken during execution */
  steps: AutonomousStep[]
  /** Total number of iterations */
  total_steps: number
  /** Total execution time in ms */
  total_duration_ms: number
  /** Error message if failed */
  error?: string
  /** Final page URL */
  final_url?: string
  /** Final page title */
  page_title?: string
}

export interface AutonomousOptions {
  /** Claude model to use (default: claude-sonnet-4-5-20250514) */
  model?: string
  /** Max agent loop iterations (default: 25) */
  maxIterations?: number
  /** Timeout per Claude API call in ms (default: 60000) */
  apiTimeout?: number
  /** Callback fired after each step (for real-time streaming) */
  onStep?: (step: AutonomousStep) => void
  /** AbortSignal to cancel the agent loop (e.g., from task cancellation) */
  abortSignal?: AbortSignal
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250514'
const DEFAULT_MAX_ITERATIONS = 25
const DEFAULT_API_TIMEOUT = 60_000
const VIEWPORT = { width: 1280, height: 720 }

const SYSTEM_PROMPT = `You are a browser automation agent. You control a web browser to complete tasks given by the user.

Rules:
- Take screenshots to understand the current page state
- Click, type, scroll, and navigate to accomplish the user's goal
- Be efficient — take the most direct path to completing the task
- If you encounter a CAPTCHA or login wall you cannot bypass, report it
- When the task is complete, respond with a text summary of what you accomplished
- Do NOT explain your actions excessively — just do them`

/** Common CAPTCHA/block indicators to detect in Claude's responses */
const CAPTCHA_KEYWORDS = [
  'captcha', 'recaptcha', 'hcaptcha', 'verify you are human',
  'prove you are not a robot', 'access denied', 'blocked',
  'cloudflare', 'security check', 'bot detection',
]

// ---------------------------------------------------------------------------
// AutonomousBrowser
// ---------------------------------------------------------------------------

export class AutonomousBrowser {
  private anthropicClient: unknown = null

  /**
   * Run an autonomous browser task.
   * Takes control of the given Playwright page and drives it via Claude Computer Use.
   */
  async run(
    page: Page,
    instruction: string,
    options: AutonomousOptions = {},
  ): Promise<AutonomousResult> {
    const model = options.model ?? DEFAULT_MODEL
    const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS
    const apiTimeout = options.apiTimeout ?? DEFAULT_API_TIMEOUT
    const onStep = options.onStep

    const steps: AutonomousStep[] = []
    const totalStart = Date.now()

    try {
      // Initialize Anthropic client
      const client = await this.getClient()

      // Take initial screenshot
      const initialScreenshot = await this.takeScreenshot(page)

      // Build initial messages
      const messages: Array<Record<string, unknown>> = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: initialScreenshot,
              },
            },
            {
              type: 'text',
              text: instruction,
            },
          ],
        },
      ]

      // Agent loop
      for (let i = 0; i < maxIterations; i++) {

        // Check if aborted
        if (options.abortSignal?.aborted) {
          const pageTitle = await page.title().catch(() => '')
          return {
            success: false,
            output: 'Task was cancelled.',
            steps,
            total_steps: steps.length,
            total_duration_ms: Date.now() - totalStart,
            error: 'Task cancelled by user',
            final_url: page.url(),
            page_title: pageTitle,
          }
        }

        const stepStart = Date.now()

        // Call Claude with computer use tool
        const response = await this.callClaude(client, model, messages, apiTimeout)

        // Add assistant response to conversation
        messages.push({ role: 'assistant', content: response.content })

        // Check if Claude is done (no tool use, just text)
        const toolUses = (response.content as Array<Record<string, unknown>>).filter(
          (block: Record<string, unknown>) => block.type === 'tool_use'
        )

        // Extract any text reasoning
        const textBlocks = (response.content as Array<Record<string, unknown>>).filter(
          (block: Record<string, unknown>) => block.type === 'text'
        )
        const reasoning = textBlocks
          .map((b: Record<string, unknown>) => b.text as string)
          .filter(Boolean)
          .join('\n')

        // Check for CAPTCHA/block indicators in Claude's response
        const lowerReasoning = reasoning.toLowerCase()
        const detectedCaptcha = CAPTCHA_KEYWORDS.some((kw) => lowerReasoning.includes(kw))
        if (detectedCaptcha && toolUses.length === 0) {
          const pageTitle = await page.title().catch(() => '')
          return {
            success: false,
            output: reasoning,
            steps,
            total_steps: steps.length,
            total_duration_ms: Date.now() - totalStart,
            error: 'CAPTCHA or access block detected. The page requires human verification.',
            final_url: page.url(),
            page_title: pageTitle,
          }
        }

        if (toolUses.length === 0) {
          // Claude is done — return final result
          const step: AutonomousStep = {
            step: i + 1,
            action: 'complete',
            reasoning: reasoning || undefined,
            duration_ms: Date.now() - stepStart,
          }
          steps.push(step)
          onStep?.(step)

          const pageTitle = await page.title().catch(() => '')
          return {
            success: true,
            output: reasoning || 'Task completed.',
            steps,
            total_steps: steps.length,
            total_duration_ms: Date.now() - totalStart,
            final_url: page.url(),
            page_title: pageTitle,
          }
        }

        // Execute each tool use action
        const toolResults: Array<Record<string, unknown>> = []

        for (const toolUse of toolUses) {
          const input = toolUse.input as Record<string, unknown>
          const action = input.action as string

          // Execute the action via Playwright
          const screenshotBase64 = await this.executeAction(page, action, input)

          const step: AutonomousStep = {
            step: i + 1,
            action,
            reasoning: reasoning || undefined,
            params: { ...input, action: undefined },
            screenshot: screenshotBase64,
            duration_ms: Date.now() - stepStart,
          }
          steps.push(step)
          onStep?.(step)

          // Build tool result with screenshot
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id as string,
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshotBase64,
                },
              },
            ],
          })
        }

        // Add tool results to conversation
        messages.push({ role: 'user', content: toolResults })
      }

      // Max iterations reached
      const pageTitle = await page.title().catch(() => '')
      return {
        success: false,
        output: `Reached maximum iterations (${maxIterations}). Task may be incomplete.`,
        steps,
        total_steps: steps.length,
        total_duration_ms: Date.now() - totalStart,
        error: `Max iterations (${maxIterations}) exceeded`,
        final_url: page.url(),
        page_title: pageTitle,
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        steps,
        total_steps: steps.length,
        total_duration_ms: Date.now() - totalStart,
        error: errorMsg,
        final_url: page.url(),
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Playwright action executor
  // ---------------------------------------------------------------------------

  private async executeAction(
    page: Page,
    action: string,
    input: Record<string, unknown>,
  ): Promise<string> {
    const coord = input.coordinate as [number, number] | undefined

    try {
    switch (action) {
      case 'screenshot': {
        // Just take a screenshot, no action needed
        break
      }

      case 'left_click': {
        if (coord) {
          await page.mouse.click(coord[0], coord[1])
          await page.waitForTimeout(500)
        }
        break
      }

      case 'right_click': {
        if (coord) {
          await page.mouse.click(coord[0], coord[1], { button: 'right' })
          await page.waitForTimeout(300)
        }
        break
      }

      case 'double_click': {
        if (coord) {
          await page.mouse.dblclick(coord[0], coord[1])
          await page.waitForTimeout(500)
        }
        break
      }

      case 'middle_click': {
        if (coord) {
          await page.mouse.click(coord[0], coord[1], { button: 'middle' })
          await page.waitForTimeout(300)
        }
        break
      }

      case 'triple_click': {
        if (coord) {
          await page.mouse.click(coord[0], coord[1], { clickCount: 3 })
          await page.waitForTimeout(300)
        }
        break
      }

      case 'mouse_move': {
        if (coord) {
          await page.mouse.move(coord[0], coord[1])
        }
        break
      }

      case 'type': {
        const text = input.text as string
        if (text) {
          await page.keyboard.type(text, { delay: 30 })
          await page.waitForTimeout(200)
        }
        break
      }

      case 'key': {
        const key = input.text as string
        if (key) {
          await page.keyboard.press(key)
          await page.waitForTimeout(300)
        }
        break
      }

      case 'hold_key': {
        const holdKey = input.text as string
        const holdDuration = (input.duration as number) ?? 500
        if (holdKey) {
          await page.keyboard.down(holdKey)
          await page.waitForTimeout(holdDuration)
          await page.keyboard.up(holdKey)
        }
        break
      }

      case 'scroll': {
        const scrollCoord = coord ?? [VIEWPORT.width / 2, VIEWPORT.height / 2]
        const direction = input.scroll_direction as string ?? 'down'
        const amount = (input.scroll_amount as number) ?? 3
        const deltaY = direction === 'down' || direction === 'right'
          ? amount * 100
          : -(amount * 100)
        const deltaX = direction === 'left' || direction === 'right'
          ? (direction === 'right' ? amount * 100 : -(amount * 100))
          : 0

        await page.mouse.move(scrollCoord[0], scrollCoord[1])
        await page.mouse.wheel(
          direction === 'left' || direction === 'right' ? deltaX : 0,
          direction === 'up' || direction === 'down' ? deltaY : 0,
        )
        await page.waitForTimeout(500)
        break
      }

      case 'left_click_drag': {
        const startCoord = input.start_coordinate as [number, number]
        if (coord && startCoord) {
          await page.mouse.move(startCoord[0], startCoord[1])
          await page.mouse.down()
          await page.mouse.move(coord[0], coord[1], { steps: 10 })
          await page.mouse.up()
          await page.waitForTimeout(300)
        }
        break
      }

      case 'wait': {
        const waitMs = (input.duration as number) ?? 2000
        await page.waitForTimeout(Math.min(waitMs, 10_000))
        break
      }

      default: {
        console.warn(`[AutonomousBrowser] Unknown action: ${action}`)
        break
      }
    }

    } catch (actionErr) {
      console.warn(`[AutonomousBrowser] Action "${action}" failed:`, actionErr)
      // Don't throw — return screenshot so Claude can see the current state and adapt
    }

    // Always return a screenshot after the action
    return this.takeScreenshot(page)
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async takeScreenshot(page: Page): Promise<string> {
    const buffer = await page.screenshot({ type: 'png' })
    return buffer.toString('base64')
  }

  private async getClient(): Promise<unknown> {
    if (this.anthropicClient) return this.anthropicClient

    const apiKey = process.env['ANTHROPIC_API_KEY']
    if (!apiKey) {
      throw new Error(
        '[AutonomousBrowser] ANTHROPIC_API_KEY is required for autonomous browser tasks. ' +
        'Computer Use requires the direct Anthropic API (not the Agent SDK).'
      )
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    this.anthropicClient = new Anthropic({
      apiKey,
      timeout: 120_000,
    })

    return this.anthropicClient
  }

  private async callClaude(
    client: unknown,
    model: string,
    messages: Array<Record<string, unknown>>,
    timeout: number,
  ): Promise<{ content: Array<Record<string, unknown>> }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anthropic = client as any

    const response = await Promise.race([
      anthropic.beta.messages.create({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [
          {
            type: 'computer_20250124',
            name: 'computer',
            display_width_px: VIEWPORT.width,
            display_height_px: VIEWPORT.height,
            display_number: 1,
          },
        ],
        messages,
        betas: ['computer-use-2025-01-24'],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Claude API call timed out')), timeout)
      ),
    ])

    return response as { content: Array<Record<string, unknown>> }
  }
}
