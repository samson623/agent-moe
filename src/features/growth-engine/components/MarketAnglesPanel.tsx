'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain } from 'lucide-react'
import type { TrendSignal, TrendMarketAngle } from '../types'

interface MarketAnglesPanelProps {
  signals: TrendSignal[];
  isLoading: boolean;
}

interface EnrichedAngle extends TrendMarketAngle {
  sourceTopic: string;
}

function SkeletonAngle() {
  return (
    <div className="border-l-2 border-l-[var(--border)] pl-3 py-1 space-y-1.5 animate-pulse">
      <div className="h-3 bg-[var(--border)] rounded w-4/5" />
      <div className="h-2 bg-[var(--border)] rounded w-full" />
      <div className="h-2 bg-[var(--border)] rounded w-2/3" />
    </div>
  )
}

export function MarketAnglesPanel({ signals, isLoading }: MarketAnglesPanelProps) {
  const angles = useMemo<EnrichedAngle[]>(() => {
    const seen = new Set<string>()
    const result: EnrichedAngle[] = []

    for (const signal of signals) {
      for (const angle of signal.market_angles) {
        const key = angle.angle.toLowerCase().slice(0, 40)
        if (!seen.has(key)) {
          seen.add(key)
          result.push({ ...angle, sourceTopic: signal.topic })
        }
        if (result.length >= 8) break
      }
      if (result.length >= 8) break
    }

    return result
  }, [signals])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-[var(--accent)]" />
          <CardTitle className="text-sm">Market Angles</CardTitle>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          AI-identified positioning opportunities
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonAngle key={i} />)
        ) : angles.length === 0 ? (
          <div className="text-center py-6">
            <Brain size={24} className="text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
            <p className="text-xs text-[var(--text-muted)]">
              Market angles appear after your first trend scan
            </p>
          </div>
        ) : (
          angles.map((angle, i) => (
            <div
              key={i}
              className="border-l-2 border-l-[var(--accent)] pl-3 py-1"
            >
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <p className="text-xs font-semibold text-[var(--text)] leading-snug flex-1">
                  {angle.angle}
                </p>
                <Badge variant="muted" className="text-[9px] shrink-0">{angle.sourceTopic.slice(0, 20)}</Badge>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-1">
                {angle.rationale.slice(0, 100)}{angle.rationale.length > 100 ? '…' : ''}
              </p>
              <span
                className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded border"
                style={{
                  color: '#10b981',
                  borderColor: 'rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.08)',
                }}
              >
                CTA: {angle.cta_angle.slice(0, 50)}{angle.cta_angle.length > 50 ? '…' : ''}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
