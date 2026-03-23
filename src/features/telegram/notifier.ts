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
import {
  formatNotification,
  formatAssetCreated,
  formatApprovalNeeded,
  formatExperimentDigest,
  formatExperimentComplete,
} from './formatter'
import type { MissionNotificationStage } from './types'
import type { ExperimentBrief, ExperimentRun } from '@/features/experiment/types'

/**
 * Look up the user_id for a mission — used by asset/approval notifiers.
 */
async function getUserIdForMission(missionId: string): Promise<string | null> {
  try {
    const client = createAdminClient()
    const { data } = await client
      .from('missions')
      .select('user_id')
      .eq('id', missionId)
      .single()
    return data?.user_id ?? null
  } catch {
    return null
  }
}

/**
 * Notify user when a content asset is created during a mission.
 */
export async function notifyAssetCreated(
  missionId: string,
  assetTitle: string,
  assetType: string,
): Promise<void> {
  try {
    if (!isTelegramConfigured()) return
    const userId = await getUserIdForMission(missionId)
    if (!userId) return

    const client = createAdminClient()
    const { data: link } = await getTelegramLinkByUserId(client, userId)
    if (!link) return

    const bot = getBot()
    const text = formatAssetCreated(assetTitle, assetType, missionId)
    await bot.api.sendMessage(link.chat_id, text, { parse_mode: 'MarkdownV2' })
  } catch (err) {
    console.error(
      `[Telegram] notifyAssetCreated failed (mission=${missionId}):`,
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Notify user when an approval is needed, with inline Approve / Revise buttons.
 */
export async function notifyApprovalNeeded(
  missionId: string,
  approvalId: string,
  assetTitle: string,
  riskLevel: string,
  flags: string[],
): Promise<void> {
  try {
    if (!isTelegramConfigured()) return
    const userId = await getUserIdForMission(missionId)
    if (!userId) return

    const client = createAdminClient()
    const { data: link } = await getTelegramLinkByUserId(client, userId)
    if (!link) return

    const bot = getBot()
    const text = formatApprovalNeeded(assetTitle, riskLevel, flags, missionId)
    await bot.api.sendMessage(link.chat_id, text, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Approve', callback_data: `approve:${approvalId}` },
          { text: '✏️ Revise', callback_data: `revise:${approvalId}` },
        ]],
      },
    })
  } catch (err) {
    console.error(
      `[Telegram] notifyApprovalNeeded failed (mission=${missionId}, approval=${approvalId}):`,
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Send an experiment iteration digest to a user's linked Telegram.
 */
export async function notifyExperimentDigest(
  userId: string,
  briefId: string,
  runs: ExperimentRun[],
  brief: ExperimentBrief,
): Promise<void> {
  try {
    if (!isTelegramConfigured()) return
    const client = createAdminClient()
    const { data: link } = await getTelegramLinkByUserId(client, userId)
    if (!link) return

    const bot = getBot()
    const text = formatExperimentDigest(
      brief.name,
      runs.length,
      brief.best_metric_value,
      runs.map((r) => ({
        iteration: r.iteration,
        decision: r.decision,
        metric_value: r.metric_value,
        metric_delta: r.metric_delta,
        diff_summary: r.diff_summary,
      })),
      briefId,
    )
    await bot.api.sendMessage(link.chat_id, text, { parse_mode: 'MarkdownV2' })
  } catch (err) {
    console.error(
      `[Telegram] notifyExperimentDigest failed (user=${userId}, brief=${briefId}):`,
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Send an experiment complete notification to a user's linked Telegram.
 */
export async function notifyExperimentComplete(
  userId: string,
  briefId: string,
  brief: ExperimentBrief,
): Promise<void> {
  try {
    if (!isTelegramConfigured()) return
    const client = createAdminClient()
    const { data: link } = await getTelegramLinkByUserId(client, userId)
    if (!link) return

    const bot = getBot()
    const text = formatExperimentComplete(
      brief.name,
      brief.current_iteration,
      brief.best_metric_value,
      briefId,
    )
    await bot.api.sendMessage(link.chat_id, text, { parse_mode: 'MarkdownV2' })
  } catch (err) {
    console.error(
      `[Telegram] notifyExperimentComplete failed (user=${userId}, brief=${briefId}):`,
      err instanceof Error ? err.message : err,
    )
  }
}

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
