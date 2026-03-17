'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Mission } from '@/lib/supabase/types';

interface UseMissionsOptions {
  workspaceId: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface UseMissionsReturn {
  missions: Mission[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createMission: (title: string, description?: string, priority?: string) => Promise<Mission | null>;
  isCreating: boolean;
  cancelMission: (id: string) => Promise<boolean>;
  cancelAllActive: () => Promise<void>;
}

export function useMissions({
  workspaceId,
  status,
  page = 1,
  limit = 20,
}: UseMissionsOptions): UseMissionsReturn {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchMissions = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set('status', status);

      const res = await fetch(`/api/missions?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch missions (${res.status})`);
      }

      const data = await res.json();
      setMissions(data.missions ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [workspaceId, status, page, limit]);

  useEffect(() => {
    fetchMissions();
    return () => abortRef.current?.abort();
  }, [fetchMissions]);

  const createMission = useCallback(
    async (title: string, description?: string, priority?: string): Promise<Mission | null> => {
      setIsCreating(true);
      setError(null);

      try {
        const res = await fetch('/api/missions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspaceId,
            title,
            description,
            priority,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to create mission (${res.status})`);
        }

        const { mission } = await res.json();
        await fetchMissions();

        return mission;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [workspaceId, fetchMissions],
  );

  const cancelMission = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch(`/api/missions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed' }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to cancel mission (${res.status})`);
        }
        await fetchMissions();
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    },
    [fetchMissions],
  );

  const cancelAllActive = useCallback(async () => {
    setError(null);
    const active = missions.filter(
      (m) => m.status !== 'completed' && m.status !== 'failed',
    );
    await Promise.all(active.map((m) => cancelMission(m.id)));
  }, [missions, cancelMission]);

  return { missions, total, isLoading, error, refetch: fetchMissions, createMission, isCreating, cancelMission, cancelAllActive };
}
