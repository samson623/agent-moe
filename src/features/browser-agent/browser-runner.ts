/**
 * BrowserRunner — Low-level Playwright execution engine
 *
 * Pure Playwright — no AI, no DB. Just drives a headless browser and returns
 * structured results. Handles all 8 browser task types.
 *
 * Import: `import { BrowserRunner } from '@/features/browser-agent/browser-runner'`
 * NOTE: Only import this server-side. Playwright is a Node.js-only library.
 */

import type { Browser, Page } from 'playwright'
import type { BrowserTask, BrowserTaskResult, BrowserTaskConfig } from './types'
import { Screencast } from './screencast'
import type { ScreencastOptions } from './screencast'

// ---------------------------------------------------------------------------
// BrowserRunner
// ---------------------------------------------------------------------------

export class BrowserRunner {
  private browser: Browser | null = null
  private readonly browserTypeName: 'chromium' | 'firefox' | 'webkit'
  private screencast: Screencast | null = null

  constructor(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium') {
    this.browserTypeName = browserType
  }

  async launch(): Promise<void> {
    // Dynamic import so this module only loads Playwright server-side
    const playwright = await import('playwright')
    const browserLib = playwright[this.browserTypeName]
    this.browser = await browserLib.launch({ headless: true })
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async executeTask(task: BrowserTask): Promise<BrowserTaskResult> {
    if (!this.browser) {
      throw new Error('BrowserRunner not launched. Call launch() first.')
    }

    const start = Date.now()
    const context = await this.browser.newContext({
      viewport: task.config.viewport ?? { width: 1280, height: 720 },
      userAgent: task.config.user_agent,
    })
    const page = await context.newPage()

    try {
      // Start screencast if live view is enabled
      if (task.config.enable_live_view) {
        this.screencast = new Screencast()
        const screencastOpts: ScreencastOptions = {
          format: task.config.screencast_format ?? 'jpeg',
          quality: task.config.screencast_quality ?? 60,
          maxWidth: task.config.viewport?.width ?? 1280,
          maxHeight: task.config.viewport?.height ?? 720,
        }
        await this.screencast.start(page, screencastOpts)
      }

      let result: BrowserTaskResult

      switch (task.task_type) {
        case 'scrape':
          result = await this.scrape(page, task)
          break
        case 'screenshot':
          result = await this.screenshot(page, task)
          break
        case 'click':
          result = await this.click(page, task)
          break
        case 'fill_form':
          result = await this.fillForm(page, task)
          break
        case 'navigate':
          result = await this.navigate(page, task)
          break
        case 'extract_data':
          result = await this.extractData(page, task)
          break
        case 'submit_form':
          result = await this.submitForm(page, task)
          break
        case 'monitor':
          result = await this.monitor(page, task)
          break
        default:
          result = this.buildResult(false, { error: `Unknown task type: ${String(task.task_type)}` })
      }

      // Stop screencast and record frame count
      if (this.screencast) {
        await this.screencast.stop()
        result.screencast_frames = this.screencast.getFrameCount()
      }

      result.execution_time_ms = Date.now() - start
      return result
    } catch (err) {
      // Stop screencast on error too
      if (this.screencast) {
        await this.screencast.stop().catch(() => {})
      }

      return this.buildResult(false, {
        error: err instanceof Error ? err.message : String(err),
        execution_time_ms: Date.now() - start,
      })
    } finally {
      this.screencast = null
      await context.close()
    }
  }

  /**
   * Get the active screencast instance (if live view is enabled).
   * Used by TaskExecutor to wire up WebSocket streaming / recording.
   */
  getScreencast(): Screencast | null {
    return this.screencast
  }

  // ---------------------------------------------------------------------------
  // Task handlers
  // ---------------------------------------------------------------------------

  private async scrape(page: Page, task: BrowserTask): Promise<BrowserTaskResult> {
    try {
      await this.navigateToUrl(page, task.url, task.config)

      const [pageTitle, finalUrl, textContent, links, htmlSnapshot] = await Promise.all([
        page.title(),
        Promise.resolve(page.url()),
        page.evaluate(() => document.body?.innerText?.slice(0, 100_000) ?? ''),
        page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href]'))
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((href) => href.startsWith('http'))
            .slice(0, 200)
        ),
        page.evaluate(() => document.documentElement.innerHTML.slice(0, 50_000)),
      ])

      return this.buildResult(true, {
        page_title: pageTitle,
        final_url: finalUrl,
        text_content: textContent,
        links,
        html_snapshot: htmlSnapshot,
      })
    } catch (err) {
      return this.buildResult(false, { error: err instanceof Error ? err.message : String(err) })
    }
  }

  private async screenshot(page: Page, task: BrowserTask): Promise<BrowserTaskResult> {
    try {
      await this.navigateToUrl(page, task.url, task.config)

      const screenshotBuffer = await page.screenshot({ fullPage: true })
      const base64 = screenshotBuffer.toString('base64')
      const pageTitle = await page.title()

      return this.buildResult(true, {
        page_title: pageTitle,
        final_url: page.url(),
        data: { screenshot_base64: base64, mime_type: 'image/png' },
      })
    } catch (err) {
      return this.buildResult(false, { error: err instanceof Error ? err.message : String(err) })
    }
  }

  private async click(page: Page, task: BrowserTask): Promise<BrowserTaskResult> {
    try {
      await this.navigateToUrl(page, task.url, task.config)

      const selector = task.config.click_selector
      if (!selector) {
        return this.buildResult(false, { error: 'click_selector is required for click tasks' })
      }

      await page.waitForSelector(selector, { timeout: task.config.timeout_ms ?? 10000 })
      await page.click(selector)
      await page.waitForLoadState('networkidle').catch(() => { /* timeout OK */ })

      const [pageTitle, textContent] = await Promise.all([
        page.title(),
        page.evaluate(() => document.body?.innerText?.slice(0, 50_000) ?? ''),
      ])

      return this.buildResult(true, {
        page_title: pageTitle,
        final_url: page.url(),
        text_content: textContent,
        data: { clicked_selector: selector },
      })
    } catch (err) {
      return this.buildResult(false, { error: err instanceof Error ? err.message : String(err) })
    }
  }

  private async fillForm(page: Page, task: BrowserTask): Promise<BrowserTaskResult> {
    try {
      await this.navigateToUrl(page, task.url, task.config)

      const formData = task.config.form_data ?? {}
      const selectors = task.config.selectors ?? {}

      for (const [fieldName, value] of Object.entries(formData)) {
        const selector = selectors[fieldName] ?? `[name="${fieldName}"]`
        await page.fill(selector, value).catch(() => {
          console.warn(`[BrowserRunner] Could not fill field: ${fieldName}`)
        })
      }

      const pageTitle = await page.title()
      return this.buildResult(true, {
        page_title: pageTitle,
        final_url: page.url(),
        data: { fields_filled: Object.keys(formData).length },
      })
    } catch (err) {
      return this.buildResult(false, { error: err instanceof Error ? err.message : String(err) })
    }
  }

  private async navigate(page: Page, task: BrowserTask): Promise<BrowserTaskResult> {
    try {
      await this.navigateToUrl(page, task.url, task.config)

      const [pageTitle, finalUrl, statusCode] = await Promise.all([
        page.title(),
        Promise.resolve(page.url()),
        page.evaluate(() => {
          // Try to get HTTP status from performance entries
          const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
          return entries[0]?.responseStatus ?? null
        }),
      ])

      return this.buildResult(true, {
        page_title: pageTitle,
        final_url: finalUrl,
        data: {
          status_code: statusCode,
          redirected: finalUrl !== task.url,
        },
      })
    } catch (err) {
      return this.buildResult(false, { error: err instanceof Error ? err.message : String(err) })
    }
  }

  private async extractData(page: Page, task: BrowserTask): Promise<BrowserTaskResult> {
    try {
      await this.navigateToUrl(page, task.url, task.config)

      const selectors = task.config.selectors ?? {}
      const fields = task.config.extract_fields ?? Object.keys(selectors)
      const extracted: Record<string, unknown> = {}

      for (const field of fields) {
        const selector = selectors[field]
        if (!selector) continue
        try {
          const element = await page.$(selector)
          if (element) {
            extracted[field] = await element.innerText()
          }
        } catch {
          extracted[field] = null
        }
      }

      const pageTitle = await page.title()
      return this.buildResult(true, {
        page_title: pageTitle,
        final_url: page.url(),
        data: extracted,
      })
    } catch (err) {
      return this.buildResult(false, { error: err instanceof Error ? err.message : String(err) })
    }
  }

  private async submitForm(page: Page, task: BrowserTask): Promise<BrowserTaskResult> {
    try {
      // Fill first
      await this.navigateToUrl(page, task.url, task.config)

      const formData = task.config.form_data ?? {}
      const selectors = task.config.selectors ?? {}

      for (const [fieldName, value] of Object.entries(formData)) {
        const selector = selectors[fieldName] ?? `[name="${fieldName}"]`
        await page.fill(selector, value).catch(() => {})
      }

      // Then submit
      const submitSelector = selectors['submit'] ?? 'button[type="submit"]'
      await page.click(submitSelector)
      await page.waitForLoadState('networkidle').catch(() => {})

      const [pageTitle, textContent] = await Promise.all([
        page.title(),
        page.evaluate(() => document.body?.innerText?.slice(0, 30_000) ?? ''),
      ])

      return this.buildResult(true, {
        page_title: pageTitle,
        final_url: page.url(),
        text_content: textContent,
        data: { submitted: true, fields_filled: Object.keys(formData).length },
      })
    } catch (err) {
      return this.buildResult(false, { error: err instanceof Error ? err.message : String(err) })
    }
  }

  private async monitor(page: Page, task: BrowserTask): Promise<BrowserTaskResult> {
    try {
      await this.navigateToUrl(page, task.url, task.config)

      const selectors = task.config.selectors ?? {}
      const monitored: Record<string, unknown> = {}

      // Extract values for each monitored selector
      for (const [key, selector] of Object.entries(selectors)) {
        try {
          const element = await page.$(selector)
          if (element) {
            monitored[key] = await element.innerText()
          }
        } catch {
          monitored[key] = null
        }
      }

      const [pageTitle, textContent] = await Promise.all([
        page.title(),
        page.evaluate(() => document.body?.innerText?.slice(0, 20_000) ?? ''),
      ])

      return this.buildResult(true, {
        page_title: pageTitle,
        final_url: page.url(),
        text_content: textContent,
        data: {
          monitored_values: monitored,
          checked_at: new Date().toISOString(),
        },
      })
    } catch (err) {
      return this.buildResult(false, { error: err instanceof Error ? err.message : String(err) })
    }
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  private async navigateToUrl(
    page: Page,
    url: string,
    config: BrowserTaskConfig,
  ): Promise<void> {
    const waitUntil = config.wait_for ?? 'domcontentloaded'
    const timeout = config.timeout_ms ?? 30000

    await page.goto(url, { waitUntil, timeout })

    if (config.scroll_to_bottom) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
    }
  }

  private buildResult(
    success: boolean,
    data: Partial<BrowserTaskResult>,
  ): BrowserTaskResult {
    return {
      success,
      ...data,
    }
  }
}
