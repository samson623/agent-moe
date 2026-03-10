'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BrowserTask } from '../types'

export interface UseRealtimeBrowserTasksOptions {
  workspaceId: string
  onInsert?: (task: BrowserTask) => void
  onUpdate?: (task: BrowserTask) => void
  onDelete?: (id: string) => void
}

export function useRealtimeBrowserTasks({
  workspaceId,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeBrowserTasksOptions): void {
  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`browser_tasks:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'browser_tasks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onInsert?.(payload.new as BrowserTask)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'browser_tasks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onUpdate?.(payload.new as BrowserTask)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'browser_tasks',
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
