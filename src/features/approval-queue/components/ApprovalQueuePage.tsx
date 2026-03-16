'use client'

import { useCallback } from 'react'
import { CheckCircle } from 'lucide-react'
import { ApprovalStats } from './ApprovalStats'
import { ApprovalFiltersBar } from './ApprovalFilters'
import { ApprovalCard } from './ApprovalCard'
import { BatchApprovalBar } from './BatchApprovalBar'
import {
  useApprovals,
  useApprovalActions,
  useBulkApprovals,
  useRealtimeApprovals,
} from '@/features/approval-queue/hooks'
import { PageWrapper, SectionHeader, EmptyState, GlassCard } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem, MotionFadeIn } from '@/components/nebula/motion'
import { cn } from '@/lib/utils'
import type { Approval } from '@/lib/supabase/types'

interface ApprovalQueuePageProps {
  workspaceId: string
}

function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-4 w-16 bg-[var(--surface-hover)] rounded-full" />
        <div className="h-4 w-12 bg-[var(--surface-hover)] rounded-full" />
        <div className="h-4 w-14 bg-[var(--surface-hover)] rounded-full ml-auto" />
      </div>
      <div className="h-3 w-40 bg-[var(--surface-hover)] rounded" />
      <div className="flex gap-2">
        <div className="h-7 flex-1 bg-[var(--surface-hover)] rounded" />
        <div className="h-7 flex-1 bg-[var(--surface-hover)] rounded" />
        <div className="h-7 flex-1 bg-[var(--surface-hover)] rounded" />
      </div>
    </div>
  )
}

export default function ApprovalQueuePage({ workspaceId }: ApprovalQueuePageProps) {
  const { approvals, stats, isLoading, error, filters, setFilter, refresh } =
    useApprovals(workspaceId)
  const { decide, isDeciding } = useApprovalActions()
  const { selected, toggle, clearSelection, batchDecide, isBatchPending } = useBulkApprovals()

  useRealtimeApprovals({ workspaceId, onUpdate: refresh })

  const handleDecide = useCallback(
    async (id: string, decision: 'approved' | 'rejected' | 'revision_requested') => {
      await decide(id, decision)
      refresh()
    },
    [decide, refresh],
  )

  const handleBatchApprove = useCallback(async () => {
    await batchDecide('approved')
    refresh()
  }, [batchDecide, refresh])

  const handleBatchReject = useCallback(async () => {
    await batchDecide('rejected')
    refresh()
  }, [batchDecide, refresh])

  // Count active (non-default) filters
  const activeFilterCount = [
    filters.status && filters.status !== 'all',
    filters.risk_level && filters.risk_level !== 'all',
  ].filter(Boolean).length

  // Group approvals by job_id presence (with job / without job)
  const withMission = approvals.filter((a) => a.job_id)
  const withoutMission = approvals.filter((a) => !a.job_id)

  // Pending-only IDs for selectAll
  const pendingIds = approvals.filter((a) => a.status === 'pending').map((a) => a.id)

  const renderCard = (approval: Approval) => (
    <MotionStaggerItem key={approval.id}>
      <ApprovalCard
        approval={approval}
        isSelected={selected.has(approval.id)}
        onSelect={toggle}
        onDecide={handleDecide}
        href={`/approvals/${approval.id}`}
      />
    </MotionStaggerItem>
  )

  return (
    <PageWrapper className="space-y-6 pb-20">
      {/* Header */}
      <MotionFadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Approval Queue</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Review and control what ships</p>
        </div>
      </MotionFadeIn>

      {/* Stats */}
      <MotionFadeIn delay={0.05}>
        <ApprovalStats stats={stats} isLoading={isLoading} />
      </MotionFadeIn>

      {/* Filters */}
      <MotionFadeIn delay={0.1}>
        <ApprovalFiltersBar
          filters={filters}
          onStatusChange={(s) => { setFilter({ ...filters, status: s as never }) }}
          onRiskChange={(r) => { setFilter({ ...filters, risk_level: r as never }) }}
          activeCount={activeFilterCount}
          onClear={() => { setFilter({}) }}
        />
      </MotionFadeIn>

      {/* Error */}
      {error && (
        <MotionFadeIn>
          <GlassCard className="bg-red-500/10 border-red-500/30" padding="sm" hover={false}>
            <span className="text-sm text-red-400">{error}</span>
          </GlassCard>
        </MotionFadeIn>
      )}

      {/* Select all pending banner */}
      {pendingIds.length > 0 && selected.size === 0 && !isLoading && (
        <MotionFadeIn>
          <GlassCard padding="sm" hover={false}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                {pendingIds.length} pending item{pendingIds.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => { pendingIds.forEach(toggle) }}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Select all pending
              </button>
            </div>
          </GlassCard>
        </MotionFadeIn>
      )}

      {/* Content grid */}
      {isLoading ? (
        <div
          className={cn(
            'grid gap-4',
            'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
          )}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : approvals.length === 0 ? (
        <MotionFadeIn>
          <EmptyState
            icon={CheckCircle}
            title="All clear"
            description="All items have been reviewed. Nothing in the queue."
          />
        </MotionFadeIn>
      ) : (
        <MotionStagger
          className={cn(
            'grid gap-4',
            'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
          )}
        >
          {withMission.length > 0 && (
            <>
              <MotionStaggerItem className="col-span-full">
                <SectionHeader
                  title="Mission Assets"
                  description={`${withMission.length} item${withMission.length !== 1 ? 's' : ''}`}
                />
              </MotionStaggerItem>
              {withMission.map(renderCard)}
            </>
          )}
          {withoutMission.length > 0 && (
            <>
              <MotionStaggerItem className="col-span-full">
                <SectionHeader
                  title="Standalone Assets"
                  description={`${withoutMission.length} item${withoutMission.length !== 1 ? 's' : ''}`}
                />
              </MotionStaggerItem>
              {withoutMission.map(renderCard)}
            </>
          )}
        </MotionStagger>
      )}

      {/* Batch bar */}
      <BatchApprovalBar
        selectedCount={selected.size}
        onApproveAll={handleBatchApprove}
        onRejectAll={handleBatchReject}
        onClear={clearSelection}
        isPending={isBatchPending || isDeciding}
      />
    </PageWrapper>
  )
}
