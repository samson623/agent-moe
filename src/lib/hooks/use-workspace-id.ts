'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Workspace } from '@/lib/supabase/types';

let cachedWorkspaceId: string | null = null;

export function useWorkspaceId(): { workspaceId: string | null; isLoading: boolean } {
  const [workspaceId, setWorkspaceId] = useState<string | null>(cachedWorkspaceId);
  const [isLoading, setIsLoading] = useState(cachedWorkspaceId === null);

  useEffect(() => {
    if (cachedWorkspaceId !== null) {
      setWorkspaceId(cachedWorkspaceId);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      (supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .single() as unknown as Promise<{ data: Workspace | null }>)
        .then(({ data }) => {
          const id = data?.id ?? null;
          cachedWorkspaceId = id;
          setWorkspaceId(id);
          setIsLoading(false);
        });
    });
  }, []);

  return { workspaceId, isLoading };
}
