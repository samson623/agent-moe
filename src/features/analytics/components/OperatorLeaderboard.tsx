'use client'

import { Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OperatorStats } from '@/features/analytics/types'
import { GlassCard, SectionHeader, StatusBadge } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'

interface OperatorLeaderboardProps {
  data: OperatorStats | null
  isLoading: boolean
}

const TEAM_DISPLAY: Record<string, { name: string; color: string }> = {
  content_strike: { name: 'Content Strike', color: 'var(--primary)' },
  content_strike_team: { name: 'Content Strike', color: 'var(--primary)' },
  growth_operator: { name: 'Growth Operator', color: 'var(--success)' },
  revenue_closer: { name: 'Revenue Closer', color: 'var(--warning)' },
  brand_guardian: { name: 'Brand Guardian', color: 'var(--accent)' },
}

function formatTeamName(team: string): { name: string; color: string } {
  const found = TEAM_DISPLAY[team.toLowerCase()]
  if (found) return found
  const name = team
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return { name, color: 'var(--text-muted)' }
}

export function OperatorLeaderboard({ data, isLoading }: OperatorLeaderboardProps) {
  return (
    <GlassCard hover={false}>
      <SectionHeader title="Operator Leaderboard" />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] space-y-2"
            >
              <div className="h-4 w-28 bg-[var(--skeleton)] rounded" />
              <div className="h-3 w-full bg-[var(--skeleton)] rounded" />
              <div className="h-3 w-3/4 bg-[var(--skeleton)] rounded" />
            </div>
          ))}
        </div>
      ) : data && data.by_team.length > 0 ? (
        <MotionStagger className="grid grid-cols-2 gap-3">
          {data.by_team.map((team) => {
            const isTop = data.top_team === team.team
            const { name, color } = formatTeamName(team.team)
            const successVariant =
              team.success_rate >= 80
                ? 'success' as const
                : team.success_rate >= 60
                ? 'warning' as const
                : 'danger' as const

            return (
              <MotionStaggerItem key={team.team}>
                <GlassCard
                  variant={isTop ? 'glow' : 'elevated'}
                  hover={true}
                  padding="md"
                  className={cn(
                    isTop && 'ring-1 ring-[rgba(245,158,11,0.15)]',
                  )}
                >
                  {/* Top performer badge */}
                  {isTop && (
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)]">
                      <Medal size={10} style={{ color: 'var(--warning)' }} />
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--warning)' }}>
                        Top
                      </span>
                    </div>
                  )}

                  {/* Team name */}
                  <div className="flex items-center gap-2 mb-3 pr-14">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <p className="text-xs font-semibold text-[var(--text)] leading-tight">{name}</p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                    <div>
                      <p className="text-base font-bold text-[var(--text)] tabular-nums leading-none">
                        {team.missions}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">missions</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-[var(--text)] tabular-nums leading-none">
                        {team.jobs}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">jobs</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-[var(--text)] tabular-nums leading-none">
                        {team.assets}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">assets</p>
                    </div>
                    <div>
                      <StatusBadge
                        label={`${team.success_rate}%`}
                        variant={successVariant}
                        size="sm"
                      />
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">success</p>
                    </div>
                  </div>
                </GlassCard>
              </MotionStaggerItem>
            )
          })}
        </MotionStagger>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No operator data available.</p>
      )}
    </GlassCard>
  )
}
