'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface TrendScanState {
  isScanning: boolean;
  progress: number;
  statusMessage: string;
  lastScanAt: string | null;
  error: string | null;
}

export interface UseTrendScannerReturn {
  scanState: TrendScanState;
  triggerScan: (topics: string[], platforms?: string[]) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: TrendScanState = {
  isScanning: false,
  progress: 0,
  statusMessage: '',
  lastScanAt: null,
  error: null,
}

export function useTrendScanner(workspaceId: string): UseTrendScannerReturn {
  const [scanState, setScanState] = useState<TrendScanState>(INITIAL_STATE)
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clear all pending timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout)
    }
  }, [])

  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
  }, [])

  const reset = useCallback(() => {
    clearTimeouts()
    setScanState(INITIAL_STATE)
  }, [clearTimeouts])

  const triggerScan = useCallback(async (topics: string[], platforms?: string[]) => {
    clearTimeouts()

    setScanState({
      isScanning: true,
      progress: 0,
      statusMessage: 'Initiating scan...',
      lastScanAt: null,
      error: null,
    })

    try {
      const res = await fetch('/api/trend-signals/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          topics,
          platforms: platforms ?? [],
        }),
      })

      if (!res.ok) {
        throw new Error(`Scan request failed (${res.status})`)
      }

      // UX progress simulation — scan is async server-side
      const steps: Array<{ delay: number; progress: number; message: string }> = [
        { delay: 500,  progress: 15, message: 'Researching topics...' },
        { delay: 2000, progress: 40, message: 'Scoring signals with AI...' },
        { delay: 4000, progress: 65, message: 'Finding market angles...' },
        { delay: 6000, progress: 85, message: 'Ranking opportunities...' },
        { delay: 8000, progress: 100, message: 'Scan complete' },
      ]

      steps.forEach(({ delay, progress, message }) => {
        const id = setTimeout(() => {
          setScanState((prev) => ({
            ...prev,
            progress,
            statusMessage: message,
            isScanning: progress < 100,
            lastScanAt: progress === 100 ? new Date().toISOString() : prev.lastScanAt,
          }))
        }, delay)
        timeoutRefs.current.push(id)
      })
    } catch (err) {
      clearTimeouts()
      setScanState({
        isScanning: false,
        progress: 0,
        statusMessage: '',
        lastScanAt: null,
        error: err instanceof Error ? err.message : 'Scan failed',
      })
    }
  }, [workspaceId, clearTimeouts])

  return { scanState, triggerScan, reset }
}
