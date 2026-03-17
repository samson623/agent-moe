'use client'

import { CheckCircle2, Loader2, AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MotionStagger, MotionStaggerItem } from '@/components/nebula'
import { VideoFactoryCard } from './VideoFactoryCard'
import type { VideoFactoryBatchStatus } from '../hooks/use-video-factory'

interface VideoFactoryBatchViewProps {
  batchStatus: VideoFactoryBatchStatus
  onReset: () => void
}

function BatchStatusBanner({ status }: { status: string }) {
  if (status === 'rendering') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--primary)]/10 border border-[var(--primary)]/20">
        <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
        <span className="text-sm text-[var(--primary)] font-medium">Rendering videos...</span>
      </div>
    )
  }

  if (status === 'ready_for_review') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 size={14} className="text-emerald-400" />
        <span className="text-sm text-emerald-400 font-medium">All 3 videos ready for review</span>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/20">
        <AlertTriangle size={14} className="text-red-400" />
        <span className="text-sm text-red-400 font-medium">All renders failed</span>
      </div>
    )
  }

  if (status === 'partially_failed') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle size={14} className="text-amber-400" />
        <span className="text-sm text-amber-400 font-medium">
          Some renders failed - review available videos
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--surface-solid)] border border-[var(--border)]">
      <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
      <span className="text-sm text-[var(--text-muted)]">Generating...</span>
    </div>
  )
}

export function VideoFactoryBatchView({ batchStatus, onReset }: VideoFactoryBatchViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <BatchStatusBanner status={batchStatus.status} />
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-xs shrink-0">
          <RotateCcw size={12} />
          New Batch
        </Button>
      </div>

      <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {batchStatus.packages.map((pkg) => (
          <MotionStaggerItem key={pkg.packageId}>
            <VideoFactoryCard
              platform={pkg.platform}
              title={pkg.title}
              renderStatus={pkg.render_status}
              renderProgress={pkg.render_progress}
              renderUrl={pkg.render_url}
              renderError={pkg.render_error}
              confidenceScore={pkg.confidence_score}
              packageId={pkg.packageId}
            />
          </MotionStaggerItem>
        ))}
      </MotionStagger>
    </div>
  )
}
