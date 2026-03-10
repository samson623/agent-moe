'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from './RiskBadge'
import { ContentPreview } from './ContentPreview'
import { RevisionModal } from './RevisionModal'
import { useApprovalActions } from '@/features/approval-queue/hooks'
import { cn } from '@/lib/utils'
import type { Approval, ApprovalStatus } from '@/lib/supabase/types'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
import { useRouter } from 'next/navigation'

interface ApprovalDetailPageProps {
  approval: Approval
}

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision Requested',
}

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  revision_requested: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export function ApprovalDetailPage({ approval }: ApprovalDetailPageProps) {
  const router = useRouter()
  const { decide, isDeciding } = useApprovalActions()
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [localStatus, setLocalStatus] = useState<ApprovalStatus>(approval.status)

  const isPending = localStatus === 'pending'

  const handleDecide = async (decision: 'approved' | 'rejected' | 'revision_requested', notes?: string) => {
    const ok = await decide(approval.id, decision, notes)
    if (ok) {
      setLocalStatus(decision)
      setRevisionOpen(false)
      // Navigate back to queue after short delay
      setTimeout(() => { router.push('/approvals') }, 1200)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/approvals"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        <ArrowLeft size={14} />
        Approval Queue
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-[var(--border)] text-[var(--text-muted)]">
          asset
        </Badge>
        <RiskBadge risk_level={approval.risk_level} />
        <Badge
          variant="outline"
          className={cn('text-[10px] border', STATUS_STYLE[localStatus])}
        >
          {STATUS_LABEL[localStatus]}
        </Badge>
      </div>

      {/* Risk flags */}
      {approval.risk_flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {approval.risk_flags.map((flag) => (
            <span
              key={flag}
              className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
            >
              {flag}
            </span>
          ))}
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: content preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className={cn(
            'p-5 rounded-[var(--radius)] bg-[var(--surface-elevated)] border border-[var(--border)]',
          )}>
            <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Content Preview</h2>
            <ContentPreview assetId={approval.asset_id ?? ''} missionId={null} />
          </div>
        </div>

        {/* Right: decision + metadata */}
        <div className="space-y-4">
          {/* Decision card */}
          <div className={cn(
            'p-5 rounded-[var(--radius)] bg-[var(--surface-elevated)] border border-[var(--border)]',
          )}>
            <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Decision</h2>

            {isPending ? (
              <div className="space-y-2">
                <Button
                  size="sm"
                  className="w-full justify-start bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                  onClick={() => { void handleDecide('approved') }}
                  disabled={isDeciding}
                >
                  <CheckCircle size={14} className="mr-2" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  className="w-full justify-start bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                  onClick={() => { void handleDecide('rejected') }}
                  disabled={isDeciding}
                >
                  <XCircle size={14} className="mr-2" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="w-full justify-start bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                  onClick={() => { setRevisionOpen(true) }}
                  disabled={isDeciding}
                >
                  <RotateCcw size={14} className="mr-2" />
                  Send for Revision
                </Button>
              </div>
            ) : (
              <div className={cn(
                'px-3 py-2.5 rounded-[var(--radius)] border text-sm font-medium',
                STATUS_STYLE[localStatus],
              )}>
                Decision made: {STATUS_LABEL[localStatus]}
              </div>
            )}

            {/* Existing reviewer notes */}
            {approval.notes && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Reviewer notes</p>
                <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{approval.notes}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Brand Guardian policy reminder */}
          <div className={cn(
            'p-4 rounded-[var(--radius)] bg-[var(--surface-elevated)] border border-[var(--border)]',
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={13} className="text-[var(--text-muted)]" />
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Brand Guardian</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              This item was flagged for review based on configured safety thresholds. Review the content carefully before approving.
            </p>
          </div>

          {/* Metadata */}
          <div className={cn(
            'p-4 rounded-[var(--radius)] bg-[var(--surface-elevated)] border border-[var(--border)]',
          )}>
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Metadata</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--text-muted)]">Created</dt>
                <dd className="text-[var(--text-secondary)] font-mono">
                  {formatDate(approval.created_at)}
                </dd>
              </div>
              {approval.reviewed_at && (
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Decided</dt>
                  <dd className="text-[var(--text-secondary)] font-mono">
                    {formatDate(approval.reviewed_at)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--text-muted)]">Asset ID</dt>
                <dd className="text-[var(--text-secondary)] font-mono truncate max-w-24" title={approval.asset_id ?? ''}>
                  {approval.asset_id?.slice(0, 8) ?? 'N/A'}…
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--text-muted)]">Auto-flagged</dt>
                <dd className={approval.auto_approved ? 'text-amber-400' : 'text-[var(--text-secondary)]'}>
                  {approval.auto_approved ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Revision modal */}
      <RevisionModal
        isOpen={revisionOpen}
        onClose={() => { setRevisionOpen(false) }}
        onConfirm={(notes) => { void handleDecide('revision_requested', notes) }}
        isPending={isDeciding}
      />
    </div>
  )
}
