'use client'

import { cn } from '@/lib/utils'
import type { MissionPerformance } from '@/features/analytics/types'

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
    <div
      className={cn(
        'p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]',
        'space-y-5',
      )}
    >
      <h3 className="text-sm font-semibold text-[var(--text)]">Mission Performance</h3>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-1/3 bg-[var(--surface-elevated)] rounded" />
          <div className="h-2 w-full bg-[var(--surface-elevated)] rounded-full" />
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-28 bg-[var(--surface-elevated)] rounded" />
                <div className="flex-1 h-1.5 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-3 w-8 bg-[var(--surface-elevated)] rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <>
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
            <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
              <span>{data.completed} completed</span>
              <span>{data.failed} failed</span>
              <span>{data.active} active</span>
              <span>{data.pending} pending</span>
              <span>avg {data.avg_jobs_per_mission} jobs/mission</span>
            </div>
          </div>

          {/* Per-operator breakdown */}
          {data.by_operator.length > 0 && (
            <div className="space-y-3 pt-1 border-t border-[var(--border)]">
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                By Operator
              </p>
              {data.by_operator.map((item) => (
                <div key={item.operator_team} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text)]">
                      {formatTeamName(item.operator_team)}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      <span>{item.missions} missions</span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{
                          color:
                            item.success_rate >= 80
                              ? 'var(--success)'
                              : item.success_rate >= 60
                              ? 'var(--warning)'
                              : 'var(--danger)',
                        }}
                      >
                        {item.success_rate}%
                      </span>
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
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No mission data available.</p>
      )}
    </div>
  )
}
