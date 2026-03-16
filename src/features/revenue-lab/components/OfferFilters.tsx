'use client'

import { cn } from '@/lib/utils'

const OFFER_TYPE_LABEL: Record<string, string> = {
  lead_magnet: 'Lead Magnet',
  product: 'Product',
  course: 'Course',
  service: 'Service',
  consultation: 'Consultation',
  subscription: 'Subscription',
  affiliate: 'Affiliate',
}

const STATUS_OPTIONS = ['all', 'active', 'inactive', 'archived'] as const
const TYPE_OPTIONS = [
  'all',
  'lead_magnet',
  'product',
  'course',
  'service',
  'consultation',
  'subscription',
  'affiliate',
] as const

interface OfferFiltersProps {
  statusFilter: string
  typeFilter: string
  onStatusChange: (v: string) => void
  onTypeChange: (v: string) => void
}

const PILL_BASE =
  'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap'
const PILL_ACTIVE = 'bg-[var(--primary)] text-white'
const PILL_INACTIVE =
  'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)]'

function getStatusLabel(s: string) {
  if (s === 'all') return 'All'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getTypeLabel(t: string) {
  if (t === 'all') return 'All'
  return OFFER_TYPE_LABEL[t] ?? t
}

export function OfferFilters({
  statusFilter,
  typeFilter,
  onStatusChange,
  onTypeChange,
}: OfferFiltersProps) {
  return (
    <div className="space-y-2">
      {/* Status row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-medium text-[var(--text-muted)] shrink-0 mr-1">
          Status:
        </span>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatusChange(s)}
            className={cn(PILL_BASE, statusFilter === s ? PILL_ACTIVE : PILL_INACTIVE)}
          >
            {getStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* Type row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-medium text-[var(--text-muted)] shrink-0 mr-1">
          Type:
        </span>
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={cn(PILL_BASE, typeFilter === t ? PILL_ACTIVE : PILL_INACTIVE)}
          >
            {getTypeLabel(t)}
          </button>
        ))}
      </div>
    </div>
  )
}
