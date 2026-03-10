'use client'

import { useCallback } from 'react'
import { ShieldCheck } from 'lucide-react'
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

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
        <ShieldCheck size={32} className="text-emerald-400" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text)] mb-1">Queue is clear</h3>
      <p className="text-sm text-[var(--text-muted)]">All items have been reviewed</p>
    </div>
  )
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="col-span-full flex items-center gap-3 pb-1">
      <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
        {label}
      </h2>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)]">
        {count}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
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
    <ApprovalCard
      key={approval.id}
      approval={approval}
      isSelected={selected.has(approval.id)}
      onSelect={toggle}
      onDecide={handleDecide}
      href={`/approvals/${approval.id}`}
    />
  )

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Approval Queue</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Review and control what ships</p>
      </div>

      {/* Stats */}
      <ApprovalStats stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <ApprovalFiltersBar
        filters={filters}
        onStatusChange={(s) => { setFilter({ ...filters, status: s as never }) }}
        onRiskChange={(r) => { setFilter({ ...filters, risk_level: r as never }) }}
        activeCount={activeFilterCount}
        onClear={() => { setFilter({}) }}
      />

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Select all pending banner */}
      {pendingIds.length > 0 && selected.size === 0 && !isLoading && (
        <div className="flex items-center justify-between px-4 py-2 rounded-[var(--radius)] bg-[var(--surface-elevated)] border border-[var(--border)]">
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
      )}

      {/* Content grid */}
      <div
        className={cn(
          'grid gap-4',
          'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
        )}
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : approvals.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {withMission.length > 0 && (
              <>
                <SectionHeader label="Mission Assets" count={withMission.length} />
                {withMission.map(renderCard)}
              </>
            )}
            {withoutMission.length > 0 && (
              <>
                <SectionHeader label="Standalone Assets" count={withoutMission.length} />
                {withoutMission.map(renderCard)}
              </>
            )}
          </>
        )}
      </div>

      {/* Batch bar */}
      <BatchApprovalBar
        selectedCount={selected.size}
        onApproveAll={handleBatchApprove}
        onRejectAll={handleBatchReject}
        onClear={clearSelection}
        isPending={isBatchPending || isDeciding}
      />
    </div>
  )
}
