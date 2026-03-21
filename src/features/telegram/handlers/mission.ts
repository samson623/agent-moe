/**
 * /mission <instruction> — Create and launch a mission from Telegram.
 *
 * Creates the mission in DB, fire-and-forgets planAndExecuteMission(),
 * and immediately returns a confirmation message.
 */

import { createMission } from '@/lib/supabase/queries/missions'
import { formatMissionCreated, formatError } from '../formatter'
import type { TelegramHandlerContext } from '../types'

export async function handleMission(ctx: TelegramHandlerContext): Promise<string> {
  const instruction = ctx.args?.trim()

  if (!instruction) {
    return formatError('Usage: /mission <what you want done>')
  }

  if (!ctx.link) {
    return formatError('Account not linked. Use /start <code> first.')
  }

  const { data: mission, error } = await createMission(ctx.db, {
    workspace_id: ctx.link.workspace_id,
    user_id: ctx.link.user_id,
    title: instruction.slice(0, 100),
    instruction,
    priority: 'normal',
    status: 'pending',
    meta: { source: 'telegram' },
  })

  if (error || !mission) {
    console.error('[Telegram] /mission creation failed:', error)
    return formatError('Failed to create mission. Try again.')
  }

  // Fire-and-forget — orchestrator runs in background.
  // Dynamic import to avoid pulling server-only code at module load.
  import('@/features/mission-engine/services/orchestrator')
    .then(({ planAndExecuteMission }) => planAndExecuteMission(mission.id, ctx.link!.workspace_id))
    .catch((err) => console.error('[Telegram] orchestrator launch failed:', err))

  return formatMissionCreated(mission.id, instruction)
}
