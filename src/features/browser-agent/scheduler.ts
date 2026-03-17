/**
 * BrowserTaskScheduler — node-cron based scheduler for recurring browser tasks.
 *
 * Runs as a singleton within the Next.js server process.
 * Bootstrapped via instrumentation.ts on server start.
 */

import 'server-only'

import * as cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'
import { createAdminClient } from '@/lib/supabase/server'
import { getActiveSchedules, updateSchedule } from '@/lib/supabase/queries/browser-task-schedules'
import { createBrowserTask } from '@/lib/supabase/queries/browser-tasks'
import { TaskExecutor } from './task-executor'
import type { BrowserTaskSchedule } from './types'

class BrowserTaskScheduler {
  private jobs = new Map<string, ScheduledTask>()
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>()
  private started = false

  async start(): Promise<void> {
    if (this.started) return
    this.started = true

    console.log('[Scheduler] Starting browser task scheduler...')

    try {
      const client = await createAdminClient()
      const { data: schedules, error } = await getActiveSchedules(client)

      if (error) {
        console.error('[Scheduler] Failed to load schedules:', error)
        return
      }

      for (const schedule of schedules ?? []) {
        this.register(schedule)
      }

      console.log(`[Scheduler] Loaded ${schedules?.length ?? 0} active schedules`)
    } catch (err) {
      console.error('[Scheduler] Startup error:', err)
    }
  }

  register(schedule: BrowserTaskSchedule): void {
    // Clean up any existing job for this schedule
    this.unregister(schedule.id)

    if (schedule.schedule_type === 'once') {
      this.registerOnce(schedule)
    } else {
      this.registerCron(schedule)
    }
  }

  unregister(scheduleId: string): void {
    const job = this.jobs.get(scheduleId)
    if (job) {
      job.stop()
      this.jobs.delete(scheduleId)
    }

    const timeout = this.timeouts.get(scheduleId)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(scheduleId)
    }
  }

  stop(): void {
    console.log('[Scheduler] Stopping all scheduled jobs...')
    for (const [id] of this.jobs) {
      this.unregister(id)
    }
    for (const [id] of this.timeouts) {
      this.unregister(id)
    }
    this.started = false
  }

  get activeCount(): number {
    return this.jobs.size + this.timeouts.size
  }

  private registerOnce(schedule: BrowserTaskSchedule): void {
    if (!schedule.scheduled_at) {
      console.warn(`[Scheduler] Schedule ${schedule.id} is 'once' but has no scheduled_at`)
      return
    }

    const delay = new Date(schedule.scheduled_at).getTime() - Date.now()

    if (delay <= 0) {
      // Already past — fire immediately
      console.log(`[Scheduler] Schedule ${schedule.id} (once) is overdue — firing now`)
      void this.trigger(schedule)
      return
    }

    console.log(`[Scheduler] Schedule "${schedule.name}" (once) in ${Math.round(delay / 1000)}s`)
    const timeout = setTimeout(() => {
      this.timeouts.delete(schedule.id)
      void this.trigger(schedule)
    }, delay)

    this.timeouts.set(schedule.id, timeout)
  }

  private registerCron(schedule: BrowserTaskSchedule): void {
    const expression = schedule.cron_expression

    if (!expression || !cron.validate(expression)) {
      console.warn(`[Scheduler] Schedule ${schedule.id} has invalid cron: "${expression}"`)
      return
    }

    console.log(`[Scheduler] Schedule "${schedule.name}" cron: ${expression} (${schedule.timezone})`)

    const job = cron.schedule(expression, () => {
      void this.trigger(schedule)
    }, {
      timezone: schedule.timezone || 'UTC',
    })

    this.jobs.set(schedule.id, job)
  }

  private async trigger(schedule: BrowserTaskSchedule): Promise<void> {
    console.log(`[Scheduler] Triggering "${schedule.name}" (${schedule.id})`)

    try {
      const client = await createAdminClient()

      // Create a browser task from the schedule template
      const { data: task, error: taskError } = await createBrowserTask(client, {
        workspace_id: schedule.workspace_id,
        task_type: schedule.task_type,
        url: schedule.url,
        instructions: schedule.instructions,
        config: schedule.config,
        priority: schedule.priority,
        max_retries: schedule.max_retries,
        timeout_ms: schedule.timeout_ms,
        schedule_id: schedule.id,
      })

      if (taskError || !task) {
        console.error(`[Scheduler] Failed to create task for schedule ${schedule.id}:`, taskError)
        return
      }

      // Fire-and-forget execution
      const executor = new TaskExecutor()
      executor.execute(task.id, client).catch((err) => {
        console.error(`[Scheduler] Task execution error for schedule ${schedule.id}:`, err)
      })

      // Update schedule metadata
      const updates: Partial<BrowserTaskSchedule> = {
        last_run_at: new Date().toISOString(),
        run_count: schedule.run_count + 1,
      }

      // Compute next run for recurring schedules
      if (schedule.schedule_type !== 'once' && schedule.cron_expression) {
        updates.next_run_at = computeNextCronRun(schedule.cron_expression)
      }

      // Deactivate one-time schedules after firing
      if (schedule.schedule_type === 'once') {
        updates.is_active = false
      }

      await updateSchedule(client, schedule.id, updates)

      // Update the in-memory schedule's run_count for next trigger
      schedule.run_count = (schedule.run_count ?? 0) + 1
    } catch (err) {
      console.error(`[Scheduler] Trigger error for schedule ${schedule.id}:`, err)
    }
  }
}

/**
 * Compute the next run time for a cron expression (approximate).
 * Returns ISO string ~1 minute into the future as a rough estimate.
 */
function computeNextCronRun(cronExpression: string): string {
  // node-cron doesn't expose next-run calculation.
  // We parse the cron to estimate. For simplicity, store "now + interval".
  // The actual trigger is driven by node-cron, this is just for display.
  const parts = cronExpression.split(' ')

  // Simple heuristic: if minute and hour are fixed, assume daily
  const now = new Date()
  const next = new Date(now)

  if (parts.length >= 5) {
    const minute = parseInt(parts[0] ?? '', 10)
    const hour = parseInt(parts[1] ?? '', 10)

    if (!isNaN(minute) && !isNaN(hour)) {
      next.setHours(hour, minute, 0, 0)
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      return next.toISOString()
    }
  }

  // Fallback: next day same time
  next.setDate(next.getDate() + 1)
  return next.toISOString()
}

// ── Singleton (survives HMR in dev) ──

const globalForScheduler = globalThis as unknown as { __browserTaskScheduler?: BrowserTaskScheduler }

export function getScheduler(): BrowserTaskScheduler {
  if (!globalForScheduler.__browserTaskScheduler) {
    globalForScheduler.__browserTaskScheduler = new BrowserTaskScheduler()
  }
  return globalForScheduler.__browserTaskScheduler
}

export { BrowserTaskScheduler }
