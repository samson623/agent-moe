/**
 * Forwarded message handler.
 *
 * Uses GPT-5 Nano to summarize the forwarded content, then asks the user
 * if they want to create a mission from it.
 */

import { getOpenAIClient } from '@/features/ai/openai-client'
import { upsertTelegramSession } from '@/lib/supabase/queries/telegram'
import { formatForwardedSummary, formatError } from '../formatter'
import type { TelegramHandlerContext } from '../types'
import type { InlineKeyboardButton } from '../types-inline'

export interface ForwardedResult {
  text: string
  inlineKeyboard?: InlineKeyboardButton[][]
}

export async function handleForwarded(ctx: TelegramHandlerContext): Promise<ForwardedResult> {
  if (!ctx.link) {
    return { text: formatError('Account not linked. Use /start <code> first.') }
  }

  if (!ctx.text.trim()) {
    return { text: formatError('Forwarded message was empty.') }
  }

  const openai = getOpenAIClient()
  const result = await openai.summarize(ctx.text)

  if (!result.success) {
    console.error('[Telegram] forwarded summarize failed:', result.error)
    return { text: formatError('Could not summarize the forwarded message.') }
  }

  const summary = result.data.summary

  // Save summary to session for the "yes create mission" callback
  await upsertTelegramSession(
    ctx.db,
    ctx.chatId,
    ctx.link.user_id,
    ctx.link.workspace_id,
    { flow: 'awaiting_mission_confirm', pending_summary: summary },
  )

  return {
    text: formatForwardedSummary(summary),
    inlineKeyboard: [
      [
        { text: '🚀 Create Mission', callback_data: 'fwd_mission:yes' },
        { text: '❌ Cancel', callback_data: 'fwd_mission:no' },
      ],
    ],
  }
}
