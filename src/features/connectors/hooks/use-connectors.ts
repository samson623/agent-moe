'use client'

import { useState, useEffect, useCallback } from 'react'

export type ConnectorPlatform = 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube' | 'email' | 'notion' | 'airtable' | 'webhook'
export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'pending'

export interface Connector {
  id: string
  workspace_id: string
  platform: ConnectorPlatform
  name: string
  status: ConnectorStatus
  config: Record<string, unknown>
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export function useConnectors() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConnectors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/connectors')
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const json = await res.json() as { connectors: Connector[] }
      setConnectors(json.connectors ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connectors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnectors()
  }, [fetchConnectors])

  return { connectors, loading, error, refetch: fetchConnectors }
}
