'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard, StatusBadge } from '@/components/nebula';

interface SystemIntelligencePanelProps {
  workspaceId: string;
}

interface ActivityItem {
  id: string;
  title: string;
  created_at: string;
  status: string;
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 py-2.5 animate-pulse">
      <div className="mt-1.5 size-2 rounded-full bg-[var(--border)] shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-3/4 rounded bg-[var(--border)]" />
        <div className="h-2.5 w-1/3 rounded bg-[var(--border-subtle)]" />
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const statusDotColor: Record<string, string> = {
  running: 'text-[var(--success)]',
  completed: 'text-[var(--primary)]',
  failed: 'text-[var(--danger)]',
  pending: 'text-[var(--warning)]',
};

export function SystemIntelligencePanel({ workspaceId }: SystemIntelligencePanelProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/missions?workspace_id=${workspaceId}&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      // API may return { missions: [...] } or an array directly
      const items: ActivityItem[] = Array.isArray(data) ? data : data.missions ?? [];
      setActivities(items.slice(0, 5));
    } catch {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <SectionCard
      title="System Intelligence"
      subtitle="Real-time activity stream"
      action={
        <StatusBadge label="All systems operational" variant="success" pulse size="sm" />
      }
    >
      {/* ── System Health Indicator ─────────────── */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <Activity size={14} className="text-[var(--success)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Activity Stream
        </span>
      </div>

      {/* ── Activity List ──────────────────────── */}
      <div className="space-y-0.5">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : activities.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-4 text-center">
            No recent activity
          </p>
        ) : (
          activities.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 py-2.5 rounded-[var(--radius-sm)]',
                'transition-colors duration-150 px-1',
                'hover:bg-[var(--surface-elevated)]'
              )}
            >
              <Circle
                size={8}
                className={cn(
                  'mt-1.5 shrink-0 fill-current',
                  statusDotColor[item.status] ?? 'text-[var(--text-muted)]'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text)] truncate">
                  {item.title}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {formatTimeAgo(item.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
