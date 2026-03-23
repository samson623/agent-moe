/**
 * Inline button callback handler.
 *
 * Callback data format: "action:approvalId"
 * Actions: approve, reject, revise
 */

import { decideApproval } from '@/lib/supabase/queries/approvals'
import { upsertTelegramSession } from '@/lib/supabase/queries/telegram'
import { updateMissionStatus } from '@/lib/supabase/queries/missions'
import { formatError, escapeMarkdown, approvalDeepLink } from '../formatter'
import type { TelegramHandlerContext } from '../types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * After an approval, check if the parent mission is paused with no remaining
 * pending approvals — if so, auto-resume the execution engine.
 */
async function resumeMissionAfterApproval(
  db: SupabaseClient<Database>,
  approvalId: string,
): Promise<void> {
  // 1. Get the job_id from this approval
  const { data: approval } = await db
    .from('approvals')
    .select('job_id')
    .eq('id', approvalId)
    .single()

  if (!approval?.job_id) return

  // 2. Get the mission_id from the job
  const { data: job } = await db
    .from('jobs')
    .select('mission_id, workspace_id')
    .eq('id', approval.job_id)
    .single()

  if (!job?.mission_id) return

  // 3. Check if the mission is paused
  const { data: mission } = await db
    .from('missions')
    .select('id, workspace_id, status')
    .eq('id', job.mission_id)
    .single()

  if (!mission || mission.status !== 'paused') return

  // 4. Check if any pending approvals remain for jobs in this mission
  const { data: missionJobs } = await db
    .from('jobs')
    .select('id')
    .eq('mission_id', mission.id)

  const jobIds = (missionJobs ?? []).map((j) => j.id)
  if (jobIds.length === 0) return

  const { data: pendingApprovals } = await db
    .from('approvals')
    .select('id')
    .in('job_id', jobIds)
    .eq('status', 'pending')

  if ((pendingApprovals ?? []).length > 0) return // Still waiting on others

  // 5. Resume — reset any failed jobs and re-launch execution engine
  await db
    .from('jobs')
    .update({ status: 'pending', started_at: null, completed_at: null, error_message: null })
    .eq('mission_id', mission.id)
    .in('status', ['failed', 'running'])

  await updateMissionStatus(db, mission.id, 'running')

  import('@/features/mission-engine/services/execution-engine')
    .then(({ createExecutionEngine }) => {
      const engine = createExecutionEngine(mission.id, mission.workspace_id)
      return engine.execute()
    })
    .then((summary) => {
      const statusMap = { completed: 'completed', failed: 'failed', blocked: 'paused', partial: 'paused' } as const
      return updateMissionStatus(db, mission.id, statusMap[summary.finalStatus])
    })
    .catch((err) => console.error('[Telegram] auto-resume failed:', err))
}

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

    // Auto-resume the mission if no pending approvals remain
    resumeMissionAfterApproval(ctx.db, approvalId).catch(() => {})

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
