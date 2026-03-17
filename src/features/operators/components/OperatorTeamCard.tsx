'use client'

import type { LucideIcon } from 'lucide-react'
import { GlassCard } from '@/components/nebula'
import { StatusBadge } from '@/components/nebula'
import { cn } from '@/lib/utils'

export interface OperatorTeam {
  id: string
  name: string
  icon: LucideIcon
  description: string
  status: 'Live' | 'Armed' | 'Standby'
  output: string
  value: string
}

interface OperatorTeamCardProps {
  team: OperatorTeam
  active: boolean
  onClick: () => void
}

const STATUS_VARIANT: Record<OperatorTeam['status'], 'success' | 'accent' | 'default'> = {
  Live: 'success',
  Armed: 'accent',
  Standby: 'default',
}

export function OperatorTeamCard({ team, active, onClick }: OperatorTeamCardProps) {
  const Icon = team.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-[var(--radius)]"
    >
      <GlassCard
        padding="md"
        hover
        className={cn(
          'cursor-pointer transition-all duration-200',
          active && 'border-[var(--primary-muted)] bg-[var(--primary-muted)]/10 shadow-[var(--glow-primary)]',
        )}
      >
        {/* Top row: icon badge + name + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-[var(--radius)] shrink-0',
                'bg-[var(--primary-muted)] border border-[var(--border)]',
                active && 'bg-[var(--primary)]/20 border-[var(--primary)]/40',
              )}
            >
              <Icon size={18} className="text-[var(--primary)]" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text)] leading-tight">
              {team.name}
            </h4>
          </div>
          <StatusBadge
            label={team.status}
            variant={STATUS_VARIANT[team.status]}
            pulse={team.status === 'Live'}
          />
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
          {team.description}
        </p>

        {/* Bottom: 2-column mini stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Output</p>
            <p className="text-sm font-semibold text-[var(--text)] tabular-nums mt-0.5">
              {team.output}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Value</p>
            <p className="text-sm font-semibold text-[var(--accent)] tabular-nums mt-0.5">
              {team.value}
            </p>
          </div>
        </div>
      </GlassCard>
    </button>
  )
}
