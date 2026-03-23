/**
 * Stub for renderVideoPackage (remotion) on Vercel / serverless.
 */
export interface RenderOptions { [key: string]: unknown }
export interface RenderResult { outputPath: string; durationMs: number }

export function invalidateBundle(): void {}

export async function renderVideoPackage(_options: RenderOptions): Promise<RenderResult> {
  throw new Error('Video rendering not available in serverless')
}
