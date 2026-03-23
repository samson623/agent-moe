/**
 * Conversational Claude handler — Telegram natural language interface.
 *
 * Handles both questions (answers conversationally) and action requests
 * (creates missions and fires the orchestrator).
 */

import { getMissions, createMission } from '@/lib/supabase/queries/missions'
import { getApprovals } from '@/lib/supabase/queries/approvals'
import { getClaudeClient } from '@/features/ai/claude-client'
import { escapeMarkdown, formatMissionCreated } from '../formatter'
import { notifyMissionStage } from '../notifier'
import type { TelegramHandlerContext } from '../types'

const SYSTEM_PROMPT = `You are Agent MOE, an AI operator platform speaking to your owner via Telegram.

You run automated missions: content creation, market research, competitor monitoring, growth analysis, and revenue strategy. You have 4 operator teams: Content Strike, Growth Operator, Revenue Closer, and Brand Guardian.

WORKSPACE CONTEXT:
{context}

CURRENT TIME: {time}

RULES:
- Keep responses SHORT — under 100 words. This is chat, not a report.
- Plain text only. No markdown, no bullet points.
- If the user wants something DONE (write content, create copy, run research, build something), reply with one short sentence confirming you're on it, then on a new line write exactly: CREATE_MISSION: <the full instruction>
- If the user is asking a QUESTION about status, missions, approvals, or anything else, just answer it directly from the context above.
- Never make up mission data. Only reference what's in the context.`

export async function handleChat(ctx: TelegramHandlerContext): Promise<string> {
  if (!ctx.link) {
    return escapeMarkdown('Account not linked. Send /start <code> to link your account.')
  }

  const [missionsResult, approvalsResult] = await Promise.all([
    getMissions(ctx.db, ctx.link.workspace_id, {}, { page: 1, pageSize: 10 }),
    getApprovals(ctx.db, ctx.link.workspace_id, { status: 'pending' }, { limit: 5 }),
  ])

  const missions = missionsResult.data?.data ?? []
  const approvals = approvalsResult.data ?? []

  const contextLines: string[] = []

  const activeMissions = missions.filter((m) => ['running', 'planning'].includes(m.status))
  if (activeMissions.length > 0) {
    contextLines.push(`ACTIVE MISSIONS (${activeMissions.length}):`)
    for (const m of activeMissions) {
      contextLines.push(`  - [${m.status.toUpperCase()}] ${m.title}`)
    }
  } else {
    contextLines.push(`ACTIVE MISSIONS: None running right now.`)
  }

  contextLines.push('')

  if (approvals.length > 0) {
    contextLines.push(`PENDING APPROVALS (${approvals.length}):`)
    for (const a of approvals) {
      contextLines.push(`  - [${a.risk_level} risk] ${(a.notes ?? 'No description').slice(0, 100)}`)
    }
  } else {
    contextLines.push(`PENDING APPROVALS: None.`)
  }

  contextLines.push('')
  contextLines.push(`RECENT MISSIONS:`)
  for (const m of missions.slice(0, 5)) {
    const date = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    contextLines.push(`  - [${m.status}] ${m.title} (${date})`)
  }

  const systemPrompt = SYSTEM_PROMPT
    .replace('{context}', contextLines.join('\n'))
    .replace('{time}', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))

  const claude = getClaudeClient()
  const result = await claude.run(ctx.text, { systemPrompt, maxTokens: 300 })

  if (!result.success) {
    console.error('[Telegram] chat handler failed:', result.error)
    return escapeMarkdown("Couldn't process that right now. Try again.")
  }

  const responseText = result.data.trim()

  // Detect mission creation intent
  const createMatch = responseText.match(/^CREATE_MISSION:\s*(.+)$/m)
  if (createMatch && ctx.link) {
    const instruction = (createMatch[1] ?? '').trim()
    const visibleText = responseText.replace(/^CREATE_MISSION:.*$/m, '').trim()

    const { data: mission, error } = await createMission(ctx.db, {
      workspace_id: ctx.link.workspace_id,
      user_id: ctx.link.user_id,
      title: instruction.slice(0, 100),
      instruction,
      priority: 'normal',
      status: 'pending',
      source_channel: 'telegram',
      meta: { source: 'telegram_chat' },
    })

    if (!error && mission) {
      notifyMissionStage(ctx.link.user_id, mission.id, 'received', instruction.slice(0, 200)).catch(() => {})

      import('@/features/mission-engine/services/orchestrator')
        .then(({ planAndExecuteMission }) => planAndExecuteMission(mission.id, ctx.link!.workspace_id))
        .catch((err) => console.error('[Telegram] chat orchestrator failed:', err))

      const confirmation = visibleText || 'On it.'
      return escapeMarkdown(confirmation) + '\n\n' + formatMissionCreated(mission.id, instruction)
    }
  }

  return escapeMarkdown(responseText)
}
