/**
 * /approve — List pending approvals with inline keyboard buttons.
 */

import { getApprovals } from '@/lib/supabase/queries/approvals'
import { formatApprovalList, formatError } from '../formatter'
import type { TelegramHandlerContext } from '../types'
import type { InlineKeyboardButton } from '../types-inline'

export interface ApproveHandlerResult {
  text: string
  inlineKeyboard?: InlineKeyboardButton[][]
}

export async function handleApprove(ctx: TelegramHandlerContext): Promise<ApproveHandlerResult> {
  if (!ctx.link) {
    return { text: formatError('Account not linked. Use /start <code> first.') }
  }

  const { data: approvals, error } = await getApprovals(
    ctx.db,
    ctx.link.workspace_id,
    { status: 'pending' },
    { limit: 10 },
  )

  if (error) {
    console.error('[Telegram] /approve query failed:', error)
    return { text: formatError('Failed to load approvals. Try again.') }
  }

  const text = formatApprovalList(approvals)

  if (approvals.length === 0) {
    return { text }
  }

  // Build inline keyboard: each approval gets Approve / Reject buttons
  const inlineKeyboard: InlineKeyboardButton[][] = approvals.map((a) => [
    { text: '✅ Approve', callback_data: `approve:${a.id}` },
    { text: '❌ Reject', callback_data: `reject:${a.id}` },
    { text: '✏️ Revise', callback_data: `revise:${a.id}` },
  ])

  return { text, inlineKeyboard }
}
