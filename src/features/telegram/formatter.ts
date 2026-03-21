/**
 * Telegram Formatter — MarkdownV2 escaping, deep links, message templates.
 *
 * Telegram's MarkdownV2 requires escaping these characters in all dynamic text:
 * _ * [ ] ( ) ~ ` > # + - = | { } . !
 *
 * Every user-facing message passes through these helpers.
 */

import { getTelegramConfig } from './config'
import type { MissionNotificationStage } from './types'

// ---------------------------------------------------------------------------
// MarkdownV2 escaping
// ---------------------------------------------------------------------------

const MD_ESCAPE_REGEX = /[_*[\]()~`>#+\-=|{}.!\\]/g

/**
 * Escape dynamic text for MarkdownV2 parse mode.
 * NEVER escape template literals — only user/DB-sourced strings.
 */
export function escapeMarkdown(text: string): string {
  return text.replace(MD_ESCAPE_REGEX, '\\$&')
}

// ---------------------------------------------------------------------------
// Deep links — every notification links back to the dashboard
// ---------------------------------------------------------------------------

export function missionDeepLink(missionId: string): string {
  const { appUrl } = getTelegramConfig()
  return `${appUrl}/missions/${missionId}`
}

export function approvalDeepLink(approvalId: string): string {
  const { appUrl } = getTelegramConfig()
  return `${appUrl}/approvals/${approvalId}`
}

export function dashboardLink(): string {
  const { appUrl } = getTelegramConfig()
  return `${appUrl}/command-center`
}

// ---------------------------------------------------------------------------
// Message templates
// ---------------------------------------------------------------------------

export function formatWelcome(username: string | null): string {
  const name = username ? escapeMarkdown(username) : 'there'
  return [
    `*Welcome to Agent MOE* 🤖`,
    ``,
    `Hey ${name}\\! Your Telegram is now linked\\.`,
    ``,
    `*Commands:*`,
    `/mission \\<instruction\\> — Launch a mission`,
    `/status — Recent missions`,
    `/approve — Pending approvals`,
    `/revise \\<notes\\> — Request revision`,
    `/help — Show this list`,
  ].join('\n')
}

export function formatHelp(): string {
  return [
    `*Agent MOE Commands* 🤖`,
    ``,
    `/mission \\<instruction\\> — Launch a mission`,
    `/status — Last 5 missions`,
    `/approve — List pending approvals`,
    `/revise \\<notes\\> — Request revision on an approval`,
    `/help — Show this list`,
    ``,
    `You can also forward messages here and I\\'ll summarize them\\.`,
  ].join('\n')
}

export function formatMissionCreated(missionId: string, instruction: string): string {
  const safeInstruction = escapeMarkdown(
    instruction.length > 200 ? instruction.slice(0, 200) + '...' : instruction,
  )
  const link = escapeMarkdown(missionDeepLink(missionId))
  return [
    `✅ *Mission created*`,
    ``,
    `_${safeInstruction}_`,
    ``,
    `[Open in dashboard](${link})`,
  ].join('\n')
}

export function formatMissionStatus(
  missions: Array<{ id: string; title: string; status: string; created_at: string }>,
): string {
  if (missions.length === 0) {
    return `No recent missions\\. Use /mission to launch one\\.`
  }

  const statusEmoji: Record<string, string> = {
    pending: '⏳',
    planning: '🧠',
    running: '⚡',
    paused: '⏸',
    completed: '✅',
    failed: '❌',
  }

  const lines = missions.map((m) => {
    const emoji = statusEmoji[m.status] ?? '❓'
    const title = escapeMarkdown(m.title || 'Untitled')
    const link = escapeMarkdown(missionDeepLink(m.id))
    return `${emoji} [${title}](${link}) — _${escapeMarkdown(m.status)}_`
  })

  return [`*Recent Missions*`, ``, ...lines].join('\n')
}

export function formatApprovalList(
  approvals: Array<{ id: string; notes: string | null; risk_level: string; status: string }>,
): string {
  if (approvals.length === 0) {
    return `No pending approvals\\. 🎉`
  }

  const lines = approvals.map((a, i) => {
    const risk = escapeMarkdown(a.risk_level ?? 'unknown')
    const desc = escapeMarkdown(a.notes?.slice(0, 80) ?? 'No description')
    return `${i + 1}\\. \\[${risk}\\] ${desc}`
  })

  return [`*Pending Approvals* \\(${approvals.length}\\)`, ``, ...lines].join('\n')
}

export function formatNotification(
  stage: MissionNotificationStage,
  missionId: string,
  detail?: string,
): string {
  const stageEmoji: Record<MissionNotificationStage, string> = {
    received: '📥',
    planning: '🧠',
    working: '⚡',
    job_progress: '🔄',
    completed: '✅',
    paused: '⏸',
    failed: '❌',
  }

  const stageLabel: Record<MissionNotificationStage, string> = {
    received: 'Mission received',
    planning: 'Planning in progress',
    working: 'Operators working',
    job_progress: 'Job update',
    completed: 'Mission completed',
    paused: 'Mission paused — awaiting approval',
    failed: 'Mission failed',
  }

  const emoji = stageEmoji[stage]
  const label = stageLabel[stage]
  const link = escapeMarkdown(missionDeepLink(missionId))
  const extra = detail ? `\n_${escapeMarkdown(detail)}_` : ''

  return `${emoji} *${escapeMarkdown(label)}*${extra}\n\n[View in dashboard](${link})`
}

export function formatForwardedSummary(summary: string): string {
  const safe = escapeMarkdown(summary)
  return [
    `📋 *Forwarded message summary:*`,
    ``,
    `_${safe}_`,
    ``,
    `Create a mission from this?`,
  ].join('\n')
}

export function formatError(message: string): string {
  return `⚠️ ${escapeMarkdown(message)}`
}

export function formatUnlinked(): string {
  return `You haven\\'t linked your account yet\\. Ask your admin for a link code and use /start \\<code\\>\\.`
}

export function formatPrivateChatOnly(): string {
  return `I only work in private chats\\. Send me a DM\\!`
}
