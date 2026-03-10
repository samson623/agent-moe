'use client'

import { FolderOpen, Check, Magnet, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RevenueStats } from '../types'

interface OfferStatsProps {
  stats: RevenueStats | null
  isLoading?: boolean
}

interface StatCardProps {
  icon: React.ElementType
  iconColor: string
  value: string | number
  label: string
  isLoading?: boolean
}

function StatCard({ icon: Icon, iconColor, value, label, isLoading }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-[var(--radius-lg)]',
        'border border-[var(--border)] bg-[var(--surface)]',
      )}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] shrink-0"
        style={{
          backgroundColor: `${iconColor}18`,
          border: `1px solid ${iconColor}30`,
        }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <>
            <div className="h-6 w-12 rounded bg-[var(--border)] animate-pulse mb-1" />
            <div className="h-3 w-16 rounded bg-[var(--border)] animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-[var(--text)] tabular-nums leading-none mb-0.5">
              {value}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">{label}</p>
          </>
        )}
      </div>
    </div>
  )
}

export function OfferStats({ stats, isLoading }: OfferStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={FolderOpen}
        iconColor="#f59e0b"
        value={stats?.total_offers ?? 0}
        label="Total Offers"
        isLoading={isLoading}
      />
      <StatCard
        icon={Check}
        iconColor="#10b981"
        value={stats?.active_offers ?? 0}
        label="Active Offers"
        isLoading={isLoading}
      />
      <StatCard
        icon={Magnet}
        iconColor="#06b6d4"
        value={stats?.lead_magnets ?? 0}
        label="Lead Magnets"
        isLoading={isLoading}
      />
      <StatCard
        icon={Layers}
        iconColor="#7c3aed"
        value={stats?.price_range_display ?? '—'}
        label="Price Range"
        isLoading={isLoading}
      />
    </div>
  )
}
