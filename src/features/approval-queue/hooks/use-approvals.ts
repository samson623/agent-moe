'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Approval, ApprovalStatus, RiskLevel } from '@/lib/supabase/types'

export interface ApprovalFilters {
  status?: ApprovalStatus | 'all'
  risk_level?: RiskLevel | 'all'
  mission_id?: string
}

export interface ApprovalStats {
  pending: number
  approved_today: number
  rejected_today: number
  total_reviewed: number
}

const DEFAULT_STATS: ApprovalStats = {
  pending: 0,
  approved_today: 0,
  rejected_today: 0,
  total_reviewed: 0,
}

const PAGE_SIZE = 20

export interface UseApprovalsReturn {
  approvals: Approval[]
  count: number
  stats: ApprovalStats
  isLoading: boolean
  error: string | null
  page: number
  setPage: (page: number) => void
  filters: ApprovalFilters
  setFilter: (filters: ApprovalFilters) => void
  refresh: () => void
}

export function useApprovals(workspaceId: string): UseApprovalsReturn {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [count, setCount] = useState(0)
  const [stats, setStats] = useState<ApprovalStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPageState] = useState(1)
  const [filters, setFilters] = useState<ApprovalFilters>({})
  const abortRef = useRef<AbortController | null>(null)

  const fetchApprovals = useCallback(async () => {
    if (!workspaceId) {
      setApprovals([])
      setCount(0)
      setStats(DEFAULT_STATS)
      setIsLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      })

      if (filters.status && filters.status !== 'all') params.set('status', filters.status)
      if (filters.risk_level && filters.risk_level !== 'all') params.set('risk_level', filters.risk_level)
      if (filters.mission_id) params.set('mission_id', filters.mission_id)

      const res = await fetch(`/api/approvals?${params.toString()}`, {
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      const data = await res.json() as {
        approvals: Approval[]
        count: number
        stats: ApprovalStats
      }

      setApprovals(data.approvals ?? [])
      setCount(data.count ?? 0)
      setStats(data.stats ?? DEFAULT_STATS)
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load approvals')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, filters, page])

  useEffect(() => {
    void fetchApprovals()
    return () => { abortRef.current?.abort() }
  }, [fetchApprovals])

  const setFilter = useCallback((next: ApprovalFilters) => {
    setFilters(next)
    setPageState(1)
  }, [])

  const setPage = useCallback((next: number) => {
    setPageState(next)
  }, [])

  return { approvals, count, stats, isLoading, error, page, setPage, filters, setFilter, refresh: fetchApprovals }
}
