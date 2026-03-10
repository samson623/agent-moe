'use client'

import { cn } from '@/lib/utils'
import type { SignalMomentum } from '../types'

interface SignalFiltersProps {
  momentum: string;
  category: string;
  platform: string;
  minScore: number;
  onMomentumChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onPlatformChange: (v: string) => void;
  onMinScoreChange: (v: number) => void;
  activeCount: number;
}

const MOMENTUM_OPTIONS: Array<{ value: SignalMomentum | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'explosive', label: '🔥 Explosive' },
  { value: 'rising', label: '↑ Rising' },
  { value: 'stable', label: '→ Stable' },
  { value: 'falling', label: '↓ Falling' },
]

const CATEGORIES = ['all', 'AI', 'Marketing', 'Productivity', 'Finance', 'Creator Economy', 'Health']

const PLATFORMS = ['all', 'X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube']

const SCORE_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 25, label: '25+' },
  { value: 50, label: '50+' },
  { value: 75, label: '75+' },
  { value: 90, label: '90+' },
]

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
        active
          ? 'border-[var(--accent)] text-[var(--accent)] bg-[rgba(99,102,241,0.08)]'
          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]'
      )}
    >
      {children}
    </button>
  )
}

export function SignalFilters({
  momentum,
  category,
  platform,
  minScore,
  onMomentumChange,
  onCategoryChange,
  onPlatformChange,
  onMinScoreChange,
  activeCount,
}: SignalFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Momentum */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--text-muted)] font-medium w-16 shrink-0">Momentum</span>
        <div className="flex gap-1.5 flex-wrap">
          {MOMENTUM_OPTIONS.map((opt) => (
            <FilterPill
              key={opt.value}
              active={momentum === opt.value}
              onClick={() => onMomentumChange(opt.value)}
            >
              {opt.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Row 2: Category */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--text-muted)] font-medium w-16 shrink-0">Category</span>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <FilterPill
              key={cat}
              active={category === cat}
              onClick={() => onCategoryChange(cat)}
            >
              {cat}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Row 3: Platform + Score + Clear */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] font-medium w-16 shrink-0">Platform</span>
          <div className="flex gap-1.5 flex-wrap">
            {PLATFORMS.map((plat) => (
              <FilterPill
                key={plat}
                active={platform === plat}
                onClick={() => onPlatformChange(plat)}
              >
                {plat}
              </FilterPill>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[var(--text-muted)] font-medium">Score</span>
          <div className="flex gap-1.5">
            {SCORE_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                active={minScore === opt.value}
                onClick={() => onMinScoreChange(opt.value)}
              >
                {opt.label}
              </FilterPill>
            ))}
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => {
              onMomentumChange('all')
              onCategoryChange('all')
              onPlatformChange('all')
              onMinScoreChange(0)
            }}
            className="text-xs text-[var(--danger)] hover:text-[var(--danger)] transition-colors"
          >
            Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  )
}
