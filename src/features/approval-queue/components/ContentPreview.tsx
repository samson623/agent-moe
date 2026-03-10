'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Asset, Mission, Job } from '@/lib/supabase/types'

interface ContentPreviewProps {
  assetId: string
  missionId: string | null
}

type PreviewData =
  | { kind: 'asset'; data: Asset }
  | { kind: 'mission'; data: Mission }
  | { kind: 'job'; data: Job }

export function ContentPreview({ assetId, missionId }: ContentPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    // Always load the asset first — it's the primary content
    fetch(`/api/assets/${assetId}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load asset (${res.status})`)
        const json = await res.json() as { data: Asset }
        setPreview({ kind: 'asset', data: json.data })
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Could not load preview')
      })
      .finally(() => { setIsLoading(false) })

    return () => { controller.abort() }
  }, [assetId])

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-[var(--surface-hover)] rounded" />
        <div className="h-24 bg-[var(--surface-hover)] rounded" />
      </div>
    )
  }

  if (error || !preview) {
    return (
      <div className="px-4 py-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-sm text-red-400">
        {error ?? 'Could not load preview'}
      </div>
    )
  }

  if (preview.kind === 'asset') {
    const asset = preview.data
    const score = asset.confidence_score ?? 0

    return (
      <div className="space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] text-[var(--text-muted)] border-[var(--border)]">
            {asset.type}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-[var(--text-muted)] border-[var(--border)]">
            {asset.platform}
          </Badge>
          {asset.operator_team && (
            <Badge variant="outline" className="text-[10px] text-[var(--text-muted)] border-[var(--border)]">
              {asset.operator_team}
            </Badge>
          )}
        </div>

        {/* Title */}
        {asset.title && (
          <h3 className="text-sm font-semibold text-[var(--text)]">{asset.title}</h3>
        )}

        {/* Body */}
        <div className={cn(
          'px-4 py-3 rounded-[var(--radius)]',
          'bg-[var(--surface)] border border-[var(--border)]',
          'text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto',
        )}>
          {asset.body ?? 'No content'}
        </div>

        {/* Confidence score */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-muted)]">Confidence</span>
            <span className={cn(
              'text-xs font-semibold',
              score >= 0.7 ? 'text-emerald-400' : score >= 0.4 ? 'text-amber-400' : 'text-red-400',
            )}>
              {Math.round(score * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                score >= 0.7 ? 'bg-emerald-400' : score >= 0.4 ? 'bg-amber-400' : 'bg-red-400',
              )}
              style={{ width: `${Math.round(score * 100)}%` }}
            />
          </div>
        </div>

        {/* Mission link */}
        {missionId && (
          <div className="text-xs text-[var(--text-muted)]">
            Mission:{' '}
            <a href={`/missions/${missionId}`} className="text-[var(--primary)] hover:underline font-mono">
              {missionId.slice(0, 8)}…
            </a>
          </div>
        )}
      </div>
    )
  }

  return null
}
