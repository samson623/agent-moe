'use client'

import { Loader2, Lightbulb, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedbackInsight, FeedbackInsightType } from '@/features/analytics/types'

interface FeedbackInsightsPanelProps {
  insights: FeedbackInsight[]
  isLoading: boolean
  onGenerate: () => void
  workspaceId: string
}

const INSIGHT_TYPE_CONFIG: Record<
  FeedbackInsightType,
  { bar: string; badge: string; badgeBg: string; label: string }
> = {
  opportunity: {
    bar: '#3b82f6',
    badge: '#3b82f6',
    badgeBg: 'rgba(59,130,246,0.12)',
    label: 'Opportunity',
  },
  warning: {
    bar: '#f59e0b',
    badge: '#f59e0b',
    badgeBg: 'rgba(245,158,11,0.12)',
    label: 'Warning',
  },
  recommendation: {
    bar: '#7c3aed',
    badge: '#a78bfa',
    badgeBg: 'rgba(124,58,237,0.12)',
    label: 'Recommendation',
  },
  success: {
    bar: '#10b981',
    badge: '#10b981',
    badgeBg: 'rgba(16,185,129,0.12)',
    label: 'Success',
  },
}

export function FeedbackInsightsPanel({
  insights,
  isLoading,
  onGenerate,
}: FeedbackInsightsPanelProps) {
  const hasInsights = insights.length > 0

  return (
    <div
      className={cn(
        'p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]',
        'flex flex-col gap-4',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-[var(--warning)] shrink-0" />
        <h3 className="text-sm font-semibold text-[var(--text)] flex-1">AI Feedback Insights</h3>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--text-muted)]">Analyzing performance data…</p>
        </div>
      )}

      {/* Empty / generate prompt */}
      {!isLoading && !hasInsights && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center">
            <Lightbulb size={16} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed max-w-[180px]">
            Generate AI insights from your workspace performance data.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-[var(--radius)] transition-all duration-150',
              'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
              'shadow-[var(--glow-primary)]',
            )}
          >
            Generate Insights
          </button>
        </div>
      )}

      {/* Insights list */}
      {!isLoading && hasInsights && (
        <>
          <div className="space-y-3 flex-1">
            {insights.map((insight) => {
              const cfg = INSIGHT_TYPE_CONFIG[insight.type] ?? INSIGHT_TYPE_CONFIG.recommendation
              return (
                <div
                  key={insight.id}
                  className="flex gap-3 p-3 rounded-[var(--radius)] bg-[var(--surface-elevated)] border border-[var(--border)]"
                >
                  {/* Left color bar */}
                  <div
                    className="w-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.bar, minHeight: 40 }}
                    aria-hidden="true"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Type badge */}
                    <span
                      className="inline-flex items-center px-1.5 py-0 text-[10px] font-semibold rounded-sm capitalize"
                      style={{
                        color: cfg.badge,
                        backgroundColor: cfg.badgeBg,
                        border: `1px solid ${cfg.badge}30`,
                      }}
                    >
                      {cfg.label}
                    </span>

                    {/* Title */}
                    <p className="text-xs font-semibold text-[var(--text)] leading-snug">
                      {insight.title}
                    </p>

                    {/* Body */}
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      {insight.body}
                    </p>

                    {/* Metric */}
                    {insight.metric && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]"
                      >
                        {insight.metric}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Regenerate button */}
          <button
            type="button"
            onClick={onGenerate}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium',
              'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)]',
              'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
              'transition-colors duration-150',
            )}
          >
            <RefreshCw size={11} />
            Regenerate
          </button>
        </>
      )}
    </div>
  )
}
