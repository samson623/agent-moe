'use client'

import { cn } from '@/lib/utils'
import type { ContentPerformance } from '@/features/analytics/types'

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
  const maxPlatformCount = data
    ? Math.max(...data.by_platform.map((p) => p.count), 1)
    : 1

  return (
    <div
      className={cn(
        'p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]',
        'space-y-5',
      )}
    >
      <h3 className="text-sm font-semibold text-[var(--text)]">Content Performance</h3>

      {isLoading ? (
        <div className="animate-pulse grid md:grid-cols-2 gap-6">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-2">
              <div className="h-3 w-20 bg-[var(--surface-elevated)] rounded mb-3" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-24 bg-[var(--surface-elevated)] rounded" />
                  <div className="h-3 w-10 bg-[var(--surface-elevated)] rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* By Type */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
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
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text)] tabular-nums">
                        {item.count}
                      </span>
                      <span>·</span>
                      <span
                        className="text-[var(--success)]"
                        title="Published"
                      >
                        {item.published} pub
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* By Platform */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                By Platform
              </p>
              {data.by_platform.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No platform data.</p>
              ) : (
                data.by_platform.map((item) => {
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
          <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)]">Avg Confidence Score</span>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums',
              )}
              style={{
                backgroundColor:
                  data.avg_confidence_score >= 80
                    ? 'rgba(16,185,129,0.12)'
                    : data.avg_confidence_score >= 60
                    ? 'rgba(245,158,11,0.12)'
                    : 'rgba(239,68,68,0.12)',
                color:
                  data.avg_confidence_score >= 80
                    ? 'var(--success)'
                    : data.avg_confidence_score >= 60
                    ? 'var(--warning)'
                    : 'var(--danger)',
                border: `1px solid ${
                  data.avg_confidence_score >= 80
                    ? 'rgba(16,185,129,0.25)'
                    : data.avg_confidence_score >= 60
                    ? 'rgba(245,158,11,0.25)'
                    : 'rgba(239,68,68,0.25)'
                }`,
              }}
            >
              {data.avg_confidence_score}%
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No content data available.</p>
      )}
    </div>
  )
}
