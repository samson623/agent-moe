'use client'

import { useCallback, useState } from 'react'

type Decision = 'approved' | 'rejected' | 'revision_requested'

export interface UseApprovalActionsReturn {
  decide: (id: string, decision: Decision, notes?: string) => Promise<boolean>
  isDeciding: boolean
  error: string | null
}

export function useApprovalActions(): UseApprovalActionsReturn {
  const [isDeciding, setIsDeciding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const decide = useCallback(
    async (id: string, decision: Decision, notes?: string): Promise<boolean> => {
      setIsDeciding(true)
      setError(null)

      try {
        const res = await fetch(`/api/approvals/${id}/decide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, notes }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(body.error ?? `Decision failed (${res.status})`)
        }

        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit decision')
        return false
      } finally {
        setIsDeciding(false)
      }
    },
    [],
  )

  return { decide, isDeciding, error }
}
