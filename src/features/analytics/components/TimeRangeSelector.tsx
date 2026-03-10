'use client'

import { cn } from '@/lib/utils'
import type { TimeRange } from '@/features/analytics/types'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

const OPTIONS: { label: string; value: TimeRange }[] = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
]

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] border border-[var(--border)]">
      {OPTIONS.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-[var(--radius)] transition-all duration-150',
              isActive
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
            )}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
