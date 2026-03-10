'use client';

import { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
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
import { QuickStatsCards } from './QuickStatsCards';
import { SystemHealthPanel } from './SystemHealthPanel';

interface CommandCenterPageProps {
  workspaceId: string | null;
}

function NoWorkspaceBanner() {
  return (
    <div className="p-6">
      <div
        className={cn(
          'flex items-center gap-4 px-6 py-5 rounded-[var(--radius-lg)]',
          'bg-[var(--warning-muted)] border border-[rgba(245,158,11,0.2)]'
        )}
      >
        <AlertTriangle size={20} className="text-[var(--warning)] shrink-0" />
        <div>
          <p className="text-sm font-medium text-[var(--text)]">
            No workspace found
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Sign in and create a workspace to start using the Command Center.
            Check your Supabase auth setup if you&apos;re already signed in.
          </p>
        </div>
      </div>
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

  return (
    <div className="p-7 space-y-8">
      <QuickStatsCards stats={stats} isLoading={statsLoading} />

      <MissionInput onSubmit={handleCreateMission} isSubmitting={isCreating} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-6">
          <ActiveMissionsList missions={missions} isLoading={missionsLoading} />
          <RecentAssetsFeed assets={assets} isLoading={assetsLoading} />
        </div>

        <div className="space-y-6">
          <SystemHealthPanel
            stats={
              stats
                ? {
                    missions_running: stats.missions_running,
                    total_jobs: stats.total_jobs,
                    pending_approvals: stats.pending_approvals,
                  }
                : null
            }
            isLoading={statsLoading}
          />

          <div
            className={cn(
              'rounded-[var(--radius)] border border-[var(--border)] p-4',
              'bg-[var(--surface)]'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[var(--text)]">
                Pending Approvals
              </h3>
              {!approvalsLoading && approvalCount > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center px-2 py-0.5 rounded-full',
                    'text-xs font-bold',
                    'bg-[var(--warning)] text-white'
                  )}
                >
                  {approvalCount}
                </span>
              )}
            </div>
            {approvalsLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-3/4 rounded bg-[var(--surface-elevated)] animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-[var(--surface-elevated)] animate-pulse" />
              </div>
            ) : approvalCount === 0 ? (
              <p className="text-xs text-[var(--text-disabled)]">
                No items waiting for approval.
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                {approvalCount} item{approvalCount !== 1 ? 's' : ''} awaiting
                your review. Head to the Approval Queue to review.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommandCenterPage({ workspaceId }: CommandCenterPageProps) {
  if (!workspaceId) {
    return <NoWorkspaceBanner />;
  }

  return <CommandCenterContent workspaceId={workspaceId} />;
}
