'use client'

import { useState, useCallback } from 'react'

type BulkAction = 'approve' | 'reject' | 'archive' | 'duplicate' | 'publish'

interface UseBulkActionsReturn {
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
  selectionCount: number
  executeBulkAction: (action: BulkAction, workspaceId: string) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function useBulkActions(): UseBulkActionsReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  )

  const executeBulkAction = useCallback(
    async (action: BulkAction, workspaceId: string): Promise<boolean> => {
      if (selectedIds.size === 0) return false

      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/assets/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspaceId,
            asset_ids: Array.from(selectedIds),
            action,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Bulk action failed (${res.status})`)
        }

        clearSelection()
        return true
      } catch (err) {
        setError((err as Error).message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [selectedIds, clearSelection],
  )

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    selectionCount: selectedIds.size,
    executeBulkAction,
    loading,
    error,
  }
}
