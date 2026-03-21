/**
 * /revise <notes> — Request revision on the most recent pending approval.
 *
 * If the user has an active session with a pending_approval_id (set by
 * the "revise" callback button), notes are applied to that specific approval.
 * Otherwise, notes go to the most recent pending approval.
 */

import { getApprovals, decideApproval } from '@/lib/supabase/queries/approvals'
import { getTelegramSession, clearTelegramSession } from '@/lib/supabase/queries/telegram'
import { formatError, escapeMarkdown } from '../formatter'
import type { TelegramHandlerContext } from '../types'

export async function handleRevise(ctx: TelegramHandlerContext): Promise<string> {
  const notes = ctx.args?.trim()

  if (!notes) {
    return formatError('Usage: /revise <your revision notes>')
  }

  if (!ctx.link) {
    return formatError('Account not linked. Use /start <code> first.')
  }

  // Check if there's a session with a specific approval targeted
  let approvalId: string | null = null
  const { data: session } = await getTelegramSession(ctx.db, ctx.chatId)

  if (session?.state?.pending_approval_id) {
    approvalId = session.state.pending_approval_id as string
    await clearTelegramSession(ctx.db, ctx.chatId)
  } else {
    // Fall back to most recent pending approval
    const { data: approvals } = await getApprovals(
      ctx.db,
      ctx.link.workspace_id,
      { status: 'pending' },
      { limit: 1 },
    )
    approvalId = approvals[0]?.id ?? null
  }

  if (!approvalId) {
    return formatError('No pending approvals to revise.')
  }

  const { error } = await decideApproval(ctx.db, approvalId, 'revision_requested', notes)

  if (error) {
    console.error('[Telegram] /revise failed:', error)
    return formatError('Failed to submit revision. Try again.')
  }

  return `✏️ *Revision requested*\n\n_${escapeMarkdown(notes)}_`
}
