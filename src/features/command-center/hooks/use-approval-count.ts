'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseApprovalCountReturn {
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApprovalCount(workspaceId: string): UseApprovalCountReturn {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchCount = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { count: total, error: queryError } = await supabase
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending');

      if (queryError) throw new Error(queryError.message);
      if (!mountedRef.current) return;

      setCount(total ?? 0);
    } catch (err) {
      if (!mountedRef.current) return;
      setError((err as Error).message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [workspaceId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchCount();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCount]);

  return { count, isLoading, error, refetch: fetchCount };
}
