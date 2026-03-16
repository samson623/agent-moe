'use client'

import { cn } from '@/lib/utils'

interface ConnectorFiltersProps {
  statusFilter: string
  platformFilter: string
  onStatusChange: (v: string) => void
  onPlatformChange: (v: string) => void
}

const STATUS_OPTIONS = ['all', 'connected', 'disconnected', 'error', 'pending'] as const
const PLATFORM_OPTIONS = ['all', 'x', 'linkedin', 'instagram', 'youtube', 'email', 'notion', 'webhook'] as const

const PLATFORM_LABELS: Record<string, string> = {
  all: 'All Platforms',
  x: 'X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  youtube: 'YouTube',
  email: 'Email',
  notion: 'Notion',
  webhook: 'Webhook',
}

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
  pending: 'Pending',
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap',
        active
          ? 'bg-[var(--primary)] text-white'
          : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
      )}
    >
      {label}
    </button>
  )
}

export function ConnectorFilters({
  statusFilter,
  platformFilter,
  onStatusChange,
  onPlatformChange,
}: ConnectorFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Status filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-[var(--text-muted)] font-medium mr-1">Status:</span>
        {STATUS_OPTIONS.map((s) => (
          <FilterPill
            key={s}
            label={STATUS_LABELS[s] ?? s}
            active={statusFilter === s}
            onClick={() => onStatusChange(s)}
          />
        ))}
      </div>

      {/* Platform filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-[var(--text-muted)] font-medium mr-1">Platform:</span>
        {PLATFORM_OPTIONS.map((p) => (
          <FilterPill
            key={p}
            label={PLATFORM_LABELS[p] ?? p}
            active={platformFilter === p}
            onClick={() => onPlatformChange(p)}
          />
        ))}
      </div>
    </div>
  )
}
