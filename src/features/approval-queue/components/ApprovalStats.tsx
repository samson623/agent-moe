'use client'

import { Clock, CheckCircle, XCircle, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ApprovalStats as Stats } from '@/features/approval-queue/hooks'

interface ApprovalStatsProps {
  stats: Stats
  isLoading: boolean
}

interface StatCardProps {
  icon: React.ElementType
  value: number
  label: string
  colorClass: string
  glowColor: string
  isLoading: boolean
}

function StatCard({ icon: Icon, value, label, colorClass, glowColor, isLoading }: StatCardProps) {
  return (
    <div className={cn(
      'relative flex items-center gap-4 px-5 py-4 rounded-[var(--radius)]',
      'bg-[var(--surface-elevated)] border border-[var(--border)]',
      'overflow-hidden',
    )}>
      {/* Glow orb */}
      <div
        className="absolute -top-4 -left-4 w-16 h-16 rounded-full opacity-20 blur-xl"
        style={{ backgroundColor: glowColor }}
        aria-hidden="true"
      />
      <div className={cn('p-2 rounded-lg', colorClass, 'bg-opacity-10')}>
        <Icon size={16} className={colorClass} />
      </div>
      <div>
        {isLoading ? (
          <div className="h-7 w-10 bg-[var(--surface-hover)] rounded animate-pulse mb-1" />
        ) : (
          <div className={cn('text-2xl font-bold leading-none', colorClass)}>{value}</div>
        )}
        <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
      </div>
    </div>
  )
}

export function ApprovalStats({ stats, isLoading }: ApprovalStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={Clock}
        value={stats.pending}
        label="Pending Review"
        colorClass="text-amber-400"
        glowColor="#f59e0b"
        isLoading={isLoading}
      />
      <StatCard
        icon={CheckCircle}
        value={stats.approved_today}
        label="Approved Today"
        colorClass="text-emerald-400"
        glowColor="#10b981"
        isLoading={isLoading}
      />
      <StatCard
        icon={XCircle}
        value={stats.rejected_today}
        label="Rejected Today"
        colorClass="text-red-400"
        glowColor="#ef4444"
        isLoading={isLoading}
      />
      <StatCard
        icon={BarChart2}
        value={stats.total_reviewed}
        label="Total Reviewed"
        colorClass="text-blue-400"
        glowColor="#3b82f6"
        isLoading={isLoading}
      />
    </div>
  )
}
