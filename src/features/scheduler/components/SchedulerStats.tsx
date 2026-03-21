'use client'

import { Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import type { ScheduledMissionStats } from '../types'

interface SchedulerStatsProps {
  stats: ScheduledMissionStats | null
  loading: boolean
}

export function SchedulerStats({ stats, loading }: SchedulerStatsProps) {
  return (
    <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MotionStaggerItem>
        <StatCard
          label="Total Missions"
          value={stats?.total ?? 0}
          icon={Clock}
          tone="primary"
          loading={loading}
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <StatCard
          label="Active"
          value={stats?.active ?? 0}
          icon={Activity}
          tone="success"
          loading={loading}
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <StatCard
          label="Runs Today"
          value={stats?.runs_today ?? 0}
          icon={CheckCircle}
          tone="accent"
          loading={loading}
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <StatCard
          label="Failures Today"
          value={stats?.failures_today ?? 0}
          icon={AlertTriangle}
          tone={stats?.failures_today ? 'danger' : 'default'}
          loading={loading}
        />
      </MotionStaggerItem>
    </MotionStagger>
  )
}
