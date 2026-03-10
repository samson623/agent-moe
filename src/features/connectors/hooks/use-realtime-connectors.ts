'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Connector } from './use-connectors'

/**
 * Subscribe to real-time updates on the connectors table for a workspace.
 * Calls onUpdate with a fresh list fetched from the API whenever a change occurs.
 */
export function useRealtimeConnectors(
  workspaceId: string,
  onUpdate: (connectors: Connector[]) => void
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    const fetchFresh = async () => {
      try {
        const res = await fetch('/api/connectors')
        if (res.ok) {
          const json = await res.json() as { connectors: Connector[] }
          onUpdateRef.current(json.connectors ?? [])
        }
      } catch {
        // Silently ignore realtime fetch errors
      }
    }

    const channel = supabase
      .channel(`connectors:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connectors',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetchFresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId])
}
