'use client'

import { X, CheckCircle2, XCircle, AlertTriangle, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/features/launchpad/types'

interface LaunchModalProps {
  campaign: Campaign
  onConfirm: () => Promise<void>
  onClose: () => void
  launching: boolean
}

interface CheckItem {
  label: string
  passed: boolean
  critical: boolean
}

function CheckRow({ label, passed, critical }: CheckItem) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[var(--radius)]',
        passed
          ? 'bg-[var(--success-muted)] border border-[rgba(16,185,129,0.15)]'
          : critical
            ? 'bg-[var(--danger-muted)] border border-[rgba(239,68,68,0.15)]'
            : 'bg-[var(--warning-muted)] border border-[rgba(245,158,11,0.15)]',
      )}
    >
      {passed ? (
        <CheckCircle2 size={15} className="shrink-0 text-[var(--success)]" aria-hidden="true" />
      ) : (
        <XCircle
          size={15}
          className={cn('shrink-0', critical ? 'text-[var(--danger)]' : 'text-[var(--warning)]')}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          'text-sm',
          passed
            ? 'text-[var(--success)]'
            : critical
              ? 'text-[var(--danger)]'
              : 'text-[var(--warning)]',
        )}
      >
        {label}
      </span>
    </div>
  )
}

export function LaunchModal({ campaign, onConfirm, onClose, launching }: LaunchModalProps) {
  const checks: CheckItem[] = [
    {
      label: 'Campaign has a name',
      passed: Boolean(campaign.name.trim()),
      critical: true,
    },
    {
      label: `At least 1 asset staged (${campaign.asset_ids.length} staged)`,
      passed: campaign.asset_ids.length > 0,
      critical: true,
    },
    {
      label: 'Launch date is set',
      passed: Boolean(campaign.launch_date),
      critical: false,
    },
    {
      label: "Status is 'draft' or 'paused' (ready to launch)",
      passed: campaign.status === 'draft' || campaign.status === 'paused',
      critical: true,
    },
  ]

  const criticalsPassed = checks.filter((c) => c.critical).every((c) => c.passed)
  const hasWarnings = checks.some((c) => !c.critical && !c.passed)

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-modal-title"
    >
      <div
        className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-[var(--radius)]"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
              aria-hidden="true"
            >
              <Rocket size={13} className="text-[var(--accent)]" />
            </div>
            <h2
              id="launch-modal-title"
              className="text-base font-semibold text-[var(--text)]"
            >
              Launch Campaign
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors"
            aria-label="Close launch modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Campaign name */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Launching campaign</p>
            <p className="text-sm font-semibold text-[var(--text)]">{campaign.name}</p>
          </div>

          {/* Pre-launch checklist */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Pre-launch checklist
            </p>
            {checks.map((check) => (
              <CheckRow key={check.label} {...check} />
            ))}
          </div>

          {/* Warning banner if non-critical items are missing */}
          {hasWarnings && criticalsPassed && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[var(--radius)] bg-[var(--warning-muted)] border border-[rgba(245,158,11,0.2)]">
              <AlertTriangle size={14} className="shrink-0 text-[var(--warning)] mt-0.5" aria-hidden="true" />
              <p className="text-xs text-[var(--warning)] leading-relaxed">
                Some optional fields are missing. You can still launch, but consider completing
                the checklist for best results.
              </p>
            </div>
          )}

          {/* Blocking banner if critical checks fail */}
          {!criticalsPassed && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[var(--radius)] bg-[var(--danger-muted)] border border-[rgba(239,68,68,0.2)]">
              <XCircle size={14} className="shrink-0 text-[var(--danger)] mt-0.5" aria-hidden="true" />
              <p className="text-xs text-[var(--danger)] leading-relaxed">
                This campaign cannot be launched until all critical checks pass. Stage at least one
                asset to proceed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={launching}
            aria-label="Cancel launch"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={onConfirm}
            disabled={!criticalsPassed || launching}
            aria-label={`Confirm launch of ${campaign.name}`}
          >
            {launching && (
              <span
                className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                aria-hidden="true"
              />
            )}
            {launching ? 'Launching…' : 'Launch Campaign'}
          </Button>
        </div>
      </div>
    </div>
  )
}
