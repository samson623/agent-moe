'use client'

import { MotionFadeIn } from '@/components/nebula'
import { useVideoFactory } from '../hooks/use-video-factory'
import { VideoFactoryInput } from './VideoFactoryInput'
import { VideoFactoryBatchView } from './VideoFactoryBatchView'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VideoFactoryTabProps {
  workspaceId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoFactoryTab({ workspaceId }: VideoFactoryTabProps) {
  const { state, batchStatus, error, generate, reset } = useVideoFactory(workspaceId)

  return (
    <div className="space-y-6">
      {/* Input form — always visible unless viewing results */}
      {(state === 'idle' || state === 'error') && (
        <MotionFadeIn>
          <VideoFactoryInput
            onGenerate={(topic, duration, tone, platforms) => generate(topic, duration, tone, platforms)}
            generating={false}
          />
        </MotionFadeIn>
      )}

      {/* Generating state — show input as disabled */}
      {state === 'generating' && (
        <MotionFadeIn>
          <VideoFactoryInput
            onGenerate={(topic, duration, tone, platforms) => generate(topic, duration, tone, platforms)}
            generating={true}
          />
        </MotionFadeIn>
      )}

      {/* Error message */}
      {state === 'error' && error && (
        <MotionFadeIn>
          <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/10 text-red-400">
            <p className="text-sm flex-1">{error}</p>
          </div>
        </MotionFadeIn>
      )}

      {/* Batch view — rendering or ready */}
      {batchStatus && (state === 'rendering' || state === 'ready') && (
        <MotionFadeIn>
          <VideoFactoryBatchView
            batchStatus={batchStatus}
            onReset={reset}
          />
        </MotionFadeIn>
      )}
    </div>
  )
}
