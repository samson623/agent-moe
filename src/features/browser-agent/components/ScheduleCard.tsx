'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Clock, Pause, Play, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { BrowserTaskSchedule, BrowserTask } from '../types'
import { useScheduleRuns } from '../hooks/use-schedule-runs'

interface ScheduleCardProps {
  schedule: BrowserTaskSchedule
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

const TYPE_LABELS: Record<string, string> = {
  once: 'Once',
  daily: 'Daily',
  weekly: 'Weekly',
  custom_cron: 'Custom',
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  running: 'text-blue-400',
  pending: 'text-yellow-400',
  timeout: 'text-orange-400',
}

function formatRelativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const absDiff = Math.abs(diff)
  const past = diff < 0

  if (absDiff < 60000) return past ? 'just now' : 'in <1m'
  if (absDiff < 3600000) {
    const mins = Math.round(absDiff / 60000)
    return past ? `${mins}m ago` : `in ${mins}m`
  }
  if (absDiff < 86400000) {
    const hrs = Math.round(absDiff / 3600000)
    return past ? `${hrs}h ago` : `in ${hrs}h`
  }
  const days = Math.round(absDiff / 86400000)
  return past ? `${days}d ago` : `in ${days}d`
}

export function ScheduleCard({ schedule, onToggle, onDelete }: ScheduleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { runs, isLoading: runsLoading } = useScheduleRuns(expanded ? schedule.id : null)

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border bg-[var(--surface-solid)] overflow-hidden transition-all',
        schedule.is_active ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-60'
      )}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text)] truncate">{schedule.name}</h3>
              <span
                className={cn(
                  'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border',
                  schedule.is_active
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                )}
              >
                {schedule.is_active ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{schedule.url}</p>
          </div>

          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium border border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--accent)]/10">
            {TYPE_LABELS[schedule.schedule_type] ?? schedule.schedule_type}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <Clock size={11} />
            <span>
              {schedule.cron_expression
                ? schedule.cron_expression
                : schedule.scheduled_at
                  ? formatRelativeTime(schedule.scheduled_at)
                  : '—'}
            </span>
          </div>
          <span>{schedule.run_count} run{schedule.run_count !== 1 ? 's' : ''}</span>
          {schedule.next_run_at && (
            <span>Next: {formatRelativeTime(schedule.next_run_at)}</span>
          )}
          {schedule.last_run_at && (
            <span>Last: {formatRelativeTime(schedule.last_run_at)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggle(schedule.id)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all',
              schedule.is_active
                ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            )}
          >
            {schedule.is_active ? <Pause size={11} /> : <Play size={11} />}
            {schedule.is_active ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={11} />
            Delete
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all ml-auto"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            Runs
          </button>
        </div>
      </div>

      {/* Expanded: Run history */}
      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3">
          {runsLoading ? (
            <p className="text-xs text-[var(--text-muted)]">Loading runs...</p>
          ) : runs.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">No runs yet</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {runs.map((run: BrowserTask) => (
                <div key={run.id} className="flex items-center justify-between text-xs">
                  <span className={STATUS_COLORS[run.status] ?? 'text-[var(--text-muted)]'}>
                    {run.status}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    {run.result?.execution_time_ms ? `${(run.result.execution_time_ms / 1000).toFixed(1)}s` : '—'}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    {formatRelativeTime(run.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
