'use client'

import { CheckCircle2, XCircle, Archive, Copy, Send, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BulkActionBarProps {
  selectionCount: number
  onAction: (action: 'approve' | 'reject' | 'archive' | 'duplicate' | 'publish') => void
  onClear: () => void
  loading: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkActionBar({ selectionCount, onAction, onClear, loading }: BulkActionBarProps) {
  if (selectionCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={cn(
          'flex items-center gap-3 px-5 py-3 rounded-[var(--radius-xl)]',
          'bg-[rgba(15,15,26,0.92)] backdrop-blur-xl',
          'border border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        )}
      >
        {/* Selection count */}
        <span className="text-sm font-medium text-[var(--text)] tabular-nums whitespace-nowrap">
          {selectionCount} selected
        </span>

        <div className="w-px h-6 bg-[var(--border)]" />

        {/* Action buttons */}
        {loading ? (
          <div className="flex items-center gap-2 px-4">
            <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
            <span className="text-xs text-[var(--text-muted)]">Processing…</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button
              variant="success"
              size="xs"
              onClick={() => onAction('approve')}
              className="gap-1"
            >
              <CheckCircle2 size={13} />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={() => onAction('reject')}
              className="gap-1"
            >
              <XCircle size={13} />
              Reject
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onAction('archive')}
              className="gap-1 text-[var(--text-muted)]"
            >
              <Archive size={13} />
              Archive
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onAction('duplicate')}
              className="gap-1"
            >
              <Copy size={13} />
              Duplicate
            </Button>
            <Button
              variant="accent"
              size="xs"
              onClick={() => onAction('publish')}
              className="gap-1"
            >
              <Send size={13} />
              Publish
            </Button>
          </div>
        )}

        <div className="w-px h-6 bg-[var(--border)]" />

        {/* Clear button */}
        <button
          onClick={onClear}
          className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-[var(--surface-hover)] transition-colors"
          aria-label="Clear selection"
        >
          <X size={14} className="text-[var(--text-muted)]" />
        </button>
      </div>
    </div>
  )
}
