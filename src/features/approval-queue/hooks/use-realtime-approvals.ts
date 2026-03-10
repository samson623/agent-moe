'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeApprovalsOptions {
  workspaceId: string
  onUpdate: () => void
}

export function useRealtimeApprovals({ workspaceId, onUpdate }: UseRealtimeApprovalsOptions): void {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbackRef = useRef(onUpdate)
  callbackRef.current = onUpdate

  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`approvals:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approvals',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => { callbackRef.current() },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [workspaceId])
}
