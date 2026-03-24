/**
 * POST /api/internal/execute-mission — Runs mission orchestrator.
 *
 * Triggered by the Telegram webhook handler (or any internal caller).
 * Runs in its own Vercel function invocation with extended maxDuration
 * so the orchestrator has time to complete Claude API calls.
 *
 * Protected by TELEGRAM_WEBHOOK_SECRET as a shared internal token.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env['TELEGRAM_WEBHOOK_SECRET']) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { missionId: string; workspaceId: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { missionId, workspaceId } = body
  if (!missionId || !workspaceId) {
    return NextResponse.json({ error: 'Missing missionId or workspaceId' }, { status: 400 })
  }

  console.log(`[execute-mission] Starting mission ${missionId}`)

  try {
    const { planAndExecuteMission } = await import(
      '@/features/mission-engine/services/orchestrator'
    )
    await planAndExecuteMission(missionId, workspaceId)
    console.log(`[execute-mission] Completed mission ${missionId}`)
    return NextResponse.json({ ok: true, missionId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[execute-mission] Failed mission ${missionId}:`, message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
