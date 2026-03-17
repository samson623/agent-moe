'use client'

import React from 'react'
import { Film, Download, RefreshCw, AlertTriangle, Play } from 'lucide-react'
import { useRenderVideo } from '../hooks/use-render-video'
import { RenderProgressBar } from './RenderProgressBar'
import { getPlatformConfig, calculateTotalDuration } from '../remotion/lib/platform-config'

interface RenderVideoPanelProps {
  videoPackageId: string
  workspaceId: string
  platform: string
  sceneDurations: number[]
  metadata: Record<string, unknown>
}

export function RenderVideoPanel({
  videoPackageId,
  workspaceId,
  platform,
  sceneDurations,
  metadata,
}: RenderVideoPanelProps) {
  const { status, progress, url, error, renderedAt, durationMs, triggerRender } = useRenderVideo(
    videoPackageId,
    workspaceId,
    metadata,
  )

  const platformConfig = getPlatformConfig(platform)
  const totalSeconds = calculateTotalDuration(sceneDurations)

  return (
    <div className="rounded-[var(--radius-lg)] border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)]/10">
          <Film className="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Video Render</h3>
          <p className="text-xs text-[var(--text-muted)]">
            {platformConfig.label} &middot; {platformConfig.width}x{platformConfig.height}{' '}
            &middot; ~{Math.round(totalSeconds)}s
          </p>
        </div>
      </div>

      {status === 'idle' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Render this video package as an MP4 file ready for publishing.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            This step only creates the MP4. Direct platform upload or sharing is not wired
            into the video render flow yet.
          </p>
          <button
            onClick={triggerRender}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            <Play className="h-4 w-4" />
            Render Video
          </button>
        </div>
      )}

      {status === 'rendering' && (
        <div className="space-y-4">
          <RenderProgressBar progress={progress} />
          <p className="text-xs text-[var(--text-muted)]">
            This may take 30-90 seconds. You can navigate away - the render continues in the
            background.
          </p>
        </div>
      )}

      {status === 'completed' && url && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[var(--radius)] border border-white/[0.06]">
            <video src={url} controls className="w-full" style={{ maxHeight: '400px' }} />
          </div>

          <div className="flex items-center gap-3">
            <a
              href={url}
              download={`${videoPackageId}.mp4`}
              className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
            >
              <Download className="h-4 w-4" />
              Download MP4
            </a>
            <button
              onClick={triggerRender}
              className="flex items-center gap-2 rounded-[var(--radius)] border border-white/[0.08] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/[0.04]"
            >
              <RefreshCw className="h-4 w-4" />
              Re-render
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            The rendered file is stored for preview and download. Publishing this MP4 to
            YouTube, TikTok, or other platforms is not implemented in this screen yet.
          </p>

          <div className="flex gap-4 text-xs text-[var(--text-muted)]">
            {renderedAt && <span>Rendered {new Date(renderedAt).toLocaleString()}</span>}
            {durationMs && <span>Took {(durationMs / 1000).toFixed(1)}s</span>}
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-[var(--radius)] border border-red-500/20 bg-red-500/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error ?? 'Render failed'}</p>
          </div>
          <button
            onClick={triggerRender}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Render
          </button>
        </div>
      )}
    </div>
  )
}
