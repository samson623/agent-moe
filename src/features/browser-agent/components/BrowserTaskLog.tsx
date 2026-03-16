'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react'
import type { BrowserTask } from '../types'

interface BrowserTaskLogProps {
  task: BrowserTask
}

interface LogStep {
  label: string
  status: 'done' | 'active' | 'pending' | 'error'
  detail?: string
}

function buildSteps(task: BrowserTask): LogStep[] {
  const steps: LogStep[] = []

  // Step 1: Queued
  steps.push({ label: 'Task queued', status: 'done', detail: new Date(task.created_at).toLocaleTimeString() })

  if (task.status === 'pending') {
    steps.push({ label: 'Waiting for executor', status: 'active' })
    return steps
  }

  // Step 2: Started
  steps.push({
    label: 'Execution started',
    status: task.started_at ? 'done' : 'pending',
    detail: task.started_at ? new Date(task.started_at).toLocaleTimeString() : undefined,
  })

  if (task.status === 'running') {
    steps.push({ label: `Running: ${task.task_type}`, status: 'active' })
    return steps
  }

  if (task.status === 'cancelled') {
    steps.push({ label: 'Task cancelled', status: 'error' })
    return steps
  }

  if (task.status === 'timeout') {
    steps.push({ label: `Timed out after ${task.timeout_ms / 1000}s`, status: 'error' })
    return steps
  }

  // Step 3: Result
  if (task.retry_count > 0) {
    steps.push({
      label: `Retried ${task.retry_count} time${task.retry_count > 1 ? 's' : ''}`,
      status: 'done',
    })
  }

  if (task.status === 'failed') {
    steps.push({
      label: 'Execution failed',
      status: 'error',
      detail: task.error_message ?? task.result?.error,
    })
    return steps
  }

  if (task.status === 'completed') {
    const execMs = task.result?.execution_time_ms
    steps.push({
      label: 'Execution complete',
      status: 'done',
      detail: execMs ? `${(execMs / 1000).toFixed(2)}s` : (task.completed_at ? new Date(task.completed_at).toLocaleTimeString() : undefined),
    })
    steps.push({ label: 'Result stored', status: 'done' })
  }

  return steps
}

export function BrowserTaskLog({ task }: BrowserTaskLogProps) {
  const steps = buildSteps(task)

  return (
    <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex flex-col items-center shrink-0 mt-0.5">
            <div
              className={cn(
                'flex items-center justify-center w-5 h-5 rounded-full',
                step.status === 'done'    && 'text-[var(--success)]',
                step.status === 'active'  && 'text-[var(--primary)]',
                step.status === 'error'   && 'text-[var(--danger)]',
                step.status === 'pending' && 'text-[var(--text-disabled)]',
              )}
            >
              {step.status === 'done'    && <CheckCircle size={14} />}
              {step.status === 'active'  && <Loader2 size={14} className="animate-spin" />}
              {step.status === 'error'   && <XCircle size={14} />}
              {step.status === 'pending' && <Clock size={14} />}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'w-px h-4 mt-0.5',
                  step.status === 'done' ? 'bg-[var(--success)] opacity-30' : 'bg-[var(--border)]'
                )}
              />
            )}
          </div>

          {/* Content */}
          <div className="pb-3 min-w-0">
            <p
              className={cn(
                'text-xs font-medium leading-snug',
                step.status === 'done'    && 'text-[var(--text)]',
                step.status === 'active'  && 'text-[var(--primary)]',
                step.status === 'error'   && 'text-[var(--danger)]',
                step.status === 'pending' && 'text-[var(--text-disabled)]',
              )}
            >
              {step.label}
            </p>
            {step.detail && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 break-all">{step.detail}</p>
            )}
          </div>
        </div>
      ))}

      {/* Retry indicator */}
      {task.retry_count > 0 && task.status !== 'completed' && (
        <div className="flex items-center gap-1.5 pt-1 text-xs text-[var(--text-muted)]">
          <RefreshCw size={9} />
          <span>Attempt {task.retry_count + 1} of {task.max_retries + 1}</span>
        </div>
      )}
    </div>
  )
}
