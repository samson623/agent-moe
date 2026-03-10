'use client'

import { cn } from '@/lib/utils'
import type { ApprovalFilters } from '@/features/approval-queue/hooks'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revision_requested', label: 'Revision' },
] as const

const RISK_OPTIONS = [
  { value: 'all', label: 'All Risk' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const

interface ApprovalFiltersBarProps {
  filters: ApprovalFilters
  onStatusChange: (status: string) => void
  onRiskChange: (risk: string) => void
  activeCount: number
  onClear: () => void
}

function Pill({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
        isActive
          ? 'bg-[var(--primary)] text-white shadow-[0_0_8px_var(--primary)]'
          : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--primary-muted)]',
      )}
    >
      {label}
    </button>
  )
}

export function ApprovalFiltersBar({
  filters,
  onStatusChange,
  onRiskChange,
  activeCount,
  onClear,
}: ApprovalFiltersBarProps) {
  const currentStatus = filters.status ?? 'all'
  const currentRisk = filters.risk_level ?? 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            isActive={currentStatus === opt.value}
            onClick={() => { onStatusChange(opt.value) }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--border)]" aria-hidden="true" />

      {/* Risk level pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {RISK_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            isActive={currentRisk === opt.value}
            onClick={() => { onRiskChange(opt.value) }}
          />
        ))}
      </div>

      {/* Active count + clear */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors duration-150 flex items-center gap-1"
        >
          <span className="bg-[var(--primary)] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {activeCount}
          </span>
          Clear filters
        </button>
      )}
    </div>
  )
}
