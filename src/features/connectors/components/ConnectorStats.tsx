'use client'

import { Link2, CheckCircle2, Send, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConnectorStats } from '@/features/connectors/hooks/use-connector-stats'

interface ConnectorStatsProps {
  stats: ConnectorStats | null
  loading: boolean
}

export function ConnectorStats({ stats, loading }: ConnectorStatsProps) {
  const cards = [
    {
      label: 'Total Connectors',
      value: stats?.total ?? 0,
      Icon: Link2,
      color: 'var(--primary)',
    },
    {
      label: 'Connected',
      value: stats?.connected ?? 0,
      Icon: CheckCircle2,
      color: 'var(--success)',
    },
    {
      label: 'Published Today',
      value: stats?.published_today ?? 0,
      Icon: Send,
      color: 'var(--primary)',
    },
    {
      label: 'Errors',
      value: stats?.error ?? 0,
      Icon: AlertCircle,
      color: (stats?.error ?? 0) > 0 ? 'var(--danger)' : 'var(--text-muted)',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          className={cn(
            'flex items-center gap-3 p-4 rounded-[var(--radius-lg)]',
            'border border-[var(--border)] bg-[var(--surface)]'
          )}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)] shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <Icon size={14} style={{ color }} />
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text)] leading-none">
              {loading ? '—' : value}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
