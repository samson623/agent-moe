/**
 * Recorder — FFmpeg-based MP4 recording from screencast frames
 *
 * Subscribes to a Screencast instance and pipes JPEG frames to FFmpeg,
 * producing an H.264 MP4 file. Each browser task can optionally record
 * its execution for later playback or download.
 *
 * Import: server-side only (uses child_process)
 */

import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import { mkdirSync, existsSync } from 'fs'
import path from 'path'
import type { Screencast } from './screencast'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecordingQuality = 'low' | 'medium' | 'high'

export interface RecorderOptions {
  /** Directory to save recordings (default: public/browser-recordings) */
  outputDir?: string
  /** Encoding quality preset */
  quality?: RecordingQuality
  /** Target framerate for the output video */
  fps?: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** CRF (Constant Rate Factor) values — lower = higher quality, larger file */
const QUALITY_CRF: Record<RecordingQuality, number> = {
  low: 28,
  medium: 23,
  high: 18,
}

const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'public', 'browser-recordings')
const DEFAULT_FPS = 10
const FINALIZE_TIMEOUT_MS = 30_000

// ---------------------------------------------------------------------------
// Recorder
// ---------------------------------------------------------------------------

export class Recorder {
  private ffmpegProcess: ChildProcess | null = null
  private unsubscribe: (() => void) | null = null
  private outputPath = ''
  private frameCount = 0
  private recording = false
  private ffmpegErrors: string[] = []

  /**
   * Start recording frames from a screencast into an MP4 file.
   * Must be called after screencast.start() so frames are flowing.
   */
  async start(
    screencast: Screencast,
    taskId: string,
    options: RecorderOptions = {},
  ): Promise<void> {
    if (this.recording) {
      throw new Error('Recorder already active. Call stop() first.')
    }

    const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR
    const quality = options.quality ?? 'medium'
    const fps = options.fps ?? DEFAULT_FPS
    const crf = QUALITY_CRF[quality]

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    this.outputPath = path.join(outputDir, `${taskId}.mp4`)
    this.recording = true
    this.frameCount = 0
    this.ffmpegErrors = []

    // Resolve FFmpeg binary path
    const ffmpegPath = await this.resolveFFmpegPath()

    // Spawn FFmpeg: read JPEG frames from stdin, encode to H.264 MP4
    this.ffmpegProcess = spawn(ffmpegPath, [
      // Input: JPEG frames piped via stdin
      '-f', 'image2pipe',
      '-framerate', String(fps),
      '-vcodec', 'mjpeg',
      '-i', 'pipe:0',
      // Output: H.264 MP4
      '-c:v', 'libx264',
      '-crf', String(crf),
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      // Overwrite output if exists
      '-y',
      this.outputPath,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // Capture stderr for debugging
    this.ffmpegProcess.stderr?.on('data', (chunk: Buffer) => {
      const line = chunk.toString().trim()
      if (line) this.ffmpegErrors.push(line)
    })

    this.ffmpegProcess.on('error', (err) => {
      console.error('[Recorder] FFmpeg process error:', err.message)
      this.recording = false
    })

    // Subscribe to screencast frames and pipe to FFmpeg
    this.unsubscribe = screencast.subscribe((frame) => {
      if (!this.recording || !this.ffmpegProcess?.stdin?.writable) return

      try {
        this.ffmpegProcess.stdin.write(frame.data)
        this.frameCount++
      } catch (err) {
        console.error('[Recorder] Error writing frame:', err)
      }
    })

    console.log(
      `[Recorder] Started — quality=${quality} (CRF ${crf}), fps=${fps}, output=${this.outputPath}`
    )
  }

  /**
   * Stop recording, finalize the MP4, and return the output path.
   * Returns null if recording failed or no frames were captured.
   */
  async stop(): Promise<string | null> {
    if (!this.recording && !this.ffmpegProcess) {
      return null
    }

    this.recording = false

    // Unsubscribe from screencast frames
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }

    if (!this.ffmpegProcess) {
      return null
    }

    const ffmpeg = this.ffmpegProcess
    this.ffmpegProcess = null

    return new Promise<string | null>((resolve) => {
      // Close stdin to signal EOF — FFmpeg will finalize the file
      if (ffmpeg.stdin?.writable) {
        ffmpeg.stdin.end()
      }

      let resolved = false

      ffmpeg.on('close', (code) => {
        if (resolved) return
        resolved = true

        if (code === 0 && this.frameCount > 0) {
          console.log(
            `[Recorder] Finished — ${this.frameCount} frames encoded to ${this.outputPath}`
          )
          resolve(this.outputPath)
        } else {
          console.error(
            `[Recorder] FFmpeg exited with code ${code}, frames=${this.frameCount}`,
            this.ffmpegErrors.slice(-3).join('\n')
          )
          resolve(null)
        }
      })

      // Timeout: kill FFmpeg if it takes too long to finalize
      setTimeout(() => {
        if (resolved) return
        resolved = true
        console.error('[Recorder] FFmpeg finalization timed out, killing process')
        ffmpeg.kill('SIGKILL')
        resolve(null)
      }, FINALIZE_TIMEOUT_MS)
    })
  }

  /**
   * Check if the recorder is currently active.
   */
  isRecording(): boolean {
    return this.recording
  }

  /**
   * Get the number of frames written to FFmpeg so far.
   */
  getFrameCount(): number {
    return this.frameCount
  }

  /**
   * Get the output file path (set after start() is called).
   */
  getOutputPath(): string {
    return this.outputPath
  }

  /**
   * Get the public URL path for the recording (relative to public/).
   */
  getPublicUrl(): string {
    const publicDir = path.join(process.cwd(), 'public')
    const relative = path.relative(publicDir, this.outputPath)
    return '/' + relative.replace(/\\/g, '/')
  }

  /**
   * Resolve the FFmpeg binary path.
   * Tries ffmpeg-static first, falls back to system ffmpeg.
   */
  private async resolveFFmpegPath(): Promise<string> {
    try {
      // ffmpeg-static exports the path to the binary as its default export
      const ffmpegStatic = await import('ffmpeg-static')
      const staticPath = ffmpegStatic.default as string | null
      if (staticPath) {
        console.log(`[Recorder] Using ffmpeg-static: ${staticPath}`)
        return staticPath
      }
    } catch {
      // ffmpeg-static not installed
    }

    console.log('[Recorder] Using system ffmpeg')
    return 'ffmpeg'
  }
}
