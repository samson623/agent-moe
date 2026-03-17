'use client'

import { cn } from '@/lib/utils'
import type { CampaignStatus } from '@/features/launchpad/types'

type FilterValue = CampaignStatus | 'all'

interface CampaignFiltersProps {
  activeStatus: FilterValue
  onChange: (status: FilterValue) => void
}

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export function CampaignFilters({ activeStatus, onChange }: CampaignFiltersProps) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar"
      role="group"
      aria-label="Filter campaigns by status"
    >
      {FILTER_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={activeStatus === value}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0',
            activeStatus === value
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
