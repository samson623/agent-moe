'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Wifi, WifiOff, Radio, MonitorPlay, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLiveBrowserStream } from '../hooks/use-live-browser-stream'
import type { LiveStreamFrame, LiveStreamStatus, LiveStreamStep } from '../hooks/use-live-browser-stream'

interface LiveBrowserViewProps {
  taskId: string
  enabled?: boolean
  className?: string
}

const STATUS_CONFIG: Record<LiveStreamStatus, { icon: React.ElementType; label: string; color: string }> = {
  idle:       { icon: MonitorPlay, label: 'Waiting',      color: '#6b7280' },
  connecting: { icon: Wifi,        label: 'Connecting...', color: '#f59e0b' },
  connected:  { icon: Radio,       label: 'Live',          color: '#10b981' },
  ended:      { icon: MonitorPlay, label: 'Stream Ended',  color: '#6b7280' },
  error:      { icon: WifiOff,     label: 'Disconnected',  color: '#ef4444' },
}

export function LiveBrowserView({ taskId, enabled = true, className }: LiveBrowserViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fpsTimestampsRef = useRef<number[]>([])
  const [fps, setFps] = useState(0)
  const [resolution, setResolution] = useState<{ w: number; h: number } | null>(null)

  // Track FPS
  const handleFrame = useCallback((frame: LiveStreamFrame) => {
    const now = Date.now()
    const timestamps = fpsTimestampsRef.current
    timestamps.push(now)

    // Keep only last 2 seconds of timestamps
    while (timestamps.length > 0 && timestamps[0]! < now - 2000) {
      timestamps.shift()
    }

    // Calculate FPS from timestamps in window
    setFps(Math.round(timestamps.length / 2))

    if (frame.width && frame.height) {
      setResolution({ w: frame.width, h: frame.height })
    }
  }, [])

  const {
    status,
    latestFrame,
    frameCount,
    streamInfo,
    error,
    reconnect,
    steps,
    latestStep,
  } = useLiveBrowserStream({
    taskId,
    enabled,
    onFrame: handleFrame,
  })

  // Draw frame to canvas
  useEffect(() => {
    if (!latestFrame || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      // Resize canvas to match image dimensions
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width
        canvas.height = img.height
      }
      ctx.drawImage(img, 0, 0)
    }
    img.src = `data:image/${streamInfo.format ?? 'jpeg'};base64,${latestFrame.base64}`
  }, [latestFrame, streamInfo.format])

  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon

  return (
    <div className={cn('relative rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden bg-black', className)}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-auto block"
        style={{ minHeight: 200, aspectRatio: `${streamInfo.maxWidth ?? 1280} / ${streamInfo.maxHeight ?? 720}` }}
      />

      {/* Status overlay — shown when not connected or no frames yet */}
      {(status !== 'connected' || frameCount === 0) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <StatusIcon
            size={32}
            style={{ color: statusConfig.color }}
            className={status === 'connecting' ? 'animate-pulse' : ''}
          />
          <p
            className="text-sm font-semibold mt-3"
            style={{ color: statusConfig.color }}
          >
            {statusConfig.label}
          </p>

          {error && (
            <p className="text-xs text-[#ef4444] mt-2 max-w-xs text-center px-4">
              {error}
            </p>
          )}

          {(status === 'error' || status === 'ended') && (
            <button
              onClick={reconnect}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] transition-colors bg-[var(--surface)]"
            >
              <RefreshCw size={12} />
              Reconnect
            </button>
          )}
        </div>
      )}

      {/* Live indicator badge — top left */}
      {status === 'connected' && frameCount > 0 && (
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
          style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          LIVE
        </div>
      )}

      {/* Step overlay — bottom-left, shows latest AI action */}
      {latestStep && status === 'connected' && (
        <div
          className="absolute bottom-10 left-3 right-3 max-w-md rounded-[8px] px-3 py-2 text-xs backdrop-blur-md transition-all"
          style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-4 h-4 rounded-full bg-[rgba(168,85,247,0.3)] text-[#a855f7] flex items-center justify-center text-[10px] font-bold">
              {latestStep.step}
            </span>
            <span className="font-semibold text-[#a855f7] capitalize">
              {latestStep.action.replace('_', ' ')}
            </span>
            {latestStep.duration_ms !== undefined && (
              <span className="text-gray-400 ml-auto">{(latestStep.duration_ms / 1000).toFixed(1)}s</span>
            )}
          </div>
          {latestStep.reasoning && (
            <p className="text-gray-300 leading-tight line-clamp-2 pl-6">
              {latestStep.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Info bar — bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 text-xs backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-3 text-gray-300">
          <span>Frames: <span className="text-white font-semibold">{frameCount}</span></span>
          {steps.length > 0 && (
            <span>Steps: <span className="text-white font-semibold">{steps.length}</span></span>
          )}
          {fps > 0 && (
            <span>FPS: <span className="text-white font-semibold">{fps}</span></span>
          )}
          {resolution && (
            <span>{resolution.w}x{resolution.h}</span>
          )}
        </div>

        {streamInfo.totalFrames !== undefined && (
          <span className="text-gray-400">Total: {streamInfo.totalFrames} frames</span>
        )}
      </div>
    </div>
  )
}
