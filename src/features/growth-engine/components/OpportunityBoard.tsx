'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TrendSignal } from '../types'

interface OpportunityBoardProps {
  signals: TrendSignal[];
  isLoading: boolean;
  onSignalClick?: (signal: TrendSignal) => void;
}

const RANK_COLORS = ['#f59e0b', '#9ca3af', '#b45309', 'var(--text-muted)']

function getRankColor(rank: number): string {
  return RANK_COLORS[Math.min(rank - 1, RANK_COLORS.length - 1)] ?? 'var(--text-muted)'
}

function getUrgency(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Act Now', color: 'var(--danger)' }
  if (score >= 60) return { label: 'This Week', color: 'var(--accent)' }
  return { label: 'This Month', color: 'var(--text-muted)' }
}

function getMomentumIcon(momentum: TrendSignal['momentum']): string {
  if (momentum === 'explosive') return '🔥'
  if (momentum === 'rising') return '↑'
  if (momentum === 'stable') return '→'
  return '↓'
}

function getBarColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#f59e0b'
  return '#6b7280'
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-5 h-5 rounded-full bg-[var(--border)] shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-3 bg-[var(--border)] rounded w-3/4" />
        <div className="h-2 bg-[var(--border)] rounded w-1/2" />
      </div>
      <div className="w-16 h-2 bg-[var(--border)] rounded" />
    </div>
  )
}

export function OpportunityBoard({ signals, isLoading, onSignalClick }: OpportunityBoardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Opportunity Board</CardTitle>
          <Badge variant="muted" className="text-xs">Top {Math.min(signals.length, 10)}</Badge>
        </div>
        <p className="text-xs md:text-sm text-[var(--text-muted)]">Ranked by AI opportunity score</p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="divide-y divide-[var(--border-subtle)]">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : signals.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-[var(--text-muted)]">
              No signals yet. Run your first scan to discover opportunities.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {signals.slice(0, 10).map((signal, i) => {
              const rank = i + 1
              const urgency = getUrgency(signal.opportunity_score)
              const barColor = getBarColor(signal.opportunity_score)
              const firstAngle = signal.market_angles[0]

              return (
                <div
                  key={signal.id}
                  onClick={() => onSignalClick?.(signal)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors duration-100',
                    onSignalClick && 'cursor-pointer hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {/* Rank circle */}
                  <div
                    className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5"
                    style={{
                      background: `${getRankColor(rank)}20`,
                      border: `1px solid ${getRankColor(rank)}40`,
                    }}
                  >
                    <span className="text-[9px] font-bold" style={{ color: getRankColor(rank) }}>
                      {rank}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs font-semibold text-[var(--text)] truncate">
                        {signal.topic}
                      </p>
                      <span className="text-xs shrink-0">{getMomentumIcon(signal.momentum)}</span>
                    </div>

                    {firstAngle && (
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {firstAngle.angle.slice(0, 60)}{firstAngle.angle.length > 60 ? '…' : ''}
                      </p>
                    )}

                    {/* Score bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 rounded-full bg-[var(--border)]">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{ width: `${signal.opportunity_score}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
                        {signal.opportunity_score}
                      </span>
                    </div>
                  </div>

                  {/* Urgency */}
                  <span
                    className="text-[9px] font-semibold shrink-0 mt-1 px-1.5 py-0.5 rounded border"
                    style={{
                      color: urgency.color,
                      borderColor: `${urgency.color}40`,
                      background: `${urgency.color}10`,
                    }}
                  >
                    {urgency.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
