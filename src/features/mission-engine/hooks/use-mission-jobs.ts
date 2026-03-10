'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Job } from '@/lib/supabase/types'

interface UseMissionJobsState {
  jobs: Job[]
  isLoading: boolean
  error: string | null
}

interface UseMissionJobsReturn extends UseMissionJobsState {
  refetch: () => Promise<void>
}

export function useMissionJobs(
  workspaceId: string,
  missionId: string,
): UseMissionJobsReturn {
  const [state, setState] = useState<UseMissionJobsState>({
    jobs: [],
    isLoading: false,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const fetchJobs = useCallback(async () => {
    if (!workspaceId || !missionId) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        mission_id: missionId,
      })

      const res = await fetch(`/api/jobs?${params.toString()}`, {
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Failed to fetch jobs (${res.status})`)
      }

      const data = await res.json() as { jobs?: Job[] }
      setState({ jobs: data.jobs ?? [], isLoading: false, error: null })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
    }
  }, [workspaceId, missionId])

  useEffect(() => {
    void fetchJobs()
    return () => { abortRef.current?.abort() }
  }, [fetchJobs])

  return { ...state, refetch: fetchJobs }
}
