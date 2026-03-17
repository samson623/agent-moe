'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, StatusBadge } from '@/components/nebula'
import { MotionFadeIn } from '@/components/nebula/motion'
import { RiskBadge } from './RiskBadge'
import { ContentPreview } from './ContentPreview'
import { RevisionModal } from './RevisionModal'
import { useApprovalActions } from '@/features/approval-queue/hooks'
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

const STATUS_VARIANT: Record<ApprovalStatus, 'warning' | 'success' | 'danger' | 'primary'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  revision_requested: 'primary',
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
      <MotionFadeIn>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge label="asset" variant="default" size="md" />
          <RiskBadge risk_level={approval.risk_level} />
          <StatusBadge
            label={STATUS_LABEL[localStatus]}
            variant={STATUS_VARIANT[localStatus]}
            pulse={localStatus === 'pending'}
            size="md"
          />
        </div>
      </MotionFadeIn>

      {/* Risk flags */}
      {approval.risk_flags.length > 0 && (
        <MotionFadeIn delay={0.05}>
          <div className="flex flex-wrap gap-1.5">
            {approval.risk_flags.map((flag) => (
              <StatusBadge
                key={flag}
                label={flag}
                variant="danger"
                size="sm"
              />
            ))}
          </div>
        </MotionFadeIn>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: content preview */}
        <div className="lg:col-span-2 space-y-4">
          <MotionFadeIn delay={0.1}>
            <GlassCard>
              <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Content Preview</h2>
              <ContentPreview assetId={approval.asset_id ?? ''} missionId={null} />
            </GlassCard>
          </MotionFadeIn>
        </div>

        {/* Right: decision + metadata */}
        <div className="space-y-4">
          {/* Decision card */}
          <MotionFadeIn delay={0.15}>
            <GlassCard>
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
                <StatusBadge
                  label={`Decision made: ${STATUS_LABEL[localStatus]}`}
                  variant={STATUS_VARIANT[localStatus]}
                  size="md"
                  className="w-full justify-center py-2"
                />
              )}

              {/* Existing reviewer notes */}
              {approval.notes && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Reviewer notes</p>
                  <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{approval.notes}&rdquo;</p>
                </div>
              )}
            </GlassCard>
          </MotionFadeIn>

          {/* Brand Guardian policy reminder */}
          <MotionFadeIn delay={0.2}>
            <GlassCard>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={13} className="text-[var(--text-muted)]" />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Brand Guardian</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                This item was flagged for review based on configured safety thresholds. Review the content carefully before approving.
              </p>
            </GlassCard>
          </MotionFadeIn>

          {/* Metadata */}
          <MotionFadeIn delay={0.25}>
            <GlassCard>
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
            </GlassCard>
          </MotionFadeIn>
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
