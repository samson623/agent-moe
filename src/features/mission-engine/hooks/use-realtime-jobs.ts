'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeJobs(missionId: string, onUpdate: () => void): void {
  const channelRef = useRef<RealtimeChannel | null>(null)
  // Keep onUpdate stable inside the effect without forcing resubscription
  const onUpdateRef = useRef<() => void>(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!missionId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`jobs-${missionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `mission_id=eq.${missionId}`,
        },
        () => {
          onUpdateRef.current()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [missionId])
}
