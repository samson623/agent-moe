/**
 * Freeform text handler.
 *
 * Questions → Claude answers conversationally.
 * Everything else → mission created and fired.
 */

import { getTelegramSession } from '@/lib/supabase/queries/telegram'
import { formatError } from '../formatter'
import { handleChat } from './chat'
import { handleMission } from './mission'
import type { TelegramHandlerContext } from '../types'

const QUESTION_RE = /^(what|who|where|when|how|why|is|are|did|does|do|can|could|would|have|has|tell me|show me|any |give me a status|status)/i

function isQuestion(text: string): boolean {
  return text.trim().endsWith('?') || QUESTION_RE.test(text.trim())
}

export async function handleFreeform(ctx: TelegramHandlerContext): Promise<string> {
  if (!ctx.link) {
    return formatError('Account not linked. Use /start <code> first.')
  }

  // Active session flow (e.g. awaiting revision notes)
  const { data: session } = await getTelegramSession(ctx.db, ctx.chatId)
  if (session?.state?.flow === 'awaiting_revision_notes') {
    const { handleRevise } = await import('./revise')
    return handleRevise({ ...ctx, args: ctx.text })
  }

  // Questions → conversational answer
  if (isQuestion(ctx.text)) {
    return handleChat(ctx)
  }

  // Everything else → create a mission
  return handleMission({ ...ctx, args: ctx.text })
}
