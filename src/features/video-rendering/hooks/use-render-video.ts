'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export type RenderStatus = 'idle' | 'rendering' | 'completed' | 'failed'

export interface RenderState {
  status: RenderStatus
  progress: number
  url: string | null
  error: string | null
  renderedAt: string | null
  durationMs: number | null
}

interface UseRenderVideoReturn extends RenderState {
  triggerRender: () => Promise<void>
  isPolling: boolean
}

const POLL_INTERVAL = 2000

export function useRenderVideo(
  videoPackageId: string,
  workspaceId: string,
  initialMetadata?: Record<string, unknown>,
): UseRenderVideoReturn {
  const [state, setState] = useState<RenderState>(() => ({
    status: (initialMetadata?.render_status as RenderStatus) ?? 'idle',
    progress: (initialMetadata?.render_progress as number) ?? 0,
    url: (initialMetadata?.render_url as string) ?? null,
    error: (initialMetadata?.render_error as string) ?? null,
    renderedAt: (initialMetadata?.rendered_at as string) ?? null,
    durationMs: (initialMetadata?.render_duration_ms as number) ?? null,
  }))

  const [isPolling, setIsPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setIsPolling(false)
  }, [])

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/video-packages/${videoPackageId}/render?workspace_id=${workspaceId}`)
      if (!res.ok) return

      const data = await res.json()

      setState({
        status: data.render_status ?? 'idle',
        progress: data.render_progress ?? 0,
        url: data.render_url ?? null,
        error: data.render_error ?? null,
        renderedAt: data.rendered_at ?? null,
        durationMs: data.render_duration_ms ?? null,
      })

      if (data.render_status === 'completed' || data.render_status === 'failed') {
        stopPolling()
      }
    } catch {
      // Try again on the next interval.
    }
  }, [videoPackageId, workspaceId, stopPolling])

  const startPolling = useCallback(() => {
    stopPolling()
    setIsPolling(true)
    pollRef.current = setInterval(poll, POLL_INTERVAL)
  }, [poll, stopPolling])

  const triggerRender = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      status: 'rendering',
      progress: 0,
      error: null,
    }))

    try {
      const res = await fetch(`/api/video-packages/${videoPackageId}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setState((prev) => ({
          ...prev,
          status: 'failed',
          error: data.error ?? 'Failed to start render',
        }))
        return
      }

      startPolling()
    } catch {
      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: 'Network error - could not reach render API',
      }))
    }
  }, [videoPackageId, workspaceId, startPolling])

  useEffect(() => {
    if (state.status === 'rendering') {
      startPolling()
    }

    return stopPolling
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    triggerRender,
    isPolling,
  }
}
