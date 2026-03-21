/**
 * ExecutorRegistry — Singleton map of taskId → TaskExecutor
 *
 * Allows the execute route to register a running TaskExecutor so that
 * the live-stream SSE route can find it and subscribe to screencast frames.
 *
 * Uses a module-level Map (singleton in the Node.js process).
 */

import type { TaskExecutor } from './task-executor'

// Module-level singleton — shared across all API route invocations in the same process
const registry = new Map<string, TaskExecutor>()

/**
 * Register an executor for a task. Call this when starting execution.
 */
export function registerExecutor(taskId: string, executor: TaskExecutor): void {
  registry.set(taskId, executor)
  console.log(`[ExecutorRegistry] Registered executor for task ${taskId} (${registry.size} active)`)
}

/**
 * Unregister an executor after task completion. Call this in finally blocks.
 */
export function unregisterExecutor(taskId: string): void {
  registry.delete(taskId)
  console.log(`[ExecutorRegistry] Unregistered executor for task ${taskId} (${registry.size} active)`)
}

/**
 * Get the executor for a running task, or null if not found.
 */
export function getExecutor(taskId: string): TaskExecutor | null {
  return registry.get(taskId) ?? null
}

/**
 * Check if a task has an active executor.
 */
export function hasExecutor(taskId: string): boolean {
  return registry.has(taskId)
}

/**
 * Get the count of active executors.
 */
export function getActiveCount(): number {
  return registry.size
}
