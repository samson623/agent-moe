'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ConnectorStats {
  total: number
  connected: number
  disconnected: number
  error: number
  pending: number
  published_today: number
  total_published: number
}

export function useConnectorStats() {
  const [stats, setStats] = useState<ConnectorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/connectors/stats')
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const json = await res.json() as { stats: ConnectorStats }
      setStats(json.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
