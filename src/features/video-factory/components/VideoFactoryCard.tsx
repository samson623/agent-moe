'use client'

import { Film, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard, Pill } from '@/components/nebula'
import { RenderProgressBar } from '@/features/video-rendering/components/RenderProgressBar'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VideoFactoryCardProps {
  platform: string
  title: string
  renderStatus: string
  renderProgress: number
  renderUrl: string | null
  renderError: string | null
  confidenceScore: number | null
  packageId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube Shorts',
  instagram: 'IG Reels',
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#ff0050',
  youtube: '#ff0000',
  instagram: '#e1306c',
}

function getAspectLabel(platform: string): string {
  // All factory videos are 9:16 vertical
  return '9:16'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoFactoryCard({
  platform,
  title,
  renderStatus,
  renderProgress,
  renderUrl,
  renderError,
  confidenceScore,
  packageId,
}: VideoFactoryCardProps) {
  const platformLabel = PLATFORM_LABELS[platform] ?? platform
  const platformColor = PLATFORM_COLORS[platform] ?? '#8b5cf6'

  return (
    <GlassCard className="overflow-hidden flex flex-col">
      {/* Platform color bar */}
      <div className="h-1 w-full" style={{ background: platformColor }} />

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={14} style={{ color: platformColor }} />
            <span className="text-sm font-semibold text-[var(--text)]">{platformLabel}</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-disabled)]">{getAspectLabel(platform)}</span>
        </div>

        {/* Title */}
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{title}</p>

        {/* Status area */}
        <div className="flex-1 flex flex-col justify-end space-y-3">
          {/* Rendering */}
          {renderStatus === 'rendering' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Loader2 size={12} className="animate-spin text-[var(--primary)]" />
                <span>Rendering... {renderProgress}%</span>
              </div>
              <RenderProgressBar progress={renderProgress} />
            </div>
          )}

          {/* Completed — video player */}
          {renderStatus === 'completed' && renderUrl && (
            <div className="space-y-2">
              <video
                src={renderUrl}
                controls
                className="w-full rounded-[var(--radius)] bg-black aspect-[9/16] object-contain"
                preload="metadata"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 size={12} />
                  <span>Ready</span>
                </div>
                <a
                  href={renderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                >
                  <ExternalLink size={10} />
                  Open
                </a>
              </div>
            </div>
          )}

          {/* Failed */}
          {renderStatus === 'failed' && (
            <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius)] bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={12} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400 line-clamp-2">{renderError ?? 'Render failed'}</p>
            </div>
          )}

          {/* Idle / generating */}
          {(renderStatus === 'idle' || !renderStatus) && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-disabled)]">
              <Loader2 size={12} className="animate-spin" />
              <span>Preparing...</span>
            </div>
          )}

          {/* Confidence score */}
          {confidenceScore !== null && (
            <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-disabled)]">Confidence</span>
              <Pill tone={confidenceScore >= 0.7 ? 'success' : confidenceScore >= 0.5 ? 'warning' : 'danger'}>
                {(confidenceScore * 100).toFixed(0)}%
              </Pill>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
