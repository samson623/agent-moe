'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TrendSignal } from '../types'

export interface UseRealtimeSignalsOptions {
  workspaceId: string;
  onInsert?: (signal: TrendSignal) => void;
  onUpdate?: (signal: TrendSignal) => void;
  onDelete?: (id: string) => void;
}

export function useRealtimeSignals({
  workspaceId,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeSignalsOptions): void {
  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`trend_signals:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trend_signals',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onInsert?.(payload.new as TrendSignal)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trend_signals',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onUpdate?.(payload.new as TrendSignal)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'trend_signals',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const old = payload.old as { id?: string }
          if (old.id) onDelete?.(old.id)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [workspaceId, onInsert, onUpdate, onDelete])
}
