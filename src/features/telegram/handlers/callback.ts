/**
 * Inline button callback handler.
 *
 * Callback data format: "action:approvalId"
 * Actions: approve, reject, revise
 */

import { decideApproval } from '@/lib/supabase/queries/approvals'
import { upsertTelegramSession } from '@/lib/supabase/queries/telegram'
import { formatError, escapeMarkdown, approvalDeepLink } from '../formatter'
import type { TelegramHandlerContext } from '../types'

export interface CallbackResult {
  /** Answer text shown as a toast in Telegram */
  answerText: string
  /** Optional message to edit/send */
  messageText?: string
}

export async function handleCallback(ctx: TelegramHandlerContext): Promise<CallbackResult> {
  const [action, approvalId] = ctx.text.split(':')

  if (!approvalId) {
    return { answerText: 'Invalid button data.' }
  }

  if (!ctx.link) {
    return { answerText: 'Account not linked.' }
  }

  if (action === 'approve') {
    const { error } = await decideApproval(ctx.db, approvalId, 'approved')
    if (error) {
      console.error('[Telegram] approve callback failed:', error)
      return { answerText: 'Failed to approve.' }
    }
    const link = escapeMarkdown(approvalDeepLink(approvalId))
    return {
      answerText: 'Approved!',
      messageText: `✅ *Approved*\n\n[View in dashboard](${link})`,
    }
  }

  if (action === 'reject') {
    const { error } = await decideApproval(ctx.db, approvalId, 'rejected')
    if (error) {
      console.error('[Telegram] reject callback failed:', error)
      return { answerText: 'Failed to reject.' }
    }
    const link = escapeMarkdown(approvalDeepLink(approvalId))
    return {
      answerText: 'Rejected.',
      messageText: `❌ *Rejected*\n\n[View in dashboard](${link})`,
    }
  }

  if (action === 'revise') {
    // Set session state so the next /revise or freeform text is treated as revision notes
    await upsertTelegramSession(
      ctx.db,
      ctx.chatId,
      ctx.link.user_id,
      ctx.link.workspace_id,
      { flow: 'awaiting_revision_notes', pending_approval_id: approvalId },
    )
    return {
      answerText: 'Send your revision notes.',
      messageText: formatError('Send your revision notes now, or use /revise <notes>'),
    }
  }

  return { answerText: 'Unknown action.' }
}
