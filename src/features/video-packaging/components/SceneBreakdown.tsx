'use client'

import { cn } from '@/lib/utils'
import type { VideoScene } from '../hooks/use-video-packages'

interface SceneBreakdownProps {
  scenes: VideoScene[]
}

export function SceneBreakdown({ scenes: rawScenes }: SceneBreakdownProps) {
  const scenes = [...rawScenes].sort((a, b) => a.order - b.order)
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration_seconds, 0)

  return (
    <div className="space-y-3">
      {scenes.map((scene) => (
        <div
          key={scene.order}
          className={cn(
            'flex gap-4 p-4 rounded-[var(--radius-lg)]',
            'bg-[var(--surface-elevated)] border border-[var(--border)]',
            'hover:border-[var(--border)] transition-colors duration-150',
          )}
        >
          {/* Order number */}
          <div className="shrink-0 flex flex-col items-center pt-0.5">
            <span
              className="text-2xl font-black tabular-nums leading-none"
              style={{ color: 'var(--accent)' }}
            >
              {String(scene.order).padStart(2, '0')}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[var(--text)] truncate">
                {scene.title}
              </h4>
              <span
                className={cn(
                  'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums',
                  'bg-[var(--surface)] border border-[var(--border-subtle)]',
                  'text-[var(--text-secondary)]',
                )}
              >
                {scene.duration_seconds}s
              </span>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {scene.script}
            </p>

            <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
              🎬 {scene.visual_direction}
            </p>
          </div>
        </div>
      ))}

      {/* Total duration footer */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 rounded-[var(--radius)]',
          'bg-[var(--surface)] border border-[var(--border-subtle)]',
        )}
      >
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''} total
        </span>
        <span className="text-sm font-bold text-[var(--text)] tabular-nums">
          {totalDuration}s{' '}
          <span className="text-xs font-normal text-[var(--text-muted)]">
            ({Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')})
          </span>
        </span>
      </div>
    </div>
  )
}
