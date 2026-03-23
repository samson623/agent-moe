/**
 * Stub for Recorder (ffmpeg-static) on Vercel / serverless.
 */
export type RecordingQuality = 'low' | 'medium' | 'high'
export interface RecorderOptions { quality?: RecordingQuality; outputDir?: string }

export class Recorder {
  constructor(_options?: RecorderOptions) {}
  start(_screencast: unknown) {}
  stop(): Promise<string | null> { return Promise.resolve(null) }
  getOutputPath(): string | null { return null }
}
