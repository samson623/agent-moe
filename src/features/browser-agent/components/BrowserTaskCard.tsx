'use client'

import { cn } from '@/lib/utils'
import {
  Globe,
  Camera,
  MousePointer,
  FileText,
  Search,
  Monitor,
  Send,
  Navigation,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { useExecuteBrowserTask } from '../hooks/use-execute-browser-task'
import type { BrowserTask, BrowserTaskType, BrowserTaskStatus } from '../types'

interface BrowserTaskCardProps {
  task: BrowserTask
  onClick?: () => void
  onActionComplete?: () => void
}

const TASK_TYPE_CONFIG: Record<BrowserTaskType, { label: string; Icon: React.ElementType; color: string }> = {
  scrape:       { label: 'Scrape',       Icon: Globe,         color: '#6366f1' },
  screenshot:   { label: 'Screenshot',   Icon: Camera,        color: '#8b5cf6' },
  click:        { label: 'Click',        Icon: MousePointer,  color: '#f59e0b' },
  fill_form:    { label: 'Fill Form',    Icon: FileText,      color: '#3b82f6' },
  navigate:     { label: 'Navigate',     Icon: Navigation,    color: '#10b981' },
  monitor:      { label: 'Monitor',      Icon: Monitor,       color: '#ec4899' },
  extract_data: { label: 'Extract Data', Icon: Search,        color: '#14b8a6' },
  submit_form:  { label: 'Submit Form',  Icon: Send,          color: '#f97316' },
}

const STATUS_CONFIG: Record<BrowserTaskStatus, { label: string; color: string; pulse?: boolean }> = {
  pending:   { label: 'Pending',   color: '#f59e0b' },
  running:   { label: 'Running',   color: '#3b82f6', pulse: true },
  completed: { label: 'Completed', color: '#10b981' },
  failed:    { label: 'Failed',    color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#6b7280' },
  timeout:   { label: 'Timeout',   color: '#f97316' },
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
            <p className="text-[11px] text-[var(--text-muted)] truncate">
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
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
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

      {/* Priority + Retries */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] text-[var(--text-muted)]">
          Priority <span className="font-semibold text-[var(--text)]">{task.priority}</span>/10
        </span>
        {task.retry_count > 0 && (
          <span className="text-[10px] text-[var(--text-muted)]">
            <RefreshCw size={9} className="inline mr-0.5" />
            {task.retry_count}/{task.max_retries} retries
          </span>
        )}
      </div>

      {/* Footer: timestamp + action */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)]">
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
                'text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all',
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
                'text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all',
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
                'text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all',
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
