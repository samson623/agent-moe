/**
 * Mission Runner — The Heart of the Autonomous Scheduler
 *
 * Standalone script executed by Windows Task Scheduler every 1 minute.
 * Checks for due scheduled missions, acquires an atomic lock, executes
 * each mission via the appropriate model, and stores results in Supabase.
 *
 * Execution logic is in src/features/scheduler/executor.ts (shared module).
 *
 * Run manually:  npx tsx scripts/mission-runner.ts
 * Install:       npx tsx scripts/install-scheduler.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { resolve } from 'path'
import {
  resolveExecutionMode,
  executeLightMission,
  executeHeavyMission,
  computeNextRun,
  type ExecutorConfig,
} from '../src/features/scheduler/executor'

// ---------------------------------------------------------------------------
// Load .env.local (same pattern as push-ai-news-signals.ts)
// ---------------------------------------------------------------------------

const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1]!.trim()] = match[2]!.trim()
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']!

const supabase = createClient(supabaseUrl, supabaseKey)

const executorConfig: ExecutorConfig = {
  openaiApiKey: env['OPENAI_API_KEY']!,
  nanoModel: env['OPENAI_NANO_MODEL'] ?? 'gpt-5-nano',
  env,
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(msg: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString()
  if (data) {
    console.log(`[${ts}] [mission-runner] ${msg}`, data)
  } else {
    console.log(`[${ts}] [mission-runner] ${msg}`)
  }
}

function logError(msg: string, err?: unknown) {
  const ts = new Date().toISOString()
  console.error(`[${ts}] [mission-runner] ERROR: ${msg}`, err instanceof Error ? err.message : err)
}

// ---------------------------------------------------------------------------
// Atomic lock — prevents duplicate execution when Task Scheduler overlaps
// ---------------------------------------------------------------------------

const LOCK_FILE = resolve(process.cwd(), '.scheduler.lock')
const LOCK_STALE_MS = 5 * 60 * 1000 // 5 minutes — if lock is older, consider it stale

interface LockData {
  pid: number
  acquiredAt: number
}

function acquireLock(): boolean {
  if (existsSync(LOCK_FILE)) {
    try {
      const raw = readFileSync(LOCK_FILE, 'utf-8')
      const lock: LockData = JSON.parse(raw)
      const age = Date.now() - lock.acquiredAt

      if (age < LOCK_STALE_MS) {
        log(`Lock held by PID ${lock.pid} (${Math.round(age / 1000)}s ago) — skipping`)
        return false
      }

      log(`Stale lock from PID ${lock.pid} (${Math.round(age / 1000)}s) — overriding`)
    } catch {
      log('Corrupt lock file — overriding')
    }
  }

  const lockData: LockData = { pid: process.pid, acquiredAt: Date.now() }
  writeFileSync(LOCK_FILE, JSON.stringify(lockData), 'utf-8')
  return true
}

function releaseLock() {
  try {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE)
  } catch {
    // Best-effort cleanup
  }
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

interface MissionRow {
  id: string
  name: string
  instruction: string
  schedule_type: string
  cron_expression: string | null
  timezone: string
  execution_mode: string
  permission_level: string
  is_active: boolean
  consecutive_failures: number
  max_consecutive_failures: number
  run_count: number
}

async function main() {
  log('Starting mission runner tick')

  // 1. Acquire lock
  if (!acquireLock()) {
    log('Could not acquire lock — exiting')
    process.exit(0)
  }

  try {
    // 2. Find due missions
    const now = new Date()
    const { data: dueMissions, error: dueErr } = await supabase
      .from('scheduled_missions')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString())
      .order('next_run_at', { ascending: true })

    if (dueErr) {
      logError('Failed to query due missions', dueErr)
      return
    }

    const missions = (dueMissions ?? []) as unknown as MissionRow[]

    if (missions.length === 0) {
      log('No missions due — done')
      return
    }

    log(`Found ${missions.length} due mission(s)`)

    // 3. Execute each mission
    for (const mission of missions) {
      log(`Executing: "${mission.name}" [${mission.id}]`, {
        mode: mission.execution_mode,
        permission: mission.permission_level,
      })

      // Skip draft-permission missions (they need approval)
      if (mission.permission_level === 'draft') {
        log(`Skipping draft mission "${mission.name}" — requires approval`)

        await supabase.from('scheduled_mission_runs').insert({
          scheduled_mission_id: mission.id,
          status: 'skipped',
          execution_mode: mission.execution_mode,
          result_summary: 'Skipped — draft permission level requires approval',
          started_at: now.toISOString(),
          completed_at: now.toISOString(),
        })

        const nextRun = computeNextRun(mission.schedule_type, mission.cron_expression, mission.timezone)
        await supabase
          .from('scheduled_missions')
          .update({
            next_run_at: nextRun?.toISOString() ?? null,
            last_run_at: now.toISOString(),
            is_active: nextRun !== null,
          })
          .eq('id', mission.id)

        continue
      }

      const resolvedMode = resolveExecutionMode(mission.execution_mode, mission.instruction)
      const startTime = Date.now()

      // Insert a 'running' record
      const { data: runRow, error: runInsertErr } = await supabase
        .from('scheduled_mission_runs')
        .insert({
          scheduled_mission_id: mission.id,
          status: 'running',
          execution_mode: resolvedMode,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (runInsertErr || !runRow) {
        logError(`Failed to create run record for "${mission.name}"`, runInsertErr)
        continue
      }

      const runId = (runRow as { id: string }).id

      try {
        // Execute via shared executor
        const result = resolvedMode === 'light'
          ? await executeLightMission(mission.instruction, executorConfig)
          : executeHeavyMission(mission.instruction, executorConfig)

        const durationMs = Date.now() - startTime

        // Update run record with success
        await supabase
          .from('scheduled_mission_runs')
          .update({
            status: 'completed',
            result_summary: result.summary,
            result_data: result.data,
            tokens_used: result.tokensUsed,
            duration_ms: durationMs,
            completed_at: new Date().toISOString(),
          })
          .eq('id', runId)

        // Update mission state: reset failures, advance schedule
        const nextRun = computeNextRun(mission.schedule_type, mission.cron_expression, mission.timezone)
        await supabase
          .from('scheduled_missions')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRun?.toISOString() ?? null,
            run_count: mission.run_count + 1,
            consecutive_failures: 0,
            is_active: nextRun !== null,
          })
          .eq('id', mission.id)

        log(`Completed: "${mission.name}" in ${durationMs}ms (${resolvedMode})`, {
          tokens: result.tokensUsed,
          summary: result.summary.slice(0, 100),
        })
      } catch (execErr) {
        const durationMs = Date.now() - startTime
        const errorMsg = execErr instanceof Error ? execErr.message : String(execErr)
        const newFailCount = mission.consecutive_failures + 1

        logError(`Mission "${mission.name}" failed`, execErr)

        // Update run record with failure
        await supabase
          .from('scheduled_mission_runs')
          .update({
            status: 'failed',
            error_message: errorMsg,
            duration_ms: durationMs,
            completed_at: new Date().toISOString(),
          })
          .eq('id', runId)

        // Auto-pause after max consecutive failures
        const shouldPause = newFailCount >= mission.max_consecutive_failures
        const nextRun = computeNextRun(mission.schedule_type, mission.cron_expression, mission.timezone)

        await supabase
          .from('scheduled_missions')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: shouldPause ? null : (nextRun?.toISOString() ?? null),
            run_count: mission.run_count + 1,
            consecutive_failures: newFailCount,
            is_active: !shouldPause && nextRun !== null,
          })
          .eq('id', mission.id)

        if (shouldPause) {
          log(`Auto-paused "${mission.name}" after ${newFailCount} consecutive failures`)
        }
      }
    }

    log(`Tick complete — processed ${missions.length} mission(s)`)
  } finally {
    releaseLock()
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logError('Fatal error', err)
    releaseLock()
    process.exit(1)
  })
