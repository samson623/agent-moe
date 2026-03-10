'use client'

import { useState, useCallback } from 'react'

export interface PublishPayload {
  assetId?: string
  content: string
  contentType: 'post' | 'thread' | 'script' | 'caption' | 'video_concept' | 'cta'
  title?: string
  mediaUrls?: string[]
  hashtags?: string[]
  scheduledAt?: string
  metadata?: Record<string, unknown>
}

export interface PublishResult {
  success: boolean
  platform: string
  externalPostId?: string
  externalPostUrl?: string
  publishedAt?: string
  response?: Record<string, unknown>
  error?: string
  durationMs: number
}

export interface ConnectionTestResult {
  success: boolean
  platform: string
  accountHandle?: string
  accountId?: string
  scopes?: string[]
  error?: string
  latencyMs: number
}

export function usePublish() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublishResult | null>(null)

  const publish = useCallback(async (connectorId: string, input: PublishPayload): Promise<PublishResult> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/connectors/${connectorId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { result?: PublishResult; error?: string }
      if (!res.ok || !json.result) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      setResult(json.result)
      return json.result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Publish failed'
      setError(msg)
      const failResult: PublishResult = { success: false, platform: '', error: msg, durationMs: 0 }
      return failResult
    } finally {
      setLoading(false)
    }
  }, [])

  const testConnection = useCallback(async (connectorId: string): Promise<ConnectionTestResult> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/connectors/${connectorId}/test`, { method: 'POST' })
      const json = await res.json() as { result?: ConnectionTestResult; error?: string }
      if (!res.ok || !json.result) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      return json.result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Test failed'
      setError(msg)
      return { success: false, platform: '', error: msg, latencyMs: 0 }
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(async (connectorId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/connectors/${connectorId}/disconnect`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Disconnect failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { publish, testConnection, disconnect, loading, error, result }
}
