'use client'

import { CheckCircle, XCircle, SkipForward, Loader, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Pill } from '@/components/nebula'
import { useRuns } from '../hooks/use-runs'
import type { ScheduledMissionRunStatus } from '../types'

interface RunHistoryPanelProps {
  missionId: string
}

const STATUS_CONFIG: Record<
  ScheduledMissionRunStatus,
  { icon: typeof CheckCircle; tone: 'success' | 'danger' | 'warning' | 'muted'; label: string }
> = {
  completed: { icon: CheckCircle, tone: 'success', label: 'Completed' },
  failed: { icon: XCircle, tone: 'danger', label: 'Failed' },
  skipped: { icon: SkipForward, tone: 'warning', label: 'Skipped' },
  running: { icon: Loader, tone: 'muted', label: 'Running' },
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function RunHistoryPanel({ missionId }: RunHistoryPanelProps) {
  const { runs, loading, error } = useRuns(missionId, 30)

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse h-12 rounded-[var(--radius)] bg-[var(--surface-elevated)]" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-xs text-[var(--danger)] p-4">{error}</p>
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Clock size={24} className="text-[var(--text-disabled)]" />
        <p className="text-xs text-[var(--text-muted)] mt-2">No runs yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--border-subtle)]">
      {runs.map((run) => {
        const config = STATUS_CONFIG[run.status] ?? STATUS_CONFIG['running']!
        const StatusIcon = config.icon

        return (
          <div key={run.id} className="px-4 py-3 flex items-start gap-3">
            <StatusIcon
              size={14}
              className={cn(
                'mt-0.5 shrink-0',
                config.tone === 'success' && 'text-[var(--success)]',
                config.tone === 'danger' && 'text-[var(--danger)]',
                config.tone === 'warning' && 'text-[var(--warning)]',
                config.tone === 'muted' && 'text-[var(--text-muted)] animate-spin',
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Pill tone={config.tone}>{config.label}</Pill>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {formatTime(run.started_at)}
                </span>
                {run.duration_ms !== null && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {formatDuration(run.duration_ms)}
                  </span>
                )}
                {run.tokens_used !== null && run.tokens_used > 0 && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {run.tokens_used} tok
                  </span>
                )}
              </div>
              {run.result_summary && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {run.result_summary}
                </p>
              )}
              {run.error_message && (
                <p className="text-xs text-[var(--danger)] mt-1 line-clamp-2">
                  {run.error_message}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
