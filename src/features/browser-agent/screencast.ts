/**
 * Screencast — CDP-based live frame capture for browser tasks
 *
 * Uses Chrome DevTools Protocol Page.screencast to stream JPEG frames
 * from a headless Playwright browser. Frames can be consumed by:
 *   1. WebSocket server (for live browser view in UI)
 *   2. FFmpeg recorder (for MP4 recording)
 *
 * Import: server-side only (depends on Playwright CDPSession)
 */

import type { CDPSession, Page, BrowserContext } from 'playwright'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreencastOptions {
  /** Image format for frames */
  format?: 'jpeg' | 'png'
  /** JPEG quality 0-100 (ignored for PNG) */
  quality?: number
  /** Max frame width in pixels */
  maxWidth?: number
  /** Max frame height in pixels */
  maxHeight?: number
  /** Capture every Nth frame (1 = all frames) */
  everyNthFrame?: number
}

export interface ScreencastFrame {
  /** Raw image data (base64-decoded) */
  data: Buffer
  /** Base64-encoded image data (for direct streaming) */
  base64: string
  /** Frame metadata from CDP */
  metadata: {
    offsetTop: number
    pageScaleFactor: number
    deviceWidth: number
    deviceHeight: number
    scrollOffsetX: number
    scrollOffsetY: number
    timestamp?: number
  }
  /** CDP session ID for this frame */
  sessionId: number
  /** Sequential frame number */
  frameNumber: number
}

export type FrameCallback = (frame: ScreencastFrame) => void

// ---------------------------------------------------------------------------
// Default options
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS: Required<ScreencastOptions> = {
  format: 'jpeg',
  quality: 60,
  maxWidth: 1280,
  maxHeight: 720,
  everyNthFrame: 1,
}

// ---------------------------------------------------------------------------
// Screencast
// ---------------------------------------------------------------------------

export class Screencast {
  private cdpSession: CDPSession | null = null
  private active = false
  private frameCount = 0
  private subscribers = new Set<FrameCallback>()
  private frameBuffer: ScreencastFrame[] = []
  private readonly maxBufferSize: number
  private options: Required<ScreencastOptions> = { ...DEFAULT_OPTIONS }

  constructor(maxBufferSize = 60) {
    this.maxBufferSize = maxBufferSize
  }

  /**
   * Attach to a Playwright page and start capturing screencast frames.
   * Must be called AFTER the page is created but BEFORE navigation.
   */
  async start(page: Page, options: ScreencastOptions = {}): Promise<void> {
    if (this.active) {
      throw new Error('Screencast already active. Call stop() first.')
    }

    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.frameCount = 0
    this.frameBuffer = []
    this.active = true

    // Create CDP session from the page's browser context
    const context: BrowserContext = page.context()
    this.cdpSession = await context.newCDPSession(page)

    // Listen for incoming frames
    this.cdpSession.on('Page.screencastFrame', (params: {
      data: string
      metadata: ScreencastFrame['metadata']
      sessionId: number
    }) => {
      if (!this.active || !this.cdpSession) return

      // Acknowledge frame immediately to keep receiving
      this.cdpSession.send('Page.screencastFrameAck', {
        sessionId: params.sessionId,
      }).catch(() => { /* session may be closed */ })

      this.frameCount++

      const frame: ScreencastFrame = {
        data: Buffer.from(params.data, 'base64'),
        base64: params.data,
        metadata: params.metadata,
        sessionId: params.sessionId,
        frameNumber: this.frameCount,
      }

      // Ring buffer — drop oldest frame when full
      this.frameBuffer.push(frame)
      if (this.frameBuffer.length > this.maxBufferSize) {
        this.frameBuffer.shift()
      }

      // Notify all subscribers
      for (const cb of this.subscribers) {
        try {
          cb(frame)
        } catch (err) {
          console.error('[Screencast] Subscriber error:', err)
        }
      }
    })

    // Start the CDP screencast
    await this.cdpSession.send('Page.startScreencast', {
      format: this.options.format,
      quality: this.options.quality,
      maxWidth: this.options.maxWidth,
      maxHeight: this.options.maxHeight,
      everyNthFrame: this.options.everyNthFrame,
    })

    console.log(
      `[Screencast] Started — ${this.options.format} @ quality=${this.options.quality}, ` +
      `${this.options.maxWidth}x${this.options.maxHeight}, every ${this.options.everyNthFrame} frame(s)`
    )
  }

  /**
   * Stop capturing and detach from CDP session.
   * Returns all buffered frames (useful for recording).
   */
  async stop(): Promise<ScreencastFrame[]> {
    if (!this.active) {
      return []
    }

    this.active = false

    if (this.cdpSession) {
      try {
        await this.cdpSession.send('Page.stopScreencast')
      } catch {
        // CDP session may already be closed (browser closed, page navigated away, etc.)
      }

      try {
        await this.cdpSession.detach()
      } catch {
        // Already detached
      }

      this.cdpSession = null
    }

    const frames = [...this.frameBuffer]
    console.log(`[Screencast] Stopped — captured ${this.frameCount} frames, ${frames.length} buffered`)
    return frames
  }

  /**
   * Subscribe to incoming frames. Returns an unsubscribe function.
   */
  subscribe(callback: FrameCallback): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Get the total number of frames captured since start().
   */
  getFrameCount(): number {
    return this.frameCount
  }

  /**
   * Check if the screencast is currently active.
   */
  isActive(): boolean {
    return this.active
  }

  /**
   * Get a copy of the current frame buffer (most recent frames).
   */
  getBufferedFrames(): ScreencastFrame[] {
    return [...this.frameBuffer]
  }

  /**
   * Get the most recent frame, or null if none captured yet.
   */
  getLatestFrame(): ScreencastFrame | null {
    return this.frameBuffer.length > 0
      ? this.frameBuffer[this.frameBuffer.length - 1] ?? null
      : null
  }

  /**
   * Get the current screencast options.
   */
  getOptions(): Required<ScreencastOptions> {
    return { ...this.options }
  }
}
