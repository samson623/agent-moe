'use client'

import { useState, useCallback } from 'react'
import type { TrackEventPayload } from '../types'

export interface UseTrackEventReturn {
  track: (payload: TrackEventPayload) => void
  isTracking: boolean
}

export function useTrackEvent(): UseTrackEventReturn {
  const [isTracking, setIsTracking] = useState(false)

  const track = useCallback((payload: TrackEventPayload) => {
    setIsTracking(true)

    // Fire-and-forget: no error propagation, silent failure
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .catch(() => {
        // Silent failure — tracking must never disrupt the UI
      })
      .finally(() => {
        setIsTracking(false)
      })
  }, [])

  return { track, isTracking }
}
