/**
 * StepEmitter — Singleton pub/sub for autonomous browser step events
 *
 * Allows BrowserRunner to emit step events during autonomous execution,
 * and the SSE live endpoint to subscribe to them for real-time streaming.
 *
 * Uses a module-level Map (singleton in the Node.js process).
 */

import type { AutonomousStep } from './autonomous-browser'

export type StepCallback = (step: AutonomousStep) => void

// Module-level singleton — shared across all API route invocations
const emitters = new Map<string, Set<StepCallback>>()

/**
 * Subscribe to step events for a task. Returns an unsubscribe function.
 */
export function subscribeToSteps(taskId: string, callback: StepCallback): () => void {
  if (!emitters.has(taskId)) {
    emitters.set(taskId, new Set())
  }
  emitters.get(taskId)!.add(callback)

  return () => {
    const subs = emitters.get(taskId)
    if (subs) {
      subs.delete(callback)
      if (subs.size === 0) {
        emitters.delete(taskId)
      }
    }
  }
}

/**
 * Emit a step event for a task. Called by BrowserRunner during autonomous execution.
 */
export function emitStep(taskId: string, step: AutonomousStep): void {
  const subs = emitters.get(taskId)
  if (!subs) return

  for (const cb of subs) {
    try {
      cb(step)
    } catch (err) {
      console.error('[StepEmitter] Subscriber error:', err)
    }
  }
}

/**
 * Clean up all subscribers for a task. Call when task completes.
 */
export function cleanupStepEmitter(taskId: string): void {
  emitters.delete(taskId)
}

/**
 * Check if a task has any step subscribers.
 */
export function hasStepSubscribers(taskId: string): boolean {
  const subs = emitters.get(taskId)
  return Boolean(subs && subs.size > 0)
}
