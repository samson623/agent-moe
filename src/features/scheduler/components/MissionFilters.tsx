'use client'

import { cn } from '@/lib/utils'

export type ActiveFilter = 'all' | 'active' | 'inactive'

const FILTERS: { id: ActiveFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
]

interface MissionFiltersProps {
  current: ActiveFilter
  onChange: (filter: ActiveFilter) => void
}

export function MissionFilters({ current, onChange }: MissionFiltersProps) {
  return (
    <div className="flex items-center gap-1.5">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-pill)] border transition-colors duration-100',
            current === f.id
              ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
              : 'border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)]',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
