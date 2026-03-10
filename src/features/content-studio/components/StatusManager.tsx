'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AssetStatus } from '@/lib/supabase/types'

interface StatusManagerProps {
  currentStatus: AssetStatus
  onStatusChange: (status: AssetStatus) => Promise<void>
  loading: boolean
}

const STATUS_CONFIG: Record<
  AssetStatus,
  { label: string; variant: 'muted' | 'warning' | 'success' | 'default' | 'danger'; color: string }
> = {
  draft: { label: 'Draft', variant: 'muted', color: 'var(--text-muted)' },
  review: { label: 'In Review', variant: 'warning', color: 'var(--warning)' },
  approved: { label: 'Approved', variant: 'success', color: 'var(--success)' },
  published: { label: 'Published', variant: 'default', color: 'var(--primary)' },
  rejected: { label: 'Rejected', variant: 'danger', color: 'var(--danger)' },
  archived: { label: 'Archived', variant: 'muted', color: 'var(--text-disabled)' },
}

const WORKFLOW_STEPS: AssetStatus[] = ['draft', 'review', 'approved', 'published']

function getNextStatuses(current: AssetStatus): { status: AssetStatus; destructive: boolean }[] {
  const transitions: Record<AssetStatus, { status: AssetStatus; destructive: boolean }[]> = {
    draft: [
      { status: 'review', destructive: false },
      { status: 'archived', destructive: true },
    ],
    review: [
      { status: 'approved', destructive: false },
      { status: 'rejected', destructive: true },
      { status: 'archived', destructive: true },
    ],
    approved: [
      { status: 'published', destructive: false },
      { status: 'archived', destructive: true },
    ],
    published: [{ status: 'archived', destructive: true }],
    rejected: [
      { status: 'draft', destructive: false },
      { status: 'archived', destructive: true },
    ],
    archived: [{ status: 'draft', destructive: false }],
  }
  return transitions[current] ?? []
}

export function StatusManager({
  currentStatus,
  onStatusChange,
  loading,
}: StatusManagerProps) {
  const [confirming, setConfirming] = useState<string | null>(null)

  const config = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.draft
  const nextStatuses = getNextStatuses(currentStatus)

  async function handleStatusClick(next: AssetStatus, destructive: boolean) {
    if (destructive && confirming !== next) {
      setConfirming(next)
      return
    }
    setConfirming(null)
    await onStatusChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Status
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant={config.variant}
            className="text-sm px-3 py-1"
          >
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Workflow indicator */}
      <div className="flex items-center gap-1">
        {WORKFLOW_STEPS.map((step, i) => {
          const stepIdx = WORKFLOW_STEPS.indexOf(currentStatus)
          const thisIdx = i
          const isActive = step === currentStatus
          const isPast = stepIdx >= 0 && thisIdx < stepIdx

          return (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-colors duration-200',
                  isActive && 'bg-[var(--primary)]',
                  isPast && 'bg-[var(--success)]',
                  !isActive && !isPast && 'bg-[var(--border)]',
                )}
              />
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className="w-0.5" />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-between px-0.5">
        {WORKFLOW_STEPS.map((step) => (
          <span
            key={step}
            className={cn(
              'text-[10px]',
              step === currentStatus ? 'text-[var(--text)]' : 'text-[var(--text-disabled)]',
            )}
          >
            {STATUS_CONFIG[step].label}
          </span>
        ))}
      </div>

      {/* Actions */}
      {nextStatuses.length > 0 && (
        <div className="space-y-2 pt-1">
          {nextStatuses.map(({ status: next, destructive }) => {
            const nextConfig = STATUS_CONFIG[next]
            const isConfirming = confirming === next

            return (
              <div key={next}>
                <Button
                  variant={destructive ? 'destructive' : next === 'published' ? 'success' : 'outline'}
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => handleStatusClick(next, destructive)}
                  disabled={loading}
                >
                  {isConfirming
                    ? `Confirm ${nextConfig.label}?`
                    : `Move to ${nextConfig.label}`}
                </Button>
                {isConfirming && (
                  <button
                    className="w-full text-xs text-[var(--text-muted)] mt-1 hover:text-[var(--text)] transition-colors"
                    onClick={() => setConfirming(null)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
