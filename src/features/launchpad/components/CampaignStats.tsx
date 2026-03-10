'use client'

import { Rocket, Play, FileText, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampaignStats } from '@/features/launchpad/types'

interface CampaignStatsProps {
  stats: CampaignStats | null
  loading: boolean
}

export function CampaignStats({ stats, loading }: CampaignStatsProps) {
  const cards = [
    {
      label: 'Total Campaigns',
      value: stats?.total ?? 0,
      Icon: Rocket,
      color: 'var(--primary)',
    },
    {
      label: 'Active',
      value: stats?.active ?? 0,
      Icon: Play,
      color: 'var(--success)',
    },
    {
      label: 'Draft',
      value: stats?.draft ?? 0,
      Icon: FileText,
      color: 'var(--text-muted)',
    },
    {
      label: 'Assets Staged',
      value: stats?.total_assets ?? 0,
      Icon: Layers,
      color: 'var(--primary)',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          className={cn(
            'flex items-center gap-3 p-4 rounded-[var(--radius-lg)]',
            'border border-[var(--border)] bg-[var(--surface)]',
          )}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)] shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
            aria-hidden="true"
          >
            <Icon size={14} style={{ color }} />
          </div>
          <div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-5 w-8 bg-[var(--surface-elevated)] rounded mb-1" />
                <div className="h-2.5 w-20 bg-[var(--surface-elevated)] rounded" />
              </div>
            ) : (
              <>
                <p className="text-lg font-bold text-[var(--text)] leading-none tabular-nums">
                  {value}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</p>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
