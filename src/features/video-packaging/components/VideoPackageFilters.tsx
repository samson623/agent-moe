'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VideoPackageFilters } from '../hooks/use-video-packages'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PLATFORMS = [
  { value: '', label: 'All' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
]

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface VideoPackageFiltersProps {
  filters: VideoPackageFilters
  onChange: (filters: VideoPackageFilters) => void
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
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 h-7 rounded-full text-xs font-medium transition-all duration-150',
        active
          ? 'bg-[var(--primary-muted)] text-[var(--primary)] border border-[rgba(59,130,246,0.3)]'
          : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text)]',
      )}
    >
      {label}
    </button>
  )
}

export function VideoPackageFilters({ filters, onChange }: VideoPackageFiltersProps) {
  const activePlatform = filters.platform ?? ''
  const activeStatus = filters.status ?? ''

  return (
    <div className="space-y-3">
      {/* Platform row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold text-[var(--text-disabled)] uppercase tracking-widest w-14 shrink-0">
          Platform
        </span>
        {PLATFORMS.map((p) => (
          <FilterPill
            key={p.value || '__all_platform'}
            label={p.label}
            active={activePlatform === p.value}
            onClick={() => onChange({ ...filters, platform: p.value || undefined })}
          />
        ))}
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold text-[var(--text-disabled)] uppercase tracking-widest w-14 shrink-0">
          Status
        </span>
        {STATUSES.map((s) => (
          <FilterPill
            key={s.value || '__all_status'}
            label={s.label}
            active={activeStatus === s.value}
            onClick={() => onChange({ ...filters, status: s.value || undefined })}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search packages…"
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          className={cn(
            'w-full h-8 pl-8 pr-3 rounded-[var(--radius)] text-xs',
            'bg-[var(--surface-elevated)] border border-[var(--border)]',
            'text-[var(--text)] placeholder-[var(--text-muted)]',
            'focus:outline-none focus:border-[var(--primary)]',
            'transition-colors duration-150',
          )}
        />
      </div>
    </div>
  )
}
