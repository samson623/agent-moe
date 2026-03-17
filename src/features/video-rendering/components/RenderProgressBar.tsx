'use client'

import React from 'react'

interface RenderProgressBarProps {
  progress: number // 0-100
}

export function RenderProgressBar({ progress }: RenderProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">Rendering video...</span>
        <span className="font-mono text-[var(--text-primary)]">{progress}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
          }}
        />
      </div>
    </div>
  )
}
