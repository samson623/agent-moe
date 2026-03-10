'use client'

import { cn } from '@/lib/utils'
import type { BrowserTaskStatus, BrowserTaskType } from '../types'

interface BrowserTaskFiltersProps {
  status: BrowserTaskStatus | 'all'
  taskType: BrowserTaskType | 'all'
  urlSearch: string
  onStatusChange: (v: BrowserTaskStatus | 'all') => void
  onTaskTypeChange: (v: BrowserTaskType | 'all') => void
  onUrlSearchChange: (v: string) => void
  activeCount: number
}

const STATUS_OPTIONS: Array<{ value: BrowserTaskStatus | 'all'; label: string }> = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'running',   label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed',    label: 'Failed' },
  { value: 'timeout',   label: 'Timeout' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TYPE_OPTIONS: Array<{ value: BrowserTaskType | 'all'; label: string }> = [
  { value: 'all',          label: 'All Types' },
  { value: 'scrape',       label: 'Scrape' },
  { value: 'screenshot',   label: 'Screenshot' },
  { value: 'navigate',     label: 'Navigate' },
  { value: 'extract_data', label: 'Extract' },
  { value: 'click',        label: 'Click' },
  { value: 'fill_form',    label: 'Fill Form' },
  { value: 'submit_form',  label: 'Submit' },
  { value: 'monitor',      label: 'Monitor' },
]

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
        active
          ? 'border-[var(--accent)] text-[var(--accent)] bg-[rgba(99,102,241,0.08)]'
          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]'
      )}
    >
      {children}
    </button>
  )
}

export function BrowserTaskFilters({
  status,
  taskType,
  urlSearch,
  onStatusChange,
  onTaskTypeChange,
  onUrlSearchChange,
  activeCount,
}: BrowserTaskFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Status */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--text-muted)] font-medium w-14 shrink-0">Status</span>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <FilterPill
              key={opt.value}
              active={status === opt.value}
              onClick={() => onStatusChange(opt.value as BrowserTaskStatus | 'all')}
            >
              {opt.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Row 2: Type + URL search + Clear */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)] font-medium w-14 shrink-0">Type</span>
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                active={taskType === opt.value}
                onClick={() => onTaskTypeChange(opt.value as BrowserTaskType | 'all')}
              >
                {opt.label}
              </FilterPill>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            value={urlSearch}
            onChange={(e) => onUrlSearchChange(e.target.value)}
            placeholder="Search by URL…"
            className={cn(
              'h-7 px-3 rounded-full text-xs border border-[var(--border)] bg-[var(--surface)]',
              'text-[var(--text)] placeholder:text-[var(--text-muted)]',
              'focus:border-[var(--accent)] focus:outline-none transition-colors w-40'
            )}
          />

          {activeCount > 0 && (
            <button
              onClick={() => {
                onStatusChange('all')
                onTaskTypeChange('all')
                onUrlSearchChange('')
              }}
              className="text-xs text-[var(--danger)] hover:opacity-80 transition-opacity"
            >
              Clear {activeCount}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
