'use client'

import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalyticsEvent } from '@/features/analytics/types'
import { GlassCard, SectionHeader, StatusBadge, EmptyState } from '@/components/nebula'

interface EventFeedProps {
  events: AnalyticsEvent[]
  isLoading: boolean
  onLoadMore?: () => void
}

function getEventColor(eventType: string): {
  dot: string
  bg: string
  border: string
  text: string
} {
  const prefix = eventType.split('.')[0] ?? ''
  const MAP: Record<string, { dot: string; bg: string; border: string; text: string }> = {
    mission: {
      dot: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.2)',
      text: '#3b82f6',
    },
    asset: {
      dot: '#7c3aed',
      bg: 'rgba(124,58,237,0.1)',
      border: 'rgba(124,58,237,0.2)',
      text: '#a78bfa',
    },
    job: {
      dot: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.2)',
      text: '#f59e0b',
    },
    connector: {
      dot: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)',
      text: '#10b981',
    },
    content: {
      dot: '#06b6d4',
      bg: 'rgba(6,182,212,0.1)',
      border: 'rgba(6,182,212,0.2)',
      text: '#06b6d4',
    },
  }
  return (
    MAP[prefix] ?? {
      dot: '#6b7280',
      bg: 'rgba(107,114,128,0.1)',
      border: 'rgba(107,114,128,0.2)',
      text: '#9ca3af',
    }
  )
}

function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

function formatEventType(eventType: string): string {
  return eventType.replace(/\./g, ' > ')
}

export function EventFeed({ events, isLoading, onLoadMore }: EventFeedProps) {
  const visible = events.slice(0, 20)

  return (
    <GlassCard hover={false}>
      <SectionHeader title="Event Feed" />

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--skeleton)] mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-40 bg-[var(--skeleton)] rounded" />
                <div className="h-2.5 w-24 bg-[var(--skeleton)] rounded" />
              </div>
              <div className="h-2.5 w-14 bg-[var(--skeleton)] rounded" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No events yet"
          description="Events will appear here as your operators process missions and generate content."
        />
      ) : (
        <>
          <div className="space-y-0.5">
            {visible.map((event) => {
              const colors = getEventColor(event.event_type)
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 py-2 px-2 rounded-[var(--radius)] hover:bg-[var(--surface-hover)] transition-colors duration-100 group"
                >
                  {/* Dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: colors.dot }}
                    aria-hidden="true"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium leading-snug"
                      style={{ color: colors.text }}
                    >
                      {formatEventType(event.event_type)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusBadge
                        label={event.entity_type}
                        variant="default"
                        size="sm"
                      />
                      {event.entity_id && (
                        <span className="text-xs text-[var(--text-muted)] truncate max-w-[120px] font-mono">
                          {event.entity_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-[var(--text-muted)] shrink-0 pt-0.5 tabular-nums">
                    {relativeTime(event.occurred_at)}
                  </span>
                </div>
              )
            })}
          </div>

          {onLoadMore && (
            <button
              type="button"
              onClick={onLoadMore}
              className={cn(
                'w-full mt-2 py-2 text-xs font-medium rounded-[var(--radius)] transition-colors duration-150',
                'text-[var(--text-muted)] hover:text-[var(--text)]',
                'bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)]',
                'border border-[var(--border)]',
              )}
            >
              Load more
            </button>
          )}
        </>
      )}
    </GlassCard>
  )
}
