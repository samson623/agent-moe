'use client'


import type { ContentPerformance } from '@/features/analytics/types'
import { GlassCard, SectionHeader, StatusBadge } from '@/components/nebula'
import { MotionFadeIn } from '@/components/nebula/motion'

interface ContentPerformancePanelProps {
  data: ContentPerformance | null
  isLoading: boolean
}

function formatTypeName(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatPlatformName(platform: string): string {
  const MAP: Record<string, string> = {
    x: 'X / Twitter',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    email: 'Email',
    notion: 'Notion',
    airtable: 'Airtable',
    webhook: 'Webhook',
  }
  return MAP[platform.toLowerCase()] ?? formatTypeName(platform)
}

export function ContentPerformancePanel({ data, isLoading }: ContentPerformancePanelProps) {
  const byPlatform = Array.isArray(data?.by_platform) ? data.by_platform : []
  const maxPlatformCount = byPlatform.length > 0
    ? Math.max(...byPlatform.map((p) => p.count), 1)
    : 1

  return (
    <GlassCard hover={false}>
      <SectionHeader title="Content Performance" />

      {isLoading ? (
        <div className="animate-pulse grid md:grid-cols-2 gap-6">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-2">
              <div className="h-3 w-20 bg-[var(--skeleton)] rounded mb-3" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-24 bg-[var(--skeleton)] rounded" />
                  <div className="h-3 w-10 bg-[var(--skeleton)] rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : data ? (
        <MotionFadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {/* By Type */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                By Type
              </p>
              {data.by_type.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No types recorded.</p>
              ) : (
                data.by_type.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between py-1 border-b border-[var(--border)] last:border-0"
                  >
                    <span className="text-xs text-[var(--text)]">
                      {formatTypeName(item.type)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--text)] tabular-nums">
                        {item.count}
                      </span>
                      <StatusBadge
                        label={`${item.published} pub`}
                        variant="success"
                        size="sm"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* By Platform */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                By Platform
              </p>
              {byPlatform.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No platform data.</p>
              ) : (
                byPlatform.map((item) => {
                  const pct = Math.round((item.count / maxPlatformCount) * 100)
                  return (
                    <div key={item.platform} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text)]">
                          {formatPlatformName(item.platform)}
                        </span>
                        <span className="text-[var(--text-muted)] tabular-nums">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500 bg-[var(--primary)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Confidence score */}
          <div className="flex items-center gap-3 pt-3 mt-3 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)]">Avg Confidence Score</span>
            <StatusBadge
              label={`${data.avg_confidence_score}%`}
              variant={
                data.avg_confidence_score >= 80
                  ? 'success'
                  : data.avg_confidence_score >= 60
                  ? 'warning'
                  : 'danger'
              }
              size="md"
            />
          </div>
        </MotionFadeIn>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No content data available.</p>
      )}
    </GlassCard>
  )
}
