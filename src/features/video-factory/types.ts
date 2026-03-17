/**
 * Video Factory — Types & Schemas
 *
 * The Video Factory takes a single topic and produces 3 platform-optimized
 * video packages (TikTok, YouTube Shorts, Instagram Reels) in parallel.
 */

import { z } from 'zod'

// The 3 target platforms for video factory
export const VIDEO_FACTORY_PLATFORMS = ['tiktok', 'youtube', 'instagram'] as const
export type VideoFactoryPlatform = (typeof VIDEO_FACTORY_PLATFORMS)[number]

// Input to the video factory
export interface VideoFactoryInput {
  topic: string
  durationSeconds?: number  // default 30
  tone?: string             // default 'educational'
  workspaceId: string
}

// Status of a single platform's package within a batch
export type VideoFactoryPackageStatus =
  | 'generating'
  | 'generated'
  | 'filling_images'
  | 'images_ready'
  | 'rendering'
  | 'rendered'
  | 'failed'

// A single platform entry in the batch
export interface VideoFactoryPackageEntry {
  platform: VideoFactoryPlatform
  packageId: string | null   // null until generated
  status: VideoFactoryPackageStatus
  confidenceScore: number | null
  error: string | null
}

// Overall batch status
export type VideoFactoryBatchStatus =
  | 'generating'
  | 'generated'
  | 'rendering'
  | 'ready_for_review'
  | 'partially_failed'
  | 'failed'

// A batch = 3 platform packages from one topic
export interface VideoFactoryBatch {
  batchId: string
  topic: string
  durationSeconds: number
  tone: string
  workspaceId: string
  status: VideoFactoryBatchStatus
  packages: VideoFactoryPackageEntry[]
  createdAt: string
  completedAt: string | null
}

// API response from POST /api/video-factory/generate
export interface VideoFactoryGenerateResponse {
  batchId: string
  topic: string
  packages: Array<{
    platform: VideoFactoryPlatform
    packageId: string
    confidenceScore: number | null
  }>
}

// Zod schema for the generate endpoint input
export const VideoFactoryGenerateSchema = z.object({
  workspace_id: z.string().uuid(),
  topic: z.string().min(1).max(500),
  duration_seconds: z.number().int().min(10).max(180).optional().default(30),
  tone: z.string().optional().default('educational'),
  platforms: z.array(z.enum(['tiktok', 'youtube', 'instagram'])).min(1).max(3).optional(),
})
