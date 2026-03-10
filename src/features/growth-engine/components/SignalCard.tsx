'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import type { TrendSignal } from '../types'

interface SignalCardProps {
  signal: TrendSignal;
  onClick?: () => void;
  selected?: boolean;
}

const MOMENTUM_CONFIG = {
  explosive: { label: '🔥 Explosive', border: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
  rising:    { label: '↑ Rising',    border: '#10b981', bg: 'rgba(16,185,129,0.06)' },
  stable:    { label: '→ Stable',    border: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
  falling:   { label: '↓ Falling',   border: '#6b7280', bg: 'rgba(107,114,128,0.04)' },
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? '#f59e0b' : 'var(--danger)'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="h-1 rounded-full bg-[var(--border)]">
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function SignalCard({ signal, onClick, selected }: SignalCardProps) {
  const cfg = MOMENTUM_CONFIG[signal.momentum]
  const firstAngle = signal.market_angles[0]
  const extraGaps = Math.max(0, signal.competitor_gaps.length - 2)

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-[var(--radius-lg)] border bg-[var(--surface)] p-4 cursor-pointer',
        'transition-all duration-150 hover:scale-[1.01] group',
        selected
          ? 'ring-2 ring-[var(--accent)] border-[var(--accent)]'
          : 'border-[var(--border)] hover:border-[var(--border-hover)]'
      )}
      style={{ borderTopColor: cfg.border, borderTopWidth: 2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-[var(--text)] leading-snug flex-1">
          {signal.topic}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{ color: cfg.border, borderColor: `${cfg.border}40`, background: cfg.bg }}
          >
            {cfg.label}
          </span>
          {signal.platform && (
            <Badge variant="muted" className="text-[10px]">{signal.platform}</Badge>
          )}
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2 mb-3">
        <ScoreBar label="Trend Score" value={signal.score} />
        <ScoreBar label="Opportunity" value={signal.opportunity_score} />
        <ScoreBar label="Audience Fit" value={Math.round(signal.audience_fit * 100)} />
      </div>

      {/* Category */}
      {signal.category && (
        <Badge variant="muted" className="text-[10px] mb-2">{signal.category}</Badge>
      )}

      {/* Competitor gaps */}
      {signal.competitor_gaps.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {signal.competitor_gaps.slice(0, 2).map((gap, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)]"
            >
              gap: {gap.slice(0, 40)}{gap.length > 40 ? '…' : ''}
            </span>
          ))}
          {extraGaps > 0 && (
            <span className="text-[10px] text-[var(--text-muted)]">+{extraGaps} more</span>
          )}
        </div>
      )}

      {/* First market angle */}
      {firstAngle && (
        <div className="border-l-2 border-l-[var(--accent)] pl-2 mb-3">
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">
            {firstAngle.angle.slice(0, 100)}{firstAngle.angle.length > 100 ? '…' : ''}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>
          Scanned {new Date(signal.scanned_at).toLocaleDateString()}
          {signal.content_ideas.length > 0 && (
            <> · {signal.content_ideas.length} idea{signal.content_ideas.length > 1 ? 's' : ''}</>
          )}
        </span>
        <ChevronRight
          size={12}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  )
}
