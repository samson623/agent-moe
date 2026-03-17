'use client'

import { Loader2, Lightbulb, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedbackInsight, FeedbackInsightType } from '@/features/analytics/types'
import { GlassCard, SectionHeader, StatusBadge } from '@/components/nebula'

interface FeedbackInsightsPanelProps {
  insights: FeedbackInsight[]
  isLoading: boolean
  onGenerate: () => void
  workspaceId: string
}

const INSIGHT_TYPE_CONFIG: Record<
  FeedbackInsightType,
  { variant: 'info' | 'warning' | 'primary' | 'success'; label: string }
> = {
  opportunity: { variant: 'info', label: 'Opportunity' },
  warning: { variant: 'warning', label: 'Warning' },
  recommendation: { variant: 'primary', label: 'Recommendation' },
  success: { variant: 'success', label: 'Success' },
}

export function FeedbackInsightsPanel({
  insights,
  isLoading,
  onGenerate,
}: FeedbackInsightsPanelProps) {
  const hasInsights = insights.length > 0

  return (
    <GlassCard hover={false} className="flex flex-col">
      {/* Header */}
      <SectionHeader
        title="AI Feedback Insights"
        action={
          <Lightbulb size={14} className="text-[var(--warning)]" />
        }
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--text-muted)]">Analyzing performance data...</p>
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
                <GlassCard
                  key={insight.id}
                  variant="elevated"
                  padding="sm"
                  hover={false}
                >
                  <div className="space-y-1">
                    {/* Type badge */}
                    <StatusBadge
                      label={cfg.label}
                      variant={cfg.variant}
                      size="sm"
                    />

                    {/* Title */}
                    <p className="text-xs font-semibold text-[var(--text)] leading-snug">
                      {insight.title}
                    </p>

                    {/* Body */}
                    <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
                      {insight.body}
                    </p>

                    {/* Metric */}
                    {insight.metric && (
                      <StatusBadge
                        label={insight.metric}
                        variant="default"
                        size="sm"
                      />
                    )}
                  </div>
                </GlassCard>
              )
            })}
          </div>

          {/* Regenerate button */}
          <button
            type="button"
            onClick={onGenerate}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium mt-4',
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
    </GlassCard>
  )
}
