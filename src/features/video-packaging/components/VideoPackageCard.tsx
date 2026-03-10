'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { VideoPackage } from '../hooks/use-video-packages'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  youtube: { label: 'YouTube', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  tiktok: { label: 'TikTok', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  instagram: { label: 'Instagram', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  x: { label: 'X', color: '#a1a1aa', bg: 'rgba(161,161,170,0.12)' },
}

type StatusVariant = 'muted' | 'warning' | 'success' | 'accent' | 'outline'

const STATUS_VARIANT: Record<string, StatusVariant> = {
  draft: 'muted',
  review: 'warning',
  approved: 'success',
  published: 'accent',
  archived: 'outline',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '…'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface VideoPackageCardProps {
  pkg: VideoPackage
  onClick?: () => void
}

export function VideoPackageCard({ pkg, onClick }: VideoPackageCardProps) {
  const platformKey = pkg.platform.toLowerCase()
  const platform = PLATFORM_CONFIG[platformKey] ?? {
    label: pkg.platform,
    color: 'var(--text-muted)',
    bg: 'var(--surface-elevated)',
  }
  const statusVariant = STATUS_VARIANT[pkg.status] ?? 'muted'
  const totalDuration = pkg.scenes.reduce((sum, s) => sum + s.duration_seconds, 0)
  const confidence = pkg.confidence_score

  return (
    <Card
      className={cn(
        'overflow-hidden group cursor-pointer transition-all duration-200',
        'hover:border-[var(--primary)]/40 hover:shadow-[0_0_16px_rgba(59,130,246,0.1)]',
      )}
      onClick={onClick}
    >
      {/* Accent top bar matching platform color */}
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${platform.color}, ${platform.color}40)` }}
      />

      <CardContent className="p-4 space-y-3">
        {/* Top row: platform badge + status */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: platform.color, background: platform.bg }}
          >
            {platform.label}
          </span>
          <Badge variant={statusVariant} className="text-[10px] capitalize">
            {pkg.status}
          </Badge>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-[var(--text)] leading-tight line-clamp-1">
          {pkg.title}
        </p>

        {/* Hook preview */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
          {truncate(pkg.hook.primary, 120)}
        </p>

        {/* Scene count + duration */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full',
              'bg-[var(--surface-elevated)] text-[var(--text-secondary)]',
              'border border-[var(--border-subtle)]',
            )}
          >
            {pkg.scenes.length} scene{pkg.scenes.length !== 1 ? 's' : ''}
          </span>
          <span
            className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full',
              'bg-[var(--surface-elevated)] text-[var(--text-secondary)]',
              'border border-[var(--border-subtle)]',
            )}
          >
            {totalDuration}s
          </span>
          {pkg.hook.variants.length > 0 && (
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
                'border border-[var(--border-subtle)]',
              )}
            >
              {pkg.hook.variants.length} variant{pkg.hook.variants.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Confidence score bar */}
        {confidence !== null && confidence !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
              <span>Confidence</span>
              <span className="tabular-nums">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-[var(--surface-elevated)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${confidence * 100}%`,
                  background:
                    confidence > 0.7
                      ? 'var(--success)'
                      : confidence > 0.4
                        ? 'var(--warning)'
                        : 'var(--danger)',
                }}
              />
            </div>
          </div>
        )}

        {/* Footer: timestamp */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
            {formatTimeAgo(pkg.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
