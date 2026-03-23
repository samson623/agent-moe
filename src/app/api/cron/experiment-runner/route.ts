/**
 * Vercel Cron — Experiment Runner
 *
 * Fires nightly (6 AM UTC = 2 AM EST) via Vercel Cron.
 * Finds all active, incomplete experiment briefs and runs one iteration each.
 * Sends a Telegram morning digest after all iterations complete.
 *
 * Security: Vercel sets Authorization: Bearer <CRON_SECRET> on cron requests.
 * Non-Vercel requests without the secret are rejected.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runExperimentIteration } from '@/features/experiment/services/experiment-orchestrator'
import { notifyExperimentDigest, notifyExperimentComplete } from '@/features/telegram/notifier'
import type { ExperimentBrief, ExperimentRun } from '@/features/experiment/types'

export const dynamic = 'force-dynamic'

// Vercel Cron max duration — allow long-running experiments
export const maxDuration = 300

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env['CRON_SECRET']

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createAdminClient()
  const results: Array<{ briefId: string; briefName: string; status: string; error?: string }> = []

  try {
    // Find all active, incomplete experiment briefs
    const { data: briefs, error: briefsErr } = await client
      .from('experiment_briefs')
      .select('*')
      .eq('is_active', true)
      .eq('is_complete', false)
      .order('created_at', { ascending: true })

    if (briefsErr) {
      console.error('[CronExperimentRunner] Failed to fetch briefs:', briefsErr.message)
      return NextResponse.json({ error: briefsErr.message }, { status: 500 })
    }

    if (!briefs || briefs.length === 0) {
      console.log('[CronExperimentRunner] No active experiments to run')
      return NextResponse.json({ ran: 0, results: [] })
    }

    console.log(`[CronExperimentRunner] Running ${briefs.length} experiment(s)`)

    // Run one iteration per brief, sequentially to avoid DB contention
    for (const briefRow of briefs) {
      const brief = briefRow as unknown as ExperimentBrief

      try {
        console.log(`[CronExperimentRunner] Starting iteration for brief ${brief.id} (${brief.name})`)

        const result = await runExperimentIteration(brief.id, brief.workspace_id, brief.user_id)

        results.push({ briefId: brief.id, briefName: brief.name, status: result.run.decision })

        // Send Telegram notification
        if (result.is_complete) {
          notifyExperimentComplete(brief.user_id, brief.id, result.brief).catch(() => {})
        } else {
          notifyExperimentDigest(brief.user_id, brief.id, [result.run], result.brief).catch(() => {})
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[CronExperimentRunner] Brief ${brief.id} failed:`, msg)
        results.push({ briefId: brief.id, briefName: brief.name, status: 'error', error: msg })
      }
    }

    return NextResponse.json({ ran: briefs.length, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[CronExperimentRunner] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
