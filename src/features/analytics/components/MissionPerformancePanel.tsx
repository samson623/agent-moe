'use client'

import { cn } from '@/lib/utils'
import type { MissionPerformance } from '@/features/analytics/types'
import { GlassCard, SectionHeader, StatusBadge } from '@/components/nebula'
import { MotionFadeIn } from '@/components/nebula/motion'

interface MissionPerformancePanelProps {
  data: MissionPerformance | null
  isLoading: boolean
}

function ProgressBar({
  value,
  color = 'var(--primary)',
  height = 'h-1.5',
}: {
  value: number
  color?: string
  height?: string
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <div className={cn('w-full rounded-full bg-[var(--border)]', height)}>
      <div
        className={cn('rounded-full transition-all duration-500', height)}
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

function formatTeamName(team: string): string {
  return team
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function MissionPerformancePanel({ data, isLoading }: MissionPerformancePanelProps) {
  return (
    <GlassCard hover={false}>
      <SectionHeader title="Mission Performance" />

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-1/3 bg-[var(--skeleton)] rounded" />
          <div className="h-2 w-full bg-[var(--skeleton)] rounded-full" />
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-28 bg-[var(--skeleton)] rounded" />
                <div className="flex-1 h-1.5 bg-[var(--skeleton)] rounded-full" />
                <div className="h-3 w-8 bg-[var(--skeleton)] rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <MotionFadeIn>
          {/* Completion rate hero */}
          <div className="space-y-2">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--text)] tabular-nums leading-none">
                {data.completion_rate}%
              </span>
              <span className="text-xs text-[var(--text-muted)] pb-1">
                completion rate
              </span>
            </div>
            <ProgressBar value={data.completion_rate} color="var(--primary)" height="h-2" />
            <div className="flex items-center gap-3 flex-wrap mt-1">
              <StatusBadge label={`${data.completed} completed`} variant="success" size="sm" />
              <StatusBadge label={`${data.failed} failed`} variant="danger" size="sm" />
              <StatusBadge label={`${data.active} active`} variant="primary" size="sm" />
              <StatusBadge label={`${data.pending} pending`} variant="default" size="sm" />
              <span className="text-xs text-[var(--text-muted)]">
                avg {data.avg_jobs_per_mission} jobs/mission
              </span>
            </div>
          </div>

          {/* Per-operator breakdown */}
          {data.by_operator.length > 0 && (
            <div className="space-y-3 pt-4 mt-4 border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                By Operator
              </p>
              {data.by_operator.map((item) => {
                const successVariant =
                  item.success_rate >= 80
                    ? 'success' as const
                    : item.success_rate >= 60
                    ? 'warning' as const
                    : 'danger' as const

                return (
                  <div key={item.operator_team} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text)]">
                        {formatTeamName(item.operator_team)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">
                          {item.missions} missions
                        </span>
                        <StatusBadge
                          label={`${item.success_rate}%`}
                          variant={successVariant}
                          size="sm"
                        />
                      </div>
                    </div>
                    <ProgressBar
                      value={item.success_rate}
                      color={
                        item.success_rate >= 80
                          ? 'var(--success)'
                          : item.success_rate >= 60
                          ? 'var(--warning)'
                          : 'var(--danger)'
                      }
                    />
                  </div>
                )
              })}
            </div>
          )}
        </MotionFadeIn>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No mission data available.</p>
      )}
    </GlassCard>
  )
}
