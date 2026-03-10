/**
 * TaskExecutor — Orchestration layer for browser task lifecycle
 *
 * Manages: status transitions, retry logic, timeout enforcement,
 * and DB updates. Wraps BrowserRunner with full lifecycle management.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserTask, updateBrowserTask, getPendingBrowserTasks } from '@/lib/supabase/queries/browser-tasks'
import type { Database } from '@/lib/supabase/types'
import { BrowserRunner } from './browser-runner'
import type { BrowserTaskResult } from './types'

type TypedClient = SupabaseClient<Database>

export class TaskExecutor {
  private readonly runner: BrowserRunner

  constructor(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium') {
    this.runner = new BrowserRunner(browserType)
  }

  /**
   * Execute a single browser task by ID.
   * Manages full DB lifecycle: pending → running → completed/failed.
   */
  async execute(taskId: string, supabase: TypedClient): Promise<void> {
    // Fetch the task
    const { data: task, error: fetchError } = await getBrowserTask(supabase, taskId)
    if (fetchError || !task) {
      console.error(`[TaskExecutor] Task ${taskId} not found: ${fetchError ?? 'null'}`)
      return
    }

    if (task.status !== 'pending') {
      console.warn(`[TaskExecutor] Task ${taskId} is not pending (status: ${task.status}) — skipping`)
      return
    }

    // Mark as running
    await updateBrowserTask(supabase, taskId, {
      status: 'running',
      started_at: new Date().toISOString(),
    })

    try {
      await this.runner.launch()

      const executeWithTimeout = this.withTimeout(
        this.runner.executeTask(task),
        task.timeout_ms,
      )

      const result = await executeWithTimeout

      // Success
      await updateBrowserTask(supabase, taskId, {
        status: result.success ? 'completed' : 'failed',
        result: result as BrowserTaskResult,
        error_message: result.error ?? undefined,
        completed_at: new Date().toISOString(),
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      const isTimeout = errorMsg.includes('timed out') || errorMsg.includes('Timeout')

      const currentRetries = task.retry_count

      if (isTimeout) {
        await updateBrowserTask(supabase, taskId, {
          status: 'timeout',
          error_message: `Task timed out after ${task.timeout_ms}ms`,
          completed_at: new Date().toISOString(),
        })
      } else if (currentRetries < task.max_retries) {
        // Retry: increment count and reset to pending
        await updateBrowserTask(supabase, taskId, {
          status: 'pending',
          retry_count: currentRetries + 1,
          error_message: `Attempt ${currentRetries + 1} failed: ${errorMsg}`,
          started_at: undefined,
        })
        console.log(`[TaskExecutor] Task ${taskId} queued for retry (attempt ${currentRetries + 2})`)
      } else {
        // Max retries exhausted
        await updateBrowserTask(supabase, taskId, {
          status: 'failed',
          error_message: `Failed after ${task.max_retries + 1} attempts: ${errorMsg}`,
          completed_at: new Date().toISOString(),
        })
      }
    } finally {
      await this.runner.close().catch((e: unknown) => {
        console.error('[TaskExecutor] Error closing browser:', e)
      })
    }
  }

  /**
   * Execute all pending tasks for a workspace (up to limit).
   * Tasks are executed sequentially, ordered by priority.
   */
  async executeBatch(
    workspaceId: string,
    supabase: TypedClient,
    limit = 5,
  ): Promise<{ executed: number; succeeded: number; failed: number }> {
    const { data: pendingTasks, error } = await getPendingBrowserTasks(supabase, workspaceId, limit)

    if (error || !pendingTasks) {
      console.error('[TaskExecutor] Failed to fetch pending tasks:', error)
      return { executed: 0, succeeded: 0, failed: 0 }
    }

    let succeeded = 0
    let failed = 0

    for (const task of pendingTasks) {
      await this.execute(task.id, supabase)

      // Re-fetch to check final status
      const { data: updated } = await getBrowserTask(supabase, task.id)
      if (updated?.status === 'completed') {
        succeeded++
      } else if (updated?.status === 'failed' || updated?.status === 'timeout') {
        failed++
      }
    }

    return { executed: pendingTasks.length, succeeded, failed }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Task timed out after ${ms}ms`)), ms)
    )
    return Promise.race([promise, timeout])
  }
}

export function createTaskExecutor(
  browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium',
): TaskExecutor {
  return new TaskExecutor(browserType)
}
