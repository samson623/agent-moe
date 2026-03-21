'use client'

import { cn } from '@/lib/utils'
import { ChevronRight, RefreshCw, Film, Radio } from 'lucide-react'
import { useExecuteBrowserTask } from '../hooks/use-execute-browser-task'
import { TASK_TYPE_CONFIG, STATUS_CONFIG } from '../constants'
import type { BrowserTask } from '../types'

interface BrowserTaskCardProps {
  task: BrowserTask
  onClick?: () => void
  onActionComplete?: () => void
}

function truncateUrl(url: string, max = 50): string {
  try {
    const u = new URL(url)
    const short = u.hostname + u.pathname
    return short.length > max ? short.slice(0, max) + '…' : short
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url
  }
}

export function BrowserTaskCard({ task, onClick, onActionComplete }: BrowserTaskCardProps) {
  const typeCfg = TASK_TYPE_CONFIG[task.task_type]
  const statusCfg = STATUS_CONFIG[task.status]
  const { execute, cancel, isExecuting, isCancelling } = useExecuteBrowserTask()

  const Icon = typeCfg.Icon

  async function handleExecute(e: React.MouseEvent) {
    e.stopPropagation()
    await execute(task.id)
    onActionComplete?.()
  }

  async function handleCancel(e: React.MouseEvent) {
    e.stopPropagation()
    await cancel(task.id)
    onActionComplete?.()
  }

  async function handleRetry(e: React.MouseEvent) {
    e.stopPropagation()
    await execute(task.id)
    onActionComplete?.()
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-[var(--radius-lg)] border bg-[var(--surface)] p-4 cursor-pointer',
        'transition-all duration-150 hover:scale-[1.01] group',
        'border-[var(--border)] hover:border-[var(--border-hover)]'
      )}
      style={{ borderTopColor: typeCfg.color, borderTopWidth: 2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{ background: `${typeCfg.color}18`, border: `1px solid ${typeCfg.color}30` }}
          >
            <Icon size={13} style={{ color: typeCfg.color }} />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold"
              style={{ color: typeCfg.color }}
            >
              {typeCfg.label}
            </p>
            <p className="text-xs md:text-sm text-[var(--text-muted)] truncate">
              {truncateUrl(task.url)}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          {statusCfg.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: statusCfg.color }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ background: statusCfg.color }}
              />
            </span>
          )}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full border"
            style={{
              color: statusCfg.color,
              borderColor: `${statusCfg.color}40`,
              background: `${statusCfg.color}10`,
            }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
        {task.instructions}
      </p>

      {/* Priority + Retries + Indicators */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-[var(--text-muted)]">
          Priority <span className="font-semibold text-[var(--text)]">{task.priority}</span>/10
        </span>
        {task.retry_count > 0 && (
          <span className="text-xs text-[var(--text-muted)]">
            <RefreshCw size={9} className="inline mr-0.5" />
            {task.retry_count}/{task.max_retries} retries
          </span>
        )}
        {task.recording_url && (
          <span className="text-xs text-[#8b5cf6] flex items-center gap-1">
            <Film size={10} />
            Recorded
          </span>
        )}
        {task.status === 'running' && task.config.enable_live_view && (
          <span className="text-xs text-[#10b981] flex items-center gap-1">
            <Radio size={10} className="animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Footer: timestamp + action */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">
          {task.completed_at
            ? `Done ${new Date(task.completed_at).toLocaleTimeString()}`
            : `Created ${new Date(task.created_at).toLocaleDateString()}`}
        </span>

        <div className="flex items-center gap-1.5">
          {task.status === 'pending' && (
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full transition-all',
                'bg-[var(--primary)] text-white hover:opacity-90',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isExecuting ? 'Starting…' : 'Execute'}
            </button>
          )}
          {task.status === 'running' && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full transition-all',
                'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--danger)] hover:text-[var(--danger)]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isCancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
          {(task.status === 'failed' || task.status === 'timeout') && (
            <button
              onClick={handleRetry}
              disabled={isExecuting}
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full transition-all',
                'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Retry
            </button>
          )}

          <ChevronRight
            size={12}
            className="text-[var(--text-disabled)] opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </div>
  )
}
