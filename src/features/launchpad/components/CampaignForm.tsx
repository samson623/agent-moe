'use client'

import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCreateCampaign } from '@/features/launchpad/hooks'
import type { Campaign } from '@/features/launchpad/types'

interface CampaignFormProps {
  workspaceId: string
  onSuccess: (campaign: Campaign) => void
  onClose: () => void
}

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-shadow'
const LABEL_CLASS = 'block text-xs font-medium text-[var(--text-muted)] mb-1'

export function CampaignForm({ workspaceId, onSuccess, onClose }: CampaignFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [launchDate, setLaunchDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const { create, creating, error: createError } = useCreateCampaign()

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)

    // Client-side validation: end date must be >= launch date
    if (launchDate && endDate && endDate < launchDate) {
      setValidationError('End date must be on or after the launch date.')
      return
    }

    const created = await create({
      workspace_id: workspaceId,
      name: name.trim(),
      description: description.trim() || undefined,
      launch_date: launchDate || null,
      end_date: endDate || null,
    })

    if (created) {
      onSuccess(created)
    }
  }

  const displayError = validationError ?? createError

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-form-title"
    >
      <div
        className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2
            id="campaign-form-title"
            className="text-base font-semibold text-[var(--text)]"
          >
            New Campaign
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors"
            aria-label="Close form"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Error banner */}
            {displayError && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[var(--radius)] bg-[var(--danger-muted)] border border-[rgba(239,68,68,0.2)]">
                <AlertCircle size={14} className="shrink-0 text-[var(--danger)] mt-0.5" aria-hidden="true" />
                <p className="text-xs text-[var(--danger)] leading-relaxed">{displayError}</p>
              </div>
            )}

            {/* Campaign Name */}
            <div>
              <label htmlFor="campaign-name" className={LABEL_CLASS}>
                Campaign Name <span className="text-[var(--danger)]" aria-hidden="true">*</span>
              </label>
              <input
                id="campaign-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Q2 Content Blitz"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="campaign-description" className={LABEL_CLASS}>
                Description
              </label>
              <textarea
                id="campaign-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(INPUT_CLASS, 'resize-none')}
                placeholder="Describe the goal of this campaign…"
              />
            </div>

            {/* Date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="campaign-launch-date" className={LABEL_CLASS}>
                  Launch Date
                </label>
                <input
                  id="campaign-launch-date"
                  type="date"
                  value={launchDate}
                  onChange={(e) => {
                    setLaunchDate(e.target.value)
                    setValidationError(null)
                  }}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="campaign-end-date" className={LABEL_CLASS}>
                  End Date
                </label>
                <input
                  id="campaign-end-date"
                  type="date"
                  value={endDate}
                  min={launchDate || undefined}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setValidationError(null)
                  }}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-subtle)]">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !name.trim()}
              aria-label="Create campaign"
            >
              {creating && (
                <span
                  className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
              )}
              {creating ? 'Creating…' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
