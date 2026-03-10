'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Connector, ConnectorPlatform } from './use-connectors'

export type PublishLogStatus = 'success' | 'failed' | 'pending' | 'cancelled'

export interface PublishingLog {
  id: string
  workspace_id: string
  connector_id: string
  asset_id: string | null
  platform: ConnectorPlatform
  status: PublishLogStatus
  external_post_id: string | null
  external_post_url: string | null
  payload: Record<string, unknown>
  response: Record<string, unknown>
  error_message: string | null
  published_at: string | null
  created_at: string
}

export function useConnectorDetail(id: string | null) {
  const [connector, setConnector] = useState<Connector | null>(null)
  const [logs, setLogs] = useState<PublishingLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [connRes, logsRes] = await Promise.all([
        fetch(`/api/connectors/${id}`),
        fetch(`/api/connectors/${id}/logs`),
      ])

      if (!connRes.ok) {
        const json = await connRes.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${connRes.status}`)
      }

      const connJson = await connRes.json() as { connector: Connector }
      setConnector(connJson.connector)

      if (logsRes.ok) {
        const logsJson = await logsRes.json() as { logs: PublishingLog[] }
        setLogs(logsJson.logs ?? [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connector')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return { connector, logs, loading, error, refetch: fetch_ }
}
