'use client';

import { useCallback } from 'react';
import { AlertTriangle, Activity, Zap, Target, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  useMissions,
  useDashboardStats,
  useRealtimeMissions,
  useRecentAssets,
  useApprovalCount,
} from '../hooks';
import { MissionInput } from './MissionInput';
import { ActiveMissionsList } from './ActiveMissionsList';
import { RecentAssetsFeed } from './RecentAssetsFeed';
import { SystemHealthPanel } from './SystemHealthPanel';

interface CommandCenterPageProps {
  workspaceId: string | null;
}

function NoWorkspaceBanner() {
  return (
    <div className="p-6 md:p-8">
      <div
        className={cn(
          'flex items-center gap-4 rounded-[var(--radius)] border px-5 py-4',
          'border-[var(--warning-muted)] bg-[var(--warning-subtle)]'
        )}
      >
        <AlertTriangle size={18} className="shrink-0 text-[var(--warning)]" />
        <div>
          <p className="text-sm font-medium text-[var(--text)]">No workspace found</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Sign in and create a workspace to start using the Command Center.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: 'default' | 'success' | 'warning' | 'accent';
}) {
  const toneStyles = {
    default: 'text-[var(--primary)]',
    success: 'text-[var(--success)]',
    warning: 'text-[var(--warning)]',
    accent: 'text-[var(--accent)]',
  };

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={toneStyles[tone]} />
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-[var(--text)] tabular-nums">
        {value}
      </p>
    </div>
  );
}

function CommandCenterContent({ workspaceId }: { workspaceId: string }) {
  const {
    missions,
    isLoading: missionsLoading,
    createMission,
    isCreating,
    refetch: refetchMissions,
  } = useMissions({ workspaceId });

  const {
    stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useDashboardStats(workspaceId);

  const { assets, isLoading: assetsLoading, refetch: refetchAssets } =
    useRecentAssets({ workspaceId });

  const { count: approvalCount, isLoading: approvalsLoading } =
    useApprovalCount(workspaceId);

  const handleRealtimeChange = useCallback(() => {
    refetchMissions();
    refetchStats();
    refetchAssets();
  }, [refetchMissions, refetchStats, refetchAssets]);

  useRealtimeMissions({
    workspaceId,
    onMissionChange: handleRealtimeChange,
    onJobChange: handleRealtimeChange,
  });

  const handleCreateMission = useCallback(
    async (title: string, description?: string) => {
      await createMission(title, description, 'normal');
      await refetchStats();
    },
    [createMission, refetchStats],
  );

  const healthStats = stats
    ? {
        missions_running: stats.missions_running,
        total_jobs: stats.total_jobs,
        pending_approvals: stats.pending_approvals,
      }
    : null;

  return (
    <div className="space-y-5 p-5 md:p-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox
          label="Total Missions"
          value={statsLoading ? '...' : stats?.total_missions ?? 0}
          icon={Target}
        />
        <StatBox
          label="Running"
          value={statsLoading ? '...' : stats?.missions_running ?? 0}
          icon={Zap}
          tone="success"
        />
        <StatBox
          label="Total Jobs"
          value={statsLoading ? '...' : stats?.total_jobs ?? 0}
          icon={Activity}
          tone="accent"
        />
        <StatBox
          label="Pending Approvals"
          value={approvalsLoading ? '...' : approvalCount}
          icon={Clock}
          tone={approvalCount > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Mission input */}
      <MissionInput onSubmit={handleCreateMission} isSubmitting={isCreating} />

      {/* System health */}
      <SystemHealthPanel stats={healthStats} isLoading={statsLoading} />

      {/* Two-column: missions + assets */}
      <div className="grid gap-5 xl:grid-cols-2">
        <ActiveMissionsList missions={missions} isLoading={missionsLoading} />
        <RecentAssetsFeed assets={assets} isLoading={assetsLoading} />
      </div>

      {/* Approval status */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-elevated)]">
              <CheckCircle2
                size={16}
                className={approvalCount > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Approval Queue</p>
              <p className="text-xs text-[var(--text-muted)]">
                {approvalsLoading
                  ? 'Checking...'
                  : approvalCount === 0
                    ? 'No items waiting for approval'
                    : `${approvalCount} item${approvalCount !== 1 ? 's' : ''} staged for review`}
              </p>
            </div>
          </div>
          <Badge variant={approvalCount > 0 ? 'warning' : 'success'}>
            {approvalsLoading ? 'Syncing' : approvalCount > 0 ? `${approvalCount} pending` : 'Clear'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export function CommandCenterPage({ workspaceId }: CommandCenterPageProps) {
  if (!workspaceId) {
    return <NoWorkspaceBanner />;
  }

  return <CommandCenterContent workspaceId={workspaceId} />;
}
