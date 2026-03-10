'use client'

import { useState } from 'react'
import { Edit2, Trash2, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OfferRow } from '@/lib/supabase/types'

const OFFER_TYPE_COLOR: Record<string, string> = {
  lead_magnet: '#10b981',
  product: '#3b82f6',
  course: '#7c3aed',
  service: '#f59e0b',
  consultation: '#06b6d4',
  subscription: '#f43f5e',
  affiliate: '#6b7280',
}

const OFFER_TYPE_LABEL: Record<string, string> = {
  lead_magnet: 'Lead Magnet',
  product: 'Product',
  course: 'Course',
  service: 'Service',
  consultation: 'Consultation',
  subscription: 'Subscription',
  affiliate: 'Affiliate',
}

function formatPrice(priceCents: number | null, currency = 'USD'): string {
  if (priceCents === null || priceCents === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(priceCents / 100)
}

interface OfferCardProps {
  offer: OfferRow
  onEdit?: (offer: OfferRow) => void
  onDelete?: (offer: OfferRow) => void
  onSelect?: (offer: OfferRow) => void
  selected?: boolean
}

export function OfferCard({ offer, onEdit, onDelete, onSelect, selected }: OfferCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const typeColor = OFFER_TYPE_COLOR[offer.offer_type] ?? '#6b7280'
  const typeLabel = OFFER_TYPE_LABEL[offer.offer_type] ?? offer.offer_type

  const statusVariant =
    offer.status === 'active' ? 'success' : 'muted'

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3.5',
        'border-b border-[var(--border-subtle)] last:border-b-0',
        'transition-colors duration-100',
        isHovered && 'bg-[var(--surface-hover)]',
        selected && 'bg-[var(--surface-elevated)]',
        onSelect && 'cursor-pointer',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(offer)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(offer) } : undefined}
    >
      {/* Left: colored dot + name + type */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: typeColor }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] truncate">{offer.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{typeLabel}</p>
        </div>
      </div>

      {/* Middle: price + CTA */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-[var(--text)] tabular-nums">
          {formatPrice(offer.price_cents, offer.currency)}
        </span>
        {offer.cta_text && (
          <Badge variant="outline" className="text-[10px]">
            {offer.cta_text}
          </Badge>
        )}
      </div>

      {/* Right: status + actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant={statusVariant} className="capitalize text-[10px]">
          {offer.status}
        </Badge>

        {onEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(offer) }}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] transition-colors"
            aria-label={`Edit ${offer.name}`}
          >
            <Edit2 size={13} />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(offer) }}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-elevated)] transition-colors"
            aria-label={`Delete ${offer.name}`}
          >
            <Trash2 size={13} />
          </button>
        )}

        {onSelect && (
          <span
            className={cn(
              'transition-all duration-150',
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1',
              'text-[var(--primary)]',
            )}
            aria-hidden="true"
          >
            <ArrowUpRight size={14} />
          </span>
        )}
      </div>
    </div>
  )
}
