'use client'

import { useState, useCallback } from 'react'

export interface ExecutionResult {
  jobsExecuted: number
  jobsCompleted: number
  jobsFailed: number
  finalStatus: string
}

interface UseJobExecutionState {
  isExecuting: boolean
  error: string | null
  lastResult: ExecutionResult | null
}

interface UseJobExecutionReturn extends UseJobExecutionState {
  executeJob: (jobId: string) => Promise<void>
}

export function useJobExecution(workspaceId: string): UseJobExecutionReturn {
  const [state, setState] = useState<UseJobExecutionState>({
    isExecuting: false,
    error: null,
    lastResult: null,
  })

  const executeJob = useCallback(
    async (jobId: string): Promise<void> => {
      if (!workspaceId || !jobId) return

      setState(prev => ({ ...prev, isExecuting: true, error: null }))

      try {
        const res = await fetch(`/api/jobs/${jobId}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: workspaceId }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(body.error ?? `Execution failed (${res.status})`)
        }

        const data = await res.json() as ExecutionResult
        setState({ isExecuting: false, error: null, lastResult: data })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Job execution failed'
        setState(prev => ({ ...prev, isExecuting: false, error: message }))
      }
    },
    [workspaceId],
  )

  return { ...state, executeJob }
}
