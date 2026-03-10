/**
 * Video Packaging — Domain Types & Zod Schemas
 *
 * Defines the complete type system for the Video Packaging feature.
 * Every input and output is strongly typed. No `any` anywhere.
 *
 * Used by:
 * - VideoPackageOperator (operator layer)
 * - API routes under /api/video-packaging
 * - Content Studio UI for rendering video packages
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

/** The opening hook content — primary + A/B test variants. */
export interface VideoHook {
  primary: string;
  variants: string[];
}

/** One scene in the video breakdown. */
export interface VideoScene {
  order: number;
  title: string;
  script: string;             // Spoken/text content for this scene
  visual_direction: string;   // What should be shown on screen
  duration_seconds: number;   // Estimated duration in seconds
}

/** Text-based thumbnail direction — no image generation, pure copy + visual brief. */
export interface ThumbnailConcept {
  headline: string;            // Big text on thumbnail
  visual_description: string;  // What image/scene to use
  color_scheme: string;        // e.g. "Dark blue with yellow accent"
  text_overlay: string;        // Additional text overlays
}

/** Call to action at the end of the video. */
export interface VideoCTA {
  text: string;
  type: "subscribe" | "link_in_bio" | "dm" | "comment" | "visit" | "buy";
  destination?: string;
}

/** What we send to the VideoPackageOperator. */
export interface VideoPackageInput {
  topic: string;
  platform: "youtube" | "tiktok" | "instagram" | "x";
  tone?: string;
  targetAudience?: string;
  hook_count?: number;   // How many hook variants to generate (default 3)
  scene_count?: number;  // Number of scenes in the breakdown (default 5)
  linked_offer?: string; // Offer name to tie the CTA to
  brand_rules?: {
    tone?: string;
    blocked_phrases?: string[];
  };
}

/** What the VideoPackageOperator returns on success. */
export interface VideoPackageOutput {
  title: string;
  platform: string;
  hook: VideoHook;
  scenes: VideoScene[];
  thumbnail_concept: ThumbnailConcept;
  caption: string;
  cta: VideoCTA;
  confidence_score: number;  // 0-1
  rationale?: string;
}

// ---------------------------------------------------------------------------
// Zod schemas for runtime validation of operator output
// ---------------------------------------------------------------------------

export const VideoHookSchema = z.object({
  primary: z.string().min(1),
  variants: z.array(z.string()),
});

export const VideoSceneSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1),
  script: z.string().min(1),
  visual_direction: z.string().min(1),
  duration_seconds: z.number().positive(),
});

export const ThumbnailConceptSchema = z.object({
  headline: z.string().min(1),
  visual_description: z.string().min(1),
  color_scheme: z.string().min(1),
  text_overlay: z.string(),
});

export const VideoCTASchema = z.object({
  text: z.string().min(1),
  type: z.enum(["subscribe", "link_in_bio", "dm", "comment", "visit", "buy"]),
  destination: z.string().optional(),
});

export const VideoPackageOutputSchema = z.object({
  title: z.string().min(1),
  platform: z.string().min(1),
  hook: VideoHookSchema,
  scenes: z.array(VideoSceneSchema).min(1),
  thumbnail_concept: ThumbnailConceptSchema,
  caption: z.string().min(1),
  cta: VideoCTASchema,
  confidence_score: z.number().min(0).max(1),
  rationale: z.string().optional(),
});

// Re-export zod for convenience downstream
export type { ZodSchema } from "zod";
