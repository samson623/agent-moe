'use client'

import { useEffect, useState } from 'react'
import { Check, X, RotateCcw } from 'lucide-react'
import { GlassCard } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import { RiskBadge } from './RiskBadge'
import { cn } from '@/lib/utils'
import type { Approval } from '@/lib/supabase/types'

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

interface ApprovalHistoryProps {
  workspaceId: string
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 py-3 border-b border-[var(--border)] last:border-0 animate-pulse">
      <div className="w-6 h-6 rounded-full bg-[var(--surface-hover)] shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-3.5 w-14 bg-[var(--surface-hover)] rounded-full" />
          <div className="h-3.5 w-20 bg-[var(--surface-hover)] rounded" />
        </div>
        <div className="h-3 w-32 bg-[var(--surface-hover)] rounded" />
      </div>
    </div>
  )
}

const DECISION_ICON: Record<string, React.ElementType> = {
  approved: Check,
  rejected: X,
  revision_requested: RotateCcw,
}

const DECISION_COLOR: Record<string, string> = {
  approved: 'text-emerald-400 bg-emerald-500/10',
  rejected: 'text-red-400 bg-red-500/10',
  revision_requested: 'text-purple-400 bg-purple-500/10',
}

export function ApprovalHistory({ workspaceId }: ApprovalHistoryProps) {
  const [history, setHistory] = useState<Approval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)

    const params = new URLSearchParams({
      workspace_id: workspaceId,
      limit: '50',
    })
    fetch(`/api/approvals?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load history (${res.status})`)
        const json = await res.json() as { approvals: Approval[] }
        setHistory((json.approvals ?? []).filter((a) => a.status !== 'pending'))
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load history')
      })
      .finally(() => { setIsLoading(false) })

    return () => { controller.abort() }
  }, [workspaceId])

  if (error) {
    return (
      <GlassCard className="bg-red-500/10 border-red-500/30" hover={false}>
        <span className="text-sm text-red-400">{error}</span>
      </GlassCard>
    )
  }

  if (!isLoading && history.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[var(--text-muted)]">
        No review history yet
      </div>
    )
  }

  return (
    <GlassCard padding="sm" hover={false}>
      <div className="divide-y divide-[var(--border)]">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          <MotionStagger>
            {history.map((approval) => {
              const Icon = DECISION_ICON[approval.status] ?? Check
              const colorClass = DECISION_COLOR[approval.status] ?? 'text-[var(--text-muted)] bg-[var(--skeleton)]'

              return (
                <MotionStaggerItem key={approval.id}>
                  <div className="flex gap-3 py-3">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5', colorClass)}>
                      <Icon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <RiskBadge risk_level={approval.risk_level} />
                        <span className="text-xs font-mono text-[var(--text-secondary)] truncate">
                          {approval.asset_id?.slice(0, 12) ?? 'N/A'}…
                        </span>
                        {approval.reviewed_at && (
                          <span className="ml-auto text-xs md:text-sm text-[var(--text-disabled)] shrink-0">
                            {relativeTime(approval.reviewed_at)}
                          </span>
                        )}
                      </div>
                      {approval.notes && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1 italic">
                          &ldquo;{approval.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </MotionStaggerItem>
              )
            })}
          </MotionStagger>
        )}
      </div>
    </GlassCard>
  )
}
