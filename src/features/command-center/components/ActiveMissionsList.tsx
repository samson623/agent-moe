'use client';

import { useState } from 'react';
import { Activity, ArrowRight, Clock, Pause, Play, Loader2, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Mission {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ActiveMissionsListProps {
  missions: Mission[];
  isLoading: boolean;
  onCancel?: (id: string) => Promise<boolean>;
  onCancelAll?: () => Promise<void>;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string; pulse?: boolean }
> = {
  pending: {
    color: 'bg-[var(--warning)]',
    bg: 'bg-[var(--warning-muted)]',
    label: 'Queued',
  },
  planning: {
    color: 'bg-[var(--primary)]',
    bg: 'bg-[var(--primary-muted)]',
    label: 'Planning',
  },
  running: {
    color: 'bg-[var(--success)]',
    bg: 'bg-[var(--success-muted)]',
    label: 'Running',
    pulse: true,
  },
  paused: {
    color: 'bg-[var(--text-muted)]',
    bg: 'bg-[var(--surface-elevated)]',
    label: 'Paused',
  },
};

const PRIORITY_VARIANT: Record<string, 'muted' | 'default' | 'warning' | 'danger'> = {
  low: 'muted',
  normal: 'default',
  high: 'warning',
  urgent: 'danger',
};

const STATUS_ICON: Record<string, React.ElementType> = {
  pending: Clock,
  planning: Loader2,
  running: Play,
  paused: Pause,
};

const PROGRESS_WIDTH: Record<string, string> = {
  pending: 'w-1/6',
  planning: 'w-2/6',
  running: 'w-4/6',
  paused: 'w-3/6',
};

const DEFAULT_STATUS_CONFIG = {
  color: 'bg-[var(--warning)]',
  bg: 'bg-[var(--warning-muted)]',
  label: 'Queued',
  pulse: false,
} as const;

function MissionRow({ mission, onCancel }: { mission: Mission; onCancel?: (id: string) => Promise<boolean> }) {
  const [cancelling, setCancelling] = useState(false);
  const config = STATUS_CONFIG[mission.status] ?? DEFAULT_STATUS_CONFIG;
  const Icon = STATUS_ICON[mission.status] ?? Clock;
  const priorityVariant = PRIORITY_VARIANT[mission.priority] ?? ('default' as const);
  const progressWidth = PROGRESS_WIDTH[mission.status] ?? 'w-1/6';

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCancel || cancelling) return;
    setCancelling(true);
    await onCancel(mission.id);
    setCancelling(false);
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3',
        'border-b border-[var(--border-subtle)] last:border-none',
        'hover:bg-[var(--surface-hover)] transition-colors duration-100'
      )}
    >
      <div className="relative flex items-center justify-center shrink-0">
        <span
          className={cn(
            'block w-2.5 h-2.5 rounded-full',
            config.color,
            config.pulse && 'animate-pulse-glow'
          )}
        />
        {config.pulse && (
          <span
            className={cn(
              'absolute inset-0 w-2.5 h-2.5 rounded-full',
              config.color,
              'opacity-40 blur-[3px]'
            )}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text)] truncate">
            {mission.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-1 flex-1 max-w-[120px] rounded-full overflow-hidden',
              'bg-[var(--surface-elevated)]'
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                config.color,
                progressWidth,
                config.pulse && 'animate-pulse-glow'
              )}
            />
          </div>
          <div
            className={cn(
              'flex items-center gap-1 text-[10px] font-medium',
              mission.status === 'running'
                ? 'text-[var(--success)]'
                : 'text-[var(--text-muted)]'
            )}
          >
            <Icon size={10} className={cn(mission.status === 'planning' && 'animate-spin')} />
            {config.label}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={priorityVariant} className="text-[10px] capitalize">
          {mission.priority}
        </Badge>
        <span className="text-[10px] text-[var(--text-disabled)] min-w-[48px] text-right">
          {timeAgo(mission.started_at ?? mission.created_at)}
        </span>
        {onCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            title="Cancel mission"
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-md',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
              'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]',
              cancelling && 'opacity-100 animate-spin'
            )}
          >
            {cancelling ? <Loader2 size={12} /> : <X size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] last:border-none">
      <div className="w-2.5 h-2.5 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-[var(--surface-elevated)] animate-pulse" />
        <div className="h-1 w-24 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="h-5 w-14 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
        <div className="h-3 w-10 rounded bg-[var(--surface-elevated)] animate-pulse" />
      </div>
    </div>
  );
}

export function ActiveMissionsList({ missions, isLoading, onCancel, onCancelAll }: ActiveMissionsListProps) {
  const [cancellingAll, setCancellingAll] = useState(false);
  const activeMissions = missions.filter(
    (m) => m.status !== 'completed' && m.status !== 'failed'
  );
  const displayed = activeMissions.slice(0, 8);
  const hasMore = activeMissions.length > 8;

  const handleCancelAll = async () => {
    if (!onCancelAll || cancellingAll) return;
    setCancellingAll(true);
    await onCancelAll();
    setCancellingAll(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-[var(--radius)]',
                'bg-[var(--primary-muted)] border border-[rgba(59,130,246,0.15)]'
              )}
            >
              <Activity size={13} className="text-[var(--primary)]" />
            </div>
            <CardTitle>Active Missions</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && activeMissions.length > 1 && onCancelAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelAll}
                disabled={cancellingAll}
                className="h-7 gap-1.5 text-[10px] text-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]"
              >
                {cancellingAll ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                Cancel All
              </Button>
            )}
            {!isLoading && activeMissions.length > 0 && (
              <Badge variant="default" className="tabular-nums">
                {activeMissions.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-2">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : displayed.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div
              className={cn(
                'mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3',
                'bg-[var(--surface-elevated)] border border-[var(--border-subtle)]'
              )}
            >
              <Activity size={16} className="text-[var(--text-disabled)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">No active missions</p>
            <p className="text-xs text-[var(--text-disabled)] mt-1">
              Launch one above to get started.
            </p>
          </div>
        ) : (
          <>
            {displayed.map((mission) => (
              <MissionRow key={mission.id} mission={mission} onCancel={onCancel} />
            ))}
          </>
        )}

        {hasMore && (
          <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs">
              View all {activeMissions.length} missions
              <ArrowRight size={12} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
