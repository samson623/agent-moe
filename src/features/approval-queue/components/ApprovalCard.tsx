'use client'

import Link from 'next/link'
import { Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, StatusBadge } from '@/components/nebula'
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

function extractVideoUrl(notes: string | null): string | null {
  if (!notes || !notes.includes('Video Factory render')) return null
  const match = notes.match(/URL:\s*(\S+)/)
  return match?.[1] ?? null
}

interface ApprovalCardProps {
  approval: Approval
  isSelected: boolean
  onSelect: (id: string) => void
  onDecide: (id: string, decision: 'approved' | 'rejected' | 'revision_requested', notes?: string) => void
  href: string
}

const STATUS_VARIANT: Record<ApprovalStatus, 'warning' | 'success' | 'danger' | 'primary'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  revision_requested: 'primary',
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
    <GlassCard
      padding="none"
      className={cn(
        isSelected
          ? 'border-[var(--primary)] shadow-[0_0_0_1px_var(--primary-muted)]'
          : '',
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
          <StatusBadge label="asset" variant="default" size="sm" />
          <StatusBadge
            label={STATUS_LABELS[approval.status]}
            variant={STATUS_VARIANT[approval.status]}
            pulse={approval.status === 'pending'}
            size="sm"
          />
          <span className="ml-auto text-xs md:text-sm text-[var(--text-disabled)]">
            {relativeTime(approval.created_at)}
          </span>
        </div>

        {/* Asset ID */}
        <div className="text-xs text-[var(--text-secondary)] mb-2 font-mono">
          Asset: {approval.asset_id?.slice(0, 16) ?? 'N/A'}…
        </div>

        {/* Video preview for Video Factory approvals */}
        {(() => {
          const videoUrl = extractVideoUrl(approval.notes)
          if (!videoUrl) return null
          return (
            <div className="mb-3" onClick={(e) => e.preventDefault()}>
              <video
                src={videoUrl}
                controls
                preload="metadata"
                className="w-full rounded-[var(--radius)] bg-black aspect-[9/16] max-h-48 object-contain"
              />
            </div>
          )
        })()}

        {/* Risk flags */}
        {approval.risk_flags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {approval.risk_flags.map((flag) => (
              <StatusBadge
                key={flag}
                label={flag}
                variant="danger"
                size="sm"
              />
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
    </GlassCard>
  )
}
