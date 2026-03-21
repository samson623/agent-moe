/**
 * Freeform text handler — GPT-5 Nano intent classification.
 *
 * Only 5 known categories, >0.7 confidence threshold, else show help.
 * This is the LAST handler in the chain — deterministic routes are checked first.
 */

import { getOpenAIClient } from '@/features/ai/openai-client'
import { getTelegramSession, clearTelegramSession } from '@/lib/supabase/queries/telegram'
import { formatHelp, formatError } from '../formatter'
import type { TelegramHandlerContext } from '../types'

/** The 5 categories GPT-5 Nano can classify freeform text into */
const INTENT_CATEGORIES = [
  'create_mission',
  'check_status',
  'approve_content',
  'get_help',
  'unknown',
] as const

type Intent = (typeof INTENT_CATEGORIES)[number]

const CONFIDENCE_THRESHOLD = 0.7

export async function handleFreeform(ctx: TelegramHandlerContext): Promise<string> {
  if (!ctx.link) {
    return formatError('Account not linked. Use /start <code> first.')
  }

  // Check if there's an active session flow (e.g., awaiting revision notes)
  const { data: session } = await getTelegramSession(ctx.db, ctx.chatId)

  if (session?.state?.flow === 'awaiting_revision_notes') {
    // Treat this text as revision notes — delegate to revise handler
    const { handleRevise } = await import('./revise')
    // Inject text as args
    return handleRevise({ ...ctx, args: ctx.text })
  }

  // Classify the freeform text
  const openai = getOpenAIClient()
  const result = await openai.classify(ctx.text, [...INTENT_CATEGORIES])

  if (!result.success) {
    console.error('[Telegram] freeform classify failed:', result.error)
    return formatHelp()
  }

  const { category, confidence } = result.data
  const intent = category as Intent

  if (confidence < CONFIDENCE_THRESHOLD || intent === 'unknown') {
    return formatHelp()
  }

  // Route to the appropriate handler
  switch (intent) {
    case 'create_mission': {
      const { handleMission } = await import('./mission')
      return handleMission({ ...ctx, args: ctx.text })
    }
    case 'check_status': {
      const { handleStatus } = await import('./status')
      return handleStatus(ctx)
    }
    case 'approve_content': {
      // Return help text pointing them to /approve command
      return formatError('Use /approve to see pending approvals with action buttons.')
    }
    case 'get_help':
      return formatHelp()
    default:
      return formatHelp()
  }
}
