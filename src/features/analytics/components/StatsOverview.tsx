'use client'

import { BarChart2, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'
import type { SystemStats } from '@/features/analytics/types'
import { StatCard } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'

interface StatsOverviewProps {
  stats: SystemStats | null
  isLoading: boolean
}

type StatTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger'

function getRateTone(rate: number): StatTone {
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'warning'
  return 'danger'
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  const approvalTone = getRateTone(stats?.approval_rate ?? 0)
  const publishTone = getRateTone(stats?.publish_success_rate ?? 0)

  const cards: {
    label: string
    value: string | number
    subtitle: string
    icon: typeof BarChart2
    tone: StatTone
  }[] = [
    {
      label: 'Missions',
      value: stats
        ? `${stats.missions_completed} / ${stats.missions_total}`
        : '-- / --',
      subtitle: 'completed',
      icon: BarChart2,
      tone: 'primary',
    },
    {
      label: 'Assets Generated',
      value: stats?.assets_total ?? 0,
      subtitle: `${stats?.assets_published ?? 0} published`,
      icon: TrendingUp,
      tone: 'accent',
    },
    {
      label: 'Approval Rate',
      value: stats ? `${stats.approval_rate}%` : '--%',
      subtitle: 'of submitted assets',
      icon: CheckCircle,
      tone: approvalTone,
    },
    {
      label: 'Publish Success',
      value: stats ? `${stats.publish_success_rate}%` : '--%',
      subtitle: 'of publish attempts',
      icon: AlertTriangle,
      tone: publishTone,
    },
  ]

  return (
    <MotionStagger className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((card) => (
        <MotionStaggerItem key={card.label}>
          <StatCard
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            subtitle={card.subtitle}
            subtitleTone="neutral"
            loading={isLoading}
          />
        </MotionStaggerItem>
      ))}
    </MotionStagger>
  )
}
