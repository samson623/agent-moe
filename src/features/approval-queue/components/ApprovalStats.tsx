'use client'

import { Clock, CheckCircle, XCircle, BarChart2 } from 'lucide-react'
import { StatCard } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import type { ApprovalStats as Stats } from '@/features/approval-queue/hooks'

interface ApprovalStatsProps {
  stats: Stats
  isLoading: boolean
}

export function ApprovalStats({ stats, isLoading }: ApprovalStatsProps) {
  return (
    <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MotionStaggerItem>
        <StatCard
          icon={Clock}
          value={stats.pending}
          label="Pending Review"
          tone="warning"
          loading={isLoading}
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <StatCard
          icon={CheckCircle}
          value={stats.approved_today}
          label="Approved Today"
          tone="success"
          loading={isLoading}
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <StatCard
          icon={XCircle}
          value={stats.rejected_today}
          label="Rejected Today"
          tone="danger"
          loading={isLoading}
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <StatCard
          icon={BarChart2}
          value={stats.total_reviewed}
          label="Total Reviewed"
          tone="primary"
          loading={isLoading}
        />
      </MotionStaggerItem>
    </MotionStagger>
  )
}
