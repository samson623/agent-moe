'use client'

import { Layers } from 'lucide-react'
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

type TierLabel = 'Free' | 'Entry' | 'Mid' | 'Premium' | 'Elite'

function getTierLabel(priceCents: number | null): TierLabel {
  if (priceCents === null || priceCents === 0) return 'Free'
  if (priceCents < 5000) return 'Entry'
  if (priceCents < 50000) return 'Mid'
  if (priceCents < 200000) return 'Premium'
  return 'Elite'
}

const TIER_COLORS: Record<TierLabel, string> = {
  Free: '#10b981',
  Entry: '#3b82f6',
  Mid: '#7c3aed',
  Premium: '#f59e0b',
  Elite: '#ef4444',
}

interface PricingLadderProps {
  offers: OfferRow[]
  onOfferClick?: (offer: OfferRow) => void
}

export function PricingLadder({ offers, onOfferClick }: PricingLadderProps) {
  const sorted = [...offers].sort((a, b) => {
    const aPrice = a.price_cents ?? 0
    const bPrice = b.price_cents ?? 0
    return aPrice - bPrice
  })

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] mb-3"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          <Layers size={20} style={{ color: '#7c3aed' }} />
        </div>
        <p className="text-sm font-medium text-[var(--text)] mb-1">No offers in pricing ladder</p>
        <p className="text-xs text-[var(--text-muted)] max-w-xs">
          Add offers to build your value ladder. Free entry points drive prospects to premium tiers.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {sorted.map((offer, index) => {
        const tierLabel = getTierLabel(offer.price_cents)
        const tierColor = TIER_COLORS[tierLabel]
        const typeColor = OFFER_TYPE_COLOR[offer.offer_type] ?? '#6b7280'
        const typeLabel = OFFER_TYPE_LABEL[offer.offer_type] ?? offer.offer_type
        const isLast = index === sorted.length - 1

        return (
          <div key={offer.id} className="relative flex gap-0">
            {/* Left rail: colored border + connecting line */}
            <div className="flex flex-col items-center w-5 shrink-0">
              {/* Colored step dot */}
              <div
                className="w-3 h-3 rounded-full border-2 border-white shrink-0 mt-4 z-10"
                style={{ backgroundColor: typeColor, boxShadow: `0 0 0 2px ${typeColor}30` }}
                aria-hidden="true"
              />
              {/* Dashed connecting line to next step */}
              {!isLast && (
                <div
                  className="flex-1 w-px mt-1"
                  style={{
                    background: `repeating-linear-gradient(to bottom, ${typeColor}50 0px, ${typeColor}50 4px, transparent 4px, transparent 8px)`,
                    minHeight: '24px',
                  }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Step card */}
            <div
              className={cn(
                'flex-1 mb-3 ml-2 rounded-[var(--radius-lg)]',
                'border border-[var(--border)] bg-[var(--surface)]',
                'transition-all duration-150',
                onOfferClick && 'cursor-pointer hover:bg-[var(--surface-hover)] hover:border-[var(--border)]',
              )}
              style={{ borderLeft: `3px solid ${typeColor}` }}
              onClick={() => onOfferClick?.(offer)}
              role={onOfferClick ? 'button' : undefined}
              tabIndex={onOfferClick ? 0 : undefined}
              onKeyDown={onOfferClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onOfferClick(offer) } : undefined}
            >
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    {/* Tier badge */}
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: `${tierColor}18`,
                        color: tierColor,
                        border: `1px solid ${tierColor}30`,
                      }}
                    >
                      {tierLabel}
                    </span>
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{offer.name}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{typeLabel}</p>
                </div>

                {/* Right: price + CTA + status */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-sm font-bold text-[var(--text)] tabular-nums">
                    {formatPrice(offer.price_cents, offer.currency)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {offer.cta_text && (
                      <Badge variant="outline" className="text-[9px]">
                        {offer.cta_text}
                      </Badge>
                    )}
                    {/* Status dot */}
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          offer.status === 'active'
                            ? 'var(--success)'
                            : offer.status === 'inactive'
                            ? 'var(--warning)'
                            : 'var(--text-muted)',
                      }}
                      title={offer.status}
                      aria-label={`Status: ${offer.status}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
