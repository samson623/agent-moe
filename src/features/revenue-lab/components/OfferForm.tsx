'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OfferRow, OfferType, OfferStatus } from '@/lib/supabase/types'

export interface CreateOfferData {
  name: string
  description: string
  offer_type: OfferType
  price_cents: number | null
  currency: string
  cta_text: string
  cta_url: string
  status: OfferStatus
  meta: Record<string, unknown>
}

interface OfferFormProps {
  offer?: OfferRow | null
  workspaceId: string
  onSubmit: (data: CreateOfferData) => Promise<void>
  onClose: () => void
  isSubmitting?: boolean
}

const OFFER_TYPES: { value: OfferType; label: string }[] = [
  { value: 'lead_magnet', label: 'Lead Magnet' },
  { value: 'product', label: 'Product' },
  { value: 'course', label: 'Course' },
  { value: 'service', label: 'Service' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'affiliate', label: 'Affiliate' },
]

const OFFER_STATUSES: { value: OfferStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]'
const LABEL_CLASS = 'block text-xs font-medium text-[var(--text-muted)] mb-1'

export function OfferForm({ offer, onSubmit, onClose, isSubmitting }: OfferFormProps) {
  const isEditing = Boolean(offer)

  const [name, setName] = useState(offer?.name ?? '')
  const [description, setDescription] = useState(offer?.description ?? '')
  const [offerType, setOfferType] = useState<OfferType>(offer?.offer_type ?? 'product')
  // store price as display dollars string
  const [priceDollars, setPriceDollars] = useState<string>(
    offer?.price_cents ? String(offer.price_cents / 100) : '',
  )
  const [currency, setCurrency] = useState(offer?.currency ?? 'USD')
  const [ctaText, setCtaText] = useState(offer?.cta_text ?? '')
  const [ctaUrl, setCtaUrl] = useState(offer?.cta_url ?? '')
  const [status, setStatus] = useState<OfferStatus>(offer?.status ?? 'active')

  // Sync if offer prop changes (e.g., parent swaps from create→edit)
  useEffect(() => {
    if (offer) {
      setName(offer.name)
      setDescription(offer.description ?? '')
      setOfferType(offer.offer_type)
      setPriceDollars(offer.price_cents ? String(offer.price_cents / 100) : '')
      setCurrency(offer.currency)
      setCtaText(offer.cta_text ?? '')
      setCtaUrl(offer.cta_url ?? '')
      setStatus(offer.status)
    }
  }, [offer])

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dollars = parseFloat(priceDollars)
    const price_cents = isNaN(dollars) || dollars === 0 ? null : Math.round(dollars * 100)

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      offer_type: offerType,
      price_cents,
      currency: currency.trim().toUpperCase() || 'USD',
      cta_text: ctaText.trim(),
      cta_url: ctaUrl.trim(),
      status,
      meta: {},
    })
  }

  const submitLabel = isSubmitting
    ? isEditing ? 'Saving…' : 'Creating…'
    : isEditing ? 'Save Changes' : 'Create Offer'

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-semibold text-[var(--text)]">
            {isEditing ? 'Edit Offer' : 'Create Offer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Name */}
            <div>
              <label htmlFor="offer-name" className={LABEL_CLASS}>
                Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="offer-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Free Training, Starter Course"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="offer-description" className={LABEL_CLASS}>
                Description
              </label>
              <textarea
                id="offer-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(INPUT_CLASS, 'resize-none')}
                placeholder="What does this offer include?"
              />
            </div>

            {/* Offer Type */}
            <div>
              <label htmlFor="offer-type" className={LABEL_CLASS}>
                Offer Type
              </label>
              <select
                id="offer-type"
                value={offerType}
                onChange={(e) => setOfferType(e.target.value as OfferType)}
                className={INPUT_CLASS}
              >
                {OFFER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price + Currency row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="offer-price" className={LABEL_CLASS}>
                  Price (USD)
                </label>
                <input
                  id="offer-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="0 = Free"
                />
              </div>
              <div>
                <label htmlFor="offer-currency" className={LABEL_CLASS}>
                  Currency
                </label>
                <input
                  id="offer-currency"
                  type="text"
                  maxLength={3}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="USD"
                />
              </div>
            </div>

            {/* CTA Text */}
            <div>
              <label htmlFor="offer-cta-text" className={LABEL_CLASS}>
                CTA Text
              </label>
              <input
                id="offer-cta-text"
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Get Instant Access"
              />
            </div>

            {/* CTA URL */}
            <div>
              <label htmlFor="offer-cta-url" className={LABEL_CLASS}>
                CTA URL
              </label>
              <input
                id="offer-cta-url"
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                className={INPUT_CLASS}
                placeholder="https://..."
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="offer-status" className={LABEL_CLASS}>
                Status
              </label>
              <select
                id="offer-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OfferStatus)}
                className={INPUT_CLASS}
              >
                {OFFER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
              )}
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
