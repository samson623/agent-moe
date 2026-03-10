'use client'

import Link from 'next/link'
import { Check, X, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RiskBadge } from './RiskBadge'
import { cn } from '@/lib/utils'
import type { Approval, ApprovalStatus } from '@/lib/supabase/types'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface ApprovalCardProps {
  approval: Approval
  isSelected: boolean
  onSelect: (id: string) => void
  onDecide: (id: string, decision: 'approved' | 'rejected' | 'revision_requested', notes?: string) => void
  href: string
}

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  revision_requested: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision',
}

export function ApprovalCard({ approval, isSelected, onSelect, onDecide, href }: ApprovalCardProps) {
  const isPending = approval.status === 'pending'

  return (
    <div
      className={cn(
        'relative rounded-[var(--radius)] border transition-all duration-150',
        'bg-[var(--surface-elevated)]',
        isSelected
          ? 'border-[var(--primary)] shadow-[0_0_0_1px_var(--primary-muted)]'
          : 'border-[var(--border)] hover:border-[var(--border-subtle)]',
      )}
    >
      {/* Checkbox */}
      {isPending && (
        <button
          type="button"
          onClick={() => { onSelect(approval.id) }}
          className="absolute top-3 left-3 z-10 w-4 h-4 rounded border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center hover:border-[var(--primary)] transition-colors"
          aria-label="Select for batch action"
        >
          {isSelected && (
            <div className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)]" />
          )}
        </button>
      )}

      {/* Clickable content area */}
      <Link href={href} className="block p-4 pl-10">
        {/* Top row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <RiskBadge risk_level={approval.risk_level} />
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-[var(--border)] text-[var(--text-muted)]">
            asset
          </Badge>
          <Badge
            variant="outline"
            className={cn('text-[10px] border', STATUS_STYLES[approval.status])}
          >
            {STATUS_LABELS[approval.status]}
          </Badge>
          <span className="ml-auto text-[11px] text-[var(--text-disabled)]">
            {relativeTime(approval.created_at)}
          </span>
        </div>

        {/* Asset ID */}
        <div className="text-xs text-[var(--text-secondary)] mb-2 font-mono">
          Asset: {approval.asset_id?.slice(0, 16) ?? 'N/A'}…
        </div>

        {/* Risk flags */}
        {approval.risk_flags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {approval.risk_flags.map((flag) => (
              <span
                key={flag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20"
              >
                {flag}
              </span>
            ))}
          </div>
        )}

        {/* Reviewer notes (if decided) */}
        {!isPending && approval.notes && (
          <p className="text-xs text-[var(--text-muted)] italic mb-2 line-clamp-2">
            &ldquo;{approval.notes}&rdquo;
          </p>
        )}
      </Link>

      {/* Action buttons — only for pending */}
      {isPending && (
        <div className="flex gap-2 px-4 pb-3 pt-0">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-8 text-xs text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
            onClick={() => { onDecide(approval.id, 'approved') }}
          >
            <Check size={12} className="mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-8 text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
            onClick={() => { onDecide(approval.id, 'rejected') }}
          >
            <X size={12} className="mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-8 text-xs text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50"
            onClick={() => { onDecide(approval.id, 'revision_requested') }}
          >
            <RotateCcw size={12} className="mr-1" />
            Revision
          </Button>
        </div>
      )}
    </div>
  )
}
