'use client'

import { Clock, Play, Pause, Zap, Cpu, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Pill } from '@/components/nebula'
import type { ScheduledMission } from '../types'

interface MissionCardProps {
  mission: ScheduledMission
  selected: boolean
  onSelect: () => void
  onToggle: () => void
}

const MODE_LABELS: Record<string, { label: string; tone: 'primary' | 'accent' | 'muted' }> = {
  light: { label: 'GPT-5 Nano', tone: 'accent' },
  heavy: { label: 'Claude', tone: 'primary' },
  auto: { label: 'Auto', tone: 'muted' },
}

const SCHEDULE_LABELS: Record<string, string> = {
  once: 'One-time',
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  custom_cron: 'Cron',
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = Date.now()
  const diffMs = d.getTime() - now

  if (Math.abs(diffMs) < 60_000) return 'just now'

  const absMins = Math.round(Math.abs(diffMs) / 60_000)
  if (absMins < 60) return diffMs > 0 ? `in ${absMins}m` : `${absMins}m ago`

  const absHours = Math.round(absMins / 60)
  if (absHours < 24) return diffMs > 0 ? `in ${absHours}h` : `${absHours}h ago`

  const absDays = Math.round(absHours / 24)
  return diffMs > 0 ? `in ${absDays}d` : `${absDays}d ago`
}

export function MissionCard({ mission, selected, onSelect, onToggle }: MissionCardProps) {
  const modeInfo = MODE_LABELS[mission.execution_mode] ?? MODE_LABELS['auto']!

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={cn(
        'rounded-[var(--radius-lg)] border p-4 transition-all duration-100 cursor-pointer',
        'bg-[var(--surface-solid)] hover:border-[var(--border-hover)]',
        selected
          ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]'
          : 'border-[var(--border)]',
      )}
    >
      {/* Top row: name + toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[var(--text)] truncate">
            {mission.name}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
            {mission.instruction}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={cn(
            'p-1.5 rounded-[var(--radius)] shrink-0 transition-colors',
            mission.is_active
              ? 'text-[var(--success)] hover:bg-[var(--success-muted)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]',
          )}
          aria-label={mission.is_active ? 'Pause mission' : 'Activate mission'}
        >
          {mission.is_active ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

      {/* Meta pills */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <Pill tone={mission.is_active ? 'success' : 'muted'}>
          {mission.is_active ? 'Active' : 'Paused'}
        </Pill>
        <Pill tone={modeInfo.tone}>{modeInfo.label}</Pill>
        <Pill tone="default">
          <Clock size={10} className="shrink-0" />
          {SCHEDULE_LABELS[mission.schedule_type] ?? mission.schedule_type}
        </Pill>
        {mission.permission_level === 'draft' && (
          <Pill tone="warning">Draft</Pill>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <RotateCw size={10} />
          {mission.run_count} runs
        </span>
        {mission.next_run_at && (
          <span className="flex items-center gap-1">
            <Zap size={10} />
            Next: {formatRelativeTime(mission.next_run_at)}
          </span>
        )}
        {mission.last_run_at && (
          <span className="flex items-center gap-1">
            <Cpu size={10} />
            Last: {formatRelativeTime(mission.last_run_at)}
          </span>
        )}
        {mission.consecutive_failures > 0 && (
          <span className="text-[var(--danger)] flex items-center gap-1">
            {mission.consecutive_failures} fail{mission.consecutive_failures > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
