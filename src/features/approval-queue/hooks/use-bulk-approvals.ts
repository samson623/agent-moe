'use client'

import { useCallback, useState } from 'react'

type BatchDecision = 'approved' | 'rejected'

export interface UseBulkApprovalsReturn {
  selected: Set<string>
  toggle: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  batchDecide: (decision: BatchDecision, notes?: string) => Promise<boolean>
  isBatchPending: boolean
  batchError: string | null
}

export function useBulkApprovals(): UseBulkApprovalsReturn {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isBatchPending, setIsBatchPending] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelected(new Set(ids))
  }, [])

  const clearSelection = useCallback(() => {
    setSelected(new Set())
  }, [])

  const batchDecide = useCallback(
    async (decision: BatchDecision, notes?: string): Promise<boolean> => {
      if (selected.size === 0) return false

      setIsBatchPending(true)
      setBatchError(null)

      try {
        const res = await fetch('/api/approvals/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selected), decision, notes }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(body.error ?? `Batch failed (${res.status})`)
        }

        clearSelection()
        return true
      } catch (err) {
        setBatchError(err instanceof Error ? err.message : 'Batch decision failed')
        return false
      } finally {
        setIsBatchPending(false)
      }
    },
    [selected, clearSelection],
  )

  return { selected, toggle, selectAll, clearSelection, batchDecide, isBatchPending, batchError }
}
