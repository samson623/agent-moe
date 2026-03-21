/**
 * /status — Show 5 most recent missions.
 */

import { getMissions } from '@/lib/supabase/queries/missions'
import { formatMissionStatus, formatError } from '../formatter'
import type { TelegramHandlerContext } from '../types'

export async function handleStatus(ctx: TelegramHandlerContext): Promise<string> {
  if (!ctx.link) {
    return formatError('Account not linked. Use /start <code> first.')
  }

  const { data, error } = await getMissions(
    ctx.db,
    ctx.link.workspace_id,
    {},
    { page: 1, pageSize: 5 },
  )

  if (error || !data) {
    console.error('[Telegram] /status query failed:', error)
    return formatError('Failed to load missions. Try again.')
  }

  return formatMissionStatus(
    data.data.map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      created_at: m.created_at,
    })),
  )
}
