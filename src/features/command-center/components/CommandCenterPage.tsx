'use client';

import { useCallback } from 'react';
import { AlertTriangle, Activity, Zap, Target, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, StatCard, StatusBadge, PageWrapper } from '@/components/nebula';
import { MotionStagger, MotionStaggerItem, MotionFadeIn } from '@/components/nebula/motion';
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
import { SystemIntelligencePanel } from './SystemIntelligencePanel';

interface CommandCenterPageProps {
  workspaceId: string | null;
}

function NoWorkspaceBanner() {
  return (
    <PageWrapper>
      <MotionFadeIn>
        <GlassCard padding="md" hover={false}>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--warning-muted)]">
              <AlertTriangle size={18} className="text-[var(--warning)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">No workspace found</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Your session may have expired or no workspace is linked to your account.{' '}
                <a href="/login" className="text-[var(--primary)] hover:underline">
                  Log in again
                </a>{' '}
                to reconnect.
              </p>
            </div>
          </div>
        </GlassCard>
      </MotionFadeIn>
    </PageWrapper>
  );
}

function CommandCenterContent({ workspaceId }: { workspaceId: string }) {
  const {
    missions,
    isLoading: missionsLoading,
    createMission,
    isCreating,
    error: missionsError,
    refetch: refetchMissions,
    cancelMission,
    cancelAllActive,
  } = useMissions({ workspaceId });

  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats(workspaceId);

  // When stats failed to load, use zeroed-out fallback so cards don't stay on skeletons
  const safeStats = stats ?? {
    total_missions: 0,
    missions_running: 0,
    total_jobs: 0,
    total_assets: 0,
    pending_approvals: 0,
    approval_rate: 0,
    missions_today: 0,
  };

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

  const healthStats = statsLoading
    ? null
    : {
        missions_running: safeStats.missions_running,
        total_jobs: safeStats.total_jobs,
        pending_approvals: safeStats.pending_approvals,
      };

  return (
    <PageWrapper className="space-y-6">
      {/* ── Stats Row ─────────────────────────────────────── */}
      {statsError && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--danger-muted)] px-4 py-2 text-xs text-[var(--danger)]">
          <AlertTriangle size={14} />
          <span>Stats unavailable — showing cached or default values</span>
        </div>
      )}
      <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MotionStaggerItem>
          <StatCard
            label="Total Missions"
            value={safeStats.total_missions}
            icon={Target}
            tone="primary"
            loading={statsLoading}
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            label="Running"
            value={safeStats.missions_running}
            icon={Zap}
            tone="success"
            loading={statsLoading}
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            label="Total Jobs"
            value={safeStats.total_jobs}
            icon={Activity}
            tone="accent"
            loading={statsLoading}
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            label="Pending Approvals"
            value={approvalCount}
            icon={Clock}
            tone={approvalCount > 0 ? 'warning' : 'default'}
            loading={approvalsLoading}
          />
        </MotionStaggerItem>
      </MotionStagger>

      {/* ── Mission Error ──────────────────────────────────── */}
      {missionsError && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--danger-muted)] px-4 py-2 text-xs text-[var(--danger)]">
          <AlertTriangle size={14} />
          <span>{missionsError}</span>
        </div>
      )}

      {/* ── Mission Input + System Intelligence ────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <MotionFadeIn delay={0.15}>
          <MissionInput onSubmit={handleCreateMission} isSubmitting={isCreating} />
        </MotionFadeIn>
        <MotionFadeIn delay={0.2}>
          <SystemIntelligencePanel workspaceId={workspaceId} />
        </MotionFadeIn>
      </div>

      {/* ── System Health ─────────────────────────────────── */}
      <MotionFadeIn delay={0.25}>
        <SystemHealthPanel stats={healthStats} isLoading={statsLoading} />
      </MotionFadeIn>

      {/* ── Two-Column: Missions + Assets ─────────────────── */}
      <MotionStagger className="grid gap-6 xl:grid-cols-2">
        <MotionStaggerItem>
          <ActiveMissionsList
            missions={missions}
            isLoading={missionsLoading}
            onCancel={cancelMission}
            onCancelAll={async () => { await cancelAllActive(); await refetchStats(); }}
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <RecentAssetsFeed assets={assets} isLoading={assetsLoading} />
        </MotionStaggerItem>
      </MotionStagger>

      {/* ── Approval Queue ────────────────────────────────── */}
      <MotionFadeIn delay={0.3}>
        <GlassCard padding="none" variant={approvalCount > 0 ? 'glow' : 'default'}>
          <div className="flex items-center justify-between gap-4 py-4 px-5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  approvalCount > 0
                    ? 'bg-[var(--warning-muted)]'
                    : 'bg-[var(--success-muted)]',
                )}
              >
                <CheckCircle2
                  size={18}
                  className={
                    approvalCount > 0
                      ? 'text-[var(--warning)]'
                      : 'text-[var(--success)]'
                  }
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
            <StatusBadge
              label={
                approvalsLoading
                  ? 'Syncing'
                  : approvalCount > 0
                    ? `${approvalCount} pending`
                    : 'Clear'
              }
              variant={approvalCount > 0 ? 'warning' : 'success'}
              pulse={approvalCount > 0}
            />
          </div>
        </GlassCard>
      </MotionFadeIn>
    </PageWrapper>
  );
}

export function CommandCenterPage({ workspaceId }: CommandCenterPageProps) {
  if (!workspaceId) {
    return <NoWorkspaceBanner />;
  }

  return <CommandCenterContent workspaceId={workspaceId} />;
}
