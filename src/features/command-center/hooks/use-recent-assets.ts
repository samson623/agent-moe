'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Asset } from '@/lib/supabase/types';

interface RecentAsset {
  id: string;
  title: string | null;
  asset_type: string;
  asset_status: string;
  platform: string;
  confidence_score: number | null;
  created_at: string;
  mission_id: string | null;
}

interface UseRecentAssetsOptions {
  workspaceId: string;
  limit?: number;
}

interface UseRecentAssetsReturn {
  assets: RecentAsset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecentAssets({
  workspaceId,
  limit = 10,
}: UseRecentAssetsOptions): UseRecentAssetsReturn {
  const [assets, setAssets] = useState<RecentAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAssets = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = (await supabase
        .from('assets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit)) as { data: Asset[] | null; error: { message: string } | null };

      if (queryError) throw new Error(queryError.message);
      if (!mountedRef.current) return;

      setAssets(
        (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          asset_type: row.type,
          asset_status: row.status,
          platform: row.platform,
          confidence_score: row.confidence_score,
          created_at: row.created_at,
          mission_id: row.mission_id,
        })),
      );
    } catch (err) {
      if (!mountedRef.current) return;
      setError((err as Error).message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [workspaceId, limit]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAssets();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAssets]);

  return { assets, isLoading, error, refetch: fetchAssets };
}

export type { RecentAsset };
