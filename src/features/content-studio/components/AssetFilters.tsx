'use client'

import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetFiltersProps {
  filters: {
    status?: string
    type?: string
    platform?: string
    search?: string
  }
  onFiltersChange: (filters: AssetFiltersProps['filters']) => void
  assetCount: number
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const PLATFORMS = [
  { value: '', label: 'All' },
  { value: 'x', label: '𝕏' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
] as const

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssetFilters({ filters, onFiltersChange, assetCount }: AssetFiltersProps) {
  const activeCount = [filters.status, filters.platform, filters.search].filter(Boolean).length

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined })
  }

  const clearAll = () => {
    onFiltersChange({})
  }

  return (
    <div className="space-y-3">
      {/* Search + count row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search assets..."
            value={filters.search ?? ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            leftIcon={<Search size={14} />}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {activeCount > 0 && (
            <>
              <Badge variant="accent" className="text-[10px]">
                {activeCount} filter{activeCount > 1 ? 's' : ''}
              </Badge>
              <Button variant="ghost" size="xs" onClick={clearAll} className="gap-1 text-[var(--text-muted)]">
                <X size={12} />
                Clear
              </Button>
            </>
          )}
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {assetCount.toLocaleString()} asset{assetCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Platform pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mr-1">
          Platform
        </span>
        {PLATFORMS.map((p) => {
          const isActive = (filters.platform ?? '') === p.value
          return (
            <button
              key={p.value || 'all'}
              onClick={() => updateFilter('platform', p.value)}
              className={cn(
                'px-3 h-7 rounded-full text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text)]',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mr-1">
          Status
        </span>
        {STATUSES.map((s) => {
          const isActive = (filters.status ?? '') === s.value
          return (
            <button
              key={s.value || 'all'}
              onClick={() => updateFilter('status', s.value)}
              className={cn(
                'px-3 h-7 rounded-full text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(124,58,237,0.25)]'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)]',
              )}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
