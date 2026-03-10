'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface DashboardStats {
  missions_today: number;
  missions_running: number;
  total_missions: number;
  total_assets: number;
  pending_approvals: number;
  approval_rate: number;
  total_jobs: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardStats(workspaceId: string): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/dashboard/stats?workspace_id=${encodeURIComponent(workspaceId)}`,
        { signal: controller.signal },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch stats (${res.status})`);
      }

      setStats(await res.json());
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchStats();
    return () => abortRef.current?.abort();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}
