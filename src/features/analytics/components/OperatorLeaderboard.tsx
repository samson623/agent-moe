'use client'

import { Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OperatorStats } from '@/features/analytics/types'

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
    <div
      className={cn(
        'p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]',
        'space-y-4',
      )}
    >
      <h3 className="text-sm font-semibold text-[var(--text)]">Operator Leaderboard</h3>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-elevated)] space-y-2"
            >
              <div className="h-4 w-28 bg-[var(--border)] rounded" />
              <div className="h-3 w-full bg-[var(--border)] rounded" />
              <div className="h-3 w-3/4 bg-[var(--border)] rounded" />
            </div>
          ))}
        </div>
      ) : data && data.by_team.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {data.by_team.map((team) => {
            const isTop = data.top_team === team.team
            const { name, color } = formatTeamName(team.team)

            return (
              <div
                key={team.team}
                className={cn(
                  'relative p-4 rounded-[var(--radius-lg)] border transition-all duration-150',
                  'bg-[var(--surface-elevated)]',
                  isTop
                    ? 'border-[var(--warning)] ring-1 ring-[rgba(245,158,11,0.15)]'
                    : 'border-[var(--border)]',
                )}
              >
                {/* Top performer badge */}
                {isTop && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)]">
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
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">missions</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-[var(--text)] tabular-nums leading-none">
                      {team.jobs}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">jobs</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-[var(--text)] tabular-nums leading-none">
                      {team.assets}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">assets</p>
                  </div>
                  <div>
                    <p
                      className="text-base font-bold tabular-nums leading-none"
                      style={{
                        color:
                          team.success_rate >= 80
                            ? 'var(--success)'
                            : team.success_rate >= 60
                            ? 'var(--warning)'
                            : 'var(--danger)',
                      }}
                    >
                      {team.success_rate}%
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">success</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No operator data available.</p>
      )}
    </div>
  )
}
