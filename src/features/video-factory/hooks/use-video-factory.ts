'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoFactoryPackageResult {
  platform: string
  packageId: string
  confidenceScore: number | null
}

export interface VideoFactoryBatchResult {
  batchId: string
  topic: string
  packages: VideoFactoryPackageResult[]
}

export interface VideoFactoryPackageStatus {
  packageId: string
  platform: string
  title: string
  render_status: string
  render_progress: number
  render_url: string | null
  render_error: string | null
  confidence_score: number | null
}

export interface VideoFactoryBatchStatus {
  batchId: string
  status: string
  packages: VideoFactoryPackageStatus[]
}

type FactoryState = 'idle' | 'generating' | 'rendering' | 'ready' | 'error'

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVideoFactory(workspaceId: string) {
  const [state, setState] = useState<FactoryState>('idle')
  const [batch, setBatch] = useState<VideoFactoryBatchResult | null>(null)
  const [batchStatus, setBatchStatus] = useState<VideoFactoryBatchStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // --- Generate batch ---
  const generate = useCallback(
    async (topic: string, durationSeconds: number = 30, tone: string = 'educational', platforms?: string[]) => {
      setState('generating')
      setError(null)
      setBatch(null)
      setBatchStatus(null)

      try {
        const res = await fetch('/api/video-factory/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspaceId,
            topic,
            duration_seconds: durationSeconds,
            tone,
            ...(platforms ? { platforms } : {}),
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Generation failed (${res.status})`)
        }

        const { data } = (await res.json()) as { data: VideoFactoryBatchResult }
        setBatch(data)
        setState('rendering')

        // Start polling for render status
        startPolling(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        setState('error')
      }
    },
    [workspaceId],
  )

  // --- Poll batch status ---
  const startPolling = useCallback(
    (batchData: VideoFactoryBatchResult) => {
      // Clear any existing polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }

      const packageIds = batchData.packages.map((p) => p.packageId).join(',')

      const poll = async () => {
        try {
          const res = await fetch(
            `/api/video-factory/${batchData.batchId}/status?workspace_id=${workspaceId}&package_ids=${packageIds}`,
          )

          if (!res.ok) return

          const data = (await res.json()) as VideoFactoryBatchStatus
          setBatchStatus(data)

          // Stop polling when all renders are done (completed or failed)
          if (data.status === 'ready_for_review' || data.status === 'failed' || data.status === 'partially_failed') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
            setState(data.status === 'failed' ? 'error' : 'ready')
          }
        } catch {
          // Polling failure is non-fatal — will retry on next interval
        }
      }

      // Poll immediately, then every 3 seconds
      poll()
      pollingRef.current = setInterval(poll, 3000)
    },
    [workspaceId],
  )

  // --- Reset ---
  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setState('idle')
    setBatch(null)
    setBatchStatus(null)
    setError(null)
  }, [])

  return {
    state,
    batch,
    batchStatus,
    error,
    generate,
    reset,
  }
}
