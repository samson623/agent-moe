'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type LiveStreamStatus = 'idle' | 'connecting' | 'connected' | 'ended' | 'error'

export interface LiveStreamFrame {
  base64: string
  frameNumber: number
  timestamp?: number
  width: number
  height: number
}

export interface LiveStreamInfo {
  format?: string
  maxWidth?: number
  maxHeight?: number
  totalFrames?: number
}

interface UseLiveBrowserStreamOptions {
  /** Task ID to stream */
  taskId: string
  /** Whether to connect (set false to disable) */
  enabled?: boolean
  /** Callback for each new frame */
  onFrame?: (frame: LiveStreamFrame) => void
}

interface UseLiveBrowserStreamReturn {
  status: LiveStreamStatus
  latestFrame: LiveStreamFrame | null
  frameCount: number
  streamInfo: LiveStreamInfo
  error: string | null
  /** Manually reconnect */
  reconnect: () => void
  /** Manually disconnect */
  disconnect: () => void
}

export function useLiveBrowserStream({
  taskId,
  enabled = true,
  onFrame,
}: UseLiveBrowserStreamOptions): UseLiveBrowserStreamReturn {
  const [status, setStatus] = useState<LiveStreamStatus>('idle')
  const [latestFrame, setLatestFrame] = useState<LiveStreamFrame | null>(null)
  const [frameCount, setFrameCount] = useState(0)
  const [streamInfo, setStreamInfo] = useState<LiveStreamInfo>({})
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    // Clean up existing connection
    disconnect()

    if (!taskId || !enabled) {
      setStatus('idle')
      return
    }

    setStatus('connecting')
    setError(null)
    setFrameCount(0)
    setLatestFrame(null)
    setStreamInfo({})

    const es = new EventSource(`/api/browser-tasks/${taskId}/live`)
    eventSourceRef.current = es

    es.addEventListener('frame', (event: MessageEvent) => {
      try {
        const frame: LiveStreamFrame = JSON.parse(event.data)
        setLatestFrame(frame)
        setFrameCount(frame.frameNumber)
        onFrameRef.current?.(frame)
      } catch {
        // Malformed frame data, skip
      }
    })

    es.addEventListener('status', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>

        if (data.status === 'connected') {
          setStatus('connected')
          setStreamInfo({
            format: data.format as string | undefined,
            maxWidth: data.maxWidth as number | undefined,
            maxHeight: data.maxHeight as number | undefined,
          })
        } else if (data.status === 'ended') {
          setStatus('ended')
          setStreamInfo((prev) => ({
            ...prev,
            totalFrames: data.totalFrames as number | undefined,
          }))
          es.close()
          eventSourceRef.current = null
        }
      } catch {
        // Malformed status data
      }
    })

    es.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>
        setError(data.message as string)
        setStatus('error')
      } catch {
        // SSE-level error event (not our custom error)
      }
      es.close()
      eventSourceRef.current = null
    })

    // Native EventSource error (connection lost, etc.)
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        // Only set error if we weren't already in 'ended' state
        setStatus((prev) => (prev === 'ended' ? prev : 'error'))
        eventSourceRef.current = null
      }
    }
  }, [taskId, enabled, disconnect])

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && taskId) {
      connect()
    } else {
      disconnect()
      setStatus('idle')
    }

    return () => {
      disconnect()
    }
  }, [taskId, enabled, connect, disconnect])

  return {
    status,
    latestFrame,
    frameCount,
    streamInfo,
    error,
    reconnect: connect,
    disconnect,
  }
}
