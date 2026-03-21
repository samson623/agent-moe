/**
 * Telegram Notifier — Outbound staged notifications.
 *
 * Sends staged mission updates to the user's Telegram chat:
 * "received" → "planning" → "working" → "completed/failed"
 *
 * Per feedback: NEVER stream full output. Only discrete checkpoint messages.
 * Every message includes a deep link back to the dashboard.
 */

import { getBot } from './bot'
import { isTelegramConfigured } from './config'
import { getTelegramLinkByUserId } from '@/lib/supabase/queries/telegram'
import { createAdminClient } from '@/lib/supabase/server'
import { formatNotification } from './formatter'
import type { MissionNotificationStage } from './types'

/**
 * Send a staged mission notification to a user's linked Telegram.
 *
 * Safe to call even if:
 * - Telegram is not configured (silently no-ops)
 * - User has no linked Telegram (silently no-ops)
 * - Sending fails (logs error, never throws)
 *
 * Callers (orchestrator) should fire-and-forget this.
 */
export async function notifyMissionStage(
  userId: string,
  missionId: string,
  stage: MissionNotificationStage,
  detail?: string,
): Promise<void> {
  try {
    if (!isTelegramConfigured()) return

    const client = createAdminClient()
    const { data: link } = await getTelegramLinkByUserId(client, userId)

    if (!link) return // User hasn't linked Telegram — silently skip

    const bot = getBot()
    const text = formatNotification(stage, missionId, detail)

    await bot.api.sendMessage(link.chat_id, text, {
      parse_mode: 'MarkdownV2',
    })
  } catch (err) {
    console.error(
      `[Telegram] notifyMissionStage failed (user=${userId}, mission=${missionId}, stage=${stage}):`,
      err instanceof Error ? err.message : err,
    )
  }
}
