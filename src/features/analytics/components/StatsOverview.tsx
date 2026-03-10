'use client'

import { BarChart2, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SystemStats } from '@/features/analytics/types'

interface StatsOverviewProps {
  stats: SystemStats | null
  isLoading: boolean
}

function getRateColor(rate: number): string {
  if (rate >= 80) return 'var(--success)'
  if (rate >= 60) return 'var(--warning)'
  return 'var(--danger)'
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  const approvalColor = getRateColor(stats?.approval_rate ?? 0)
  const publishColor = getRateColor(stats?.publish_success_rate ?? 0)

  const cards = [
    {
      label: 'Missions',
      value: stats
        ? `${stats.missions_completed} / ${stats.missions_total}`
        : '— / —',
      subtext: 'completed',
      Icon: BarChart2,
      color: 'var(--primary)',
    },
    {
      label: 'Assets Generated',
      value: stats?.assets_total ?? 0,
      subtext: `${stats?.assets_published ?? 0} published`,
      Icon: TrendingUp,
      color: 'var(--accent)',
    },
    {
      label: 'Approval Rate',
      value: stats ? `${stats.approval_rate}%` : '—%',
      subtext: 'of submitted assets',
      Icon: CheckCircle,
      color: approvalColor,
    },
    {
      label: 'Publish Success',
      value: stats ? `${stats.publish_success_rate}%` : '—%',
      subtext: 'of publish attempts',
      Icon: AlertTriangle,
      color: publishColor,
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map(({ label, value, subtext, Icon, color }) => (
        <div
          key={label}
          className={cn(
            'flex items-center gap-3 p-4 rounded-[var(--radius-lg)]',
            'border border-[var(--border)] bg-[var(--surface)]',
          )}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] shrink-0"
            style={{
              backgroundColor: `${color}18`,
              border: `1px solid ${color}30`,
            }}
            aria-hidden="true"
          >
            <Icon size={16} style={{ color }} />
          </div>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="animate-pulse space-y-1.5">
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded" />
                <div className="h-3 w-24 bg-[var(--surface-elevated)] rounded" />
              </div>
            ) : (
              <>
                <p
                  className="text-xl font-bold leading-none tabular-nums"
                  style={{ color }}
                >
                  {value}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                  {label} · {subtext}
                </p>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
