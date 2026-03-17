'use client'

import { Check, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/nebula'

interface BatchApprovalBarProps {
  selectedCount: number
  onApproveAll: () => void
  onRejectAll: () => void
  onClear: () => void
  isPending: boolean
}

export function BatchApprovalBar({
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClear,
  isPending,
}: BatchApprovalBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <GlassCard
        variant="elevated"
        hover={false}
        padding="none"
        className="shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>

          <div className="w-px h-5 bg-[var(--border)]" aria-hidden="true" />

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10"
            onClick={onApproveAll}
            disabled={isPending}
          >
            <Check size={12} className="mr-1.5" />
            Approve All
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10"
            onClick={onRejectAll}
            disabled={isPending}
          >
            <X size={12} className="mr-1.5" />
            Reject All
          </Button>

          <button
            type="button"
            onClick={onClear}
            className="text-[var(--text-disabled)] hover:text-[var(--text-muted)] transition-colors"
            aria-label="Clear selection"
          >
            <XCircle size={16} />
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
