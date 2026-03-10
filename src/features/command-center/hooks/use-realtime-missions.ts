'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Mission, Job } from '@/lib/supabase/types';

interface UseRealtimeMissionsOptions {
  workspaceId: string;
  onMissionChange?: (payload: RealtimePostgresChangesPayload<Mission>) => void;
  onJobChange?: (payload: RealtimePostgresChangesPayload<Job>) => void;
}

export function useRealtimeMissions({
  workspaceId,
  onMissionChange,
  onJobChange,
}: UseRealtimeMissionsOptions): void {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef({ onMissionChange, onJobChange });

  callbacksRef.current = { onMissionChange, onJobChange };

  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`command-center:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          callbacksRef.current.onMissionChange?.(
            payload as RealtimePostgresChangesPayload<Mission>,
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          callbacksRef.current.onJobChange?.(
            payload as RealtimePostgresChangesPayload<Job>,
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [workspaceId]);
}
