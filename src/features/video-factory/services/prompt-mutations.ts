/**
 * Prompt Mutations — Autoresearch-inspired variation strategies
 *
 * When a video package scores below the confidence threshold, we don't
 * retry with the same prompt. Instead, we mutate the creative parameters
 * (hook style, tone, scene framing) to explore different approaches.
 *
 * Each mutation level escalates the change magnitude:
 *   Level 1: Shift hook style (curiosity → urgency)
 *   Level 2: Shift tone + hook style
 *   Level 3: Full reframe (different angle on the topic)
 */

import type { VideoPackageInput } from '@/features/video-packaging/types'
import type { VideoFactoryPlatform } from '../types'

// ---------------------------------------------------------------------------
// Hook style rotation
// ---------------------------------------------------------------------------

const HOOK_STYLES = ['curiosity', 'urgency', 'contrarian', 'listicle', 'story'] as const
type HookStyle = (typeof HOOK_STYLES)[number]

const HOOK_PREFIXES: Record<HookStyle, string> = {
  curiosity: 'What most people miss about',
  urgency: 'You need to know this about',
  contrarian: 'Everything you were told about',
  listicle: 'The top 3 things about',
  story: 'I discovered something about',
}

// ---------------------------------------------------------------------------
// Tone variations
// ---------------------------------------------------------------------------

const TONE_MUTATIONS: Record<string, string[]> = {
  educational: ['conversational', 'authoritative', 'motivational'],
  conversational: ['educational', 'energetic', 'storytelling'],
  professional: ['conversational', 'educational', 'inspiring'],
  energetic: ['conversational', 'motivational', 'provocative'],
  // fallback for any unknown tone
  default: ['conversational', 'educational', 'energetic'],
}

function getAlternateTones(currentTone: string): string[] {
  return TONE_MUTATIONS[currentTone] ?? TONE_MUTATIONS.default!
}

// ---------------------------------------------------------------------------
// Platform-specific guidance
// ---------------------------------------------------------------------------

const PLATFORM_REFRAME: Record<VideoFactoryPlatform, string> = {
  tiktok: 'Make it punchy, fast-paced, and optimized for vertical scroll. Lead with visual shock value.',
  youtube: 'Optimize for YouTube Shorts discovery — front-load value, use pattern interrupts every 5 seconds.',
  instagram: 'Design for Reels — aesthetic visuals, trending audio cues in visual direction, lifestyle framing.',
}

// ---------------------------------------------------------------------------
// Mutation interface
// ---------------------------------------------------------------------------

export interface PromptMutation {
  level: number
  tone: string
  hookPrefix: string
  hookStyle: HookStyle
  topicReframe: string | null
  platformGuidance: string
  description: string
}

/**
 * Generate a mutation for a given retry attempt.
 *
 * @param attempt - 1-indexed retry number (1 = first retry, 2 = second retry)
 * @param originalTone - the tone used in the original (failed) attempt
 * @param platform - target platform
 * @param topic - the original topic
 */
export function getMutation(
  attempt: number,
  originalTone: string,
  platform: VideoFactoryPlatform,
  topic: string,
): PromptMutation {
  const alternateTones = getAlternateTones(originalTone)

  if (attempt === 1) {
    // Level 1: Different hook style, keep tone
    const hookStyle = HOOK_STYLES[1]! // urgency
    return {
      level: 1,
      tone: originalTone,
      hookPrefix: HOOK_PREFIXES[hookStyle],
      hookStyle,
      topicReframe: null,
      platformGuidance: PLATFORM_REFRAME[platform],
      description: `Retry #1: switched hook style to "${hookStyle}", same tone`,
    }
  }

  if (attempt === 2) {
    // Level 2: Different hook style + different tone
    const hookStyle = HOOK_STYLES[2]! // contrarian
    const newTone = alternateTones[0] ?? 'conversational'
    return {
      level: 2,
      tone: newTone,
      hookPrefix: HOOK_PREFIXES[hookStyle],
      hookStyle,
      topicReframe: null,
      platformGuidance: PLATFORM_REFRAME[platform],
      description: `Retry #2: switched hook to "${hookStyle}", tone to "${newTone}"`,
    }
  }

  // Level 3: Full reframe — different angle on the topic
  const hookStyle = HOOK_STYLES[3]! // listicle
  const newTone = alternateTones[1] ?? 'educational'
  return {
    level: 3,
    tone: newTone,
    hookPrefix: HOOK_PREFIXES[hookStyle],
    hookStyle,
    topicReframe: `Instead of a general overview of "${topic}", focus on ONE specific actionable technique or counterintuitive insight. Make it concrete and immediately usable.`,
    platformGuidance: PLATFORM_REFRAME[platform],
    description: `Retry #3: full reframe — "${hookStyle}" hook, "${newTone}" tone, narrowed angle`,
  }
}

/**
 * Apply a mutation to a VideoPackageInput, producing a modified input
 * that should generate a different creative direction.
 */
export function applyMutation(
  input: VideoPackageInput,
  mutation: PromptMutation,
): VideoPackageInput {
  const mutatedTopic = mutation.topicReframe
    ? `${input.topic}\n\nCREATIVE DIRECTION: ${mutation.topicReframe}\n\nHOOK APPROACH: ${mutation.hookPrefix} ${input.topic}\n\n${mutation.platformGuidance}`
    : `${input.topic}\n\nHOOK APPROACH: ${mutation.hookPrefix} ${input.topic}\n\n${mutation.platformGuidance}`

  return {
    ...input,
    topic: mutatedTopic,
    tone: mutation.tone,
  }
}
