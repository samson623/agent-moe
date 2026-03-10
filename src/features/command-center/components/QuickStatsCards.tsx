'use client';

import { Rocket, FileStack, Activity, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardStats {
  missions_today: number;
  missions_running: number;
  total_missions: number;
  total_assets: number;
  pending_approvals: number;
  approval_rate: number;
  total_jobs: number;
}

interface QuickStatsCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

interface StatConfig {
  key: keyof DashboardStats;
  label: string;
  icon: LucideIcon;
  glowColor: string;
  activeColor: string;
  orbBg: string;
}

const STAT_CARDS: StatConfig[] = [
  {
    key: 'missions_today',
    label: 'Missions Today',
    icon: Rocket,
    glowColor: 'rgba(124,58,237,0.12)',
    activeColor: 'text-[var(--accent)]',
    orbBg: 'bg-[var(--accent)]',
  },
  {
    key: 'total_assets',
    label: 'Assets Created',
    icon: FileStack,
    glowColor: 'rgba(59,130,246,0.12)',
    activeColor: 'text-[var(--primary)]',
    orbBg: 'bg-[var(--primary)]',
  },
  {
    key: 'missions_running',
    label: 'Running Now',
    icon: Activity,
    glowColor: 'rgba(16,185,129,0.12)',
    activeColor: 'text-[var(--success)]',
    orbBg: 'bg-[var(--success)]',
  },
  {
    key: 'pending_approvals',
    label: 'Pending Approvals',
    icon: ShieldCheck,
    glowColor: 'rgba(245,158,11,0.12)',
    activeColor: 'text-[var(--warning)]',
    orbBg: 'bg-[var(--warning)]',
  },
];

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="relative p-6 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-8 w-16 rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] animate-pulse" />
            <div className="h-3.5 w-24 rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] animate-pulse" />
          </div>
          <div className="h-10 w-10 rounded-[var(--radius)] bg-[var(--surface-elevated)] animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStatsCards({ stats, isLoading }: QuickStatsCardsProps) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      role="region"
      aria-label="Dashboard statistics"
    >
      {STAT_CARDS.map((config) => {
        if (isLoading) return <StatSkeleton key={config.key} />;

        const value = stats?.[config.key] ?? 0;
        const isActive = value > 0;
        const Icon = config.icon;

        return (
          <Card
            key={config.key}
            glow={
              isActive
                ? config.key === 'total_assets'
                  ? 'primary'
                  : config.key === 'missions_today'
                    ? 'accent'
                    : 'none'
                : 'none'
            }
            className={cn(
              'transition-all duration-200',
              isActive &&
                config.key === 'pending_approvals' &&
                'border-[rgba(245,158,11,0.3)] shadow-[0_0_20px_rgba(245,158,11,0.1)]',
              isActive &&
                config.key === 'missions_running' &&
                'border-[rgba(16,185,129,0.3)] shadow-[0_0_20px_rgba(16,185,129,0.1)]'
            )}
          >
            <CardContent className="relative p-6 overflow-hidden">
              <div
                className={cn(
                  'absolute -top-6 -left-6 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500',
                  config.orbBg,
                  isActive && 'opacity-[0.07]'
                )}
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between">
                <div>
                  <p
                    className={cn(
                      'text-4xl font-bold leading-none tracking-tight transition-colors duration-200',
                      isActive ? config.activeColor : 'text-[var(--text)]'
                    )}
                  >
                    {value.toLocaleString()}
                  </p>
                  <p className="mt-2.5 text-sm font-medium text-[var(--text-muted)]">
                    {config.label}
                  </p>
                </div>

                <div
                  className={cn(
                    'flex items-center justify-center w-11 h-11 rounded-[var(--radius)]',
                    'border border-[var(--border)] bg-[var(--surface-elevated)]'
                  )}
                >
                  <Icon size={20} className="text-[var(--text-muted)]" />
                </div>
              </div>

              {config.key === 'missions_running' && isActive && (
                <span
                  className="absolute top-4 right-4 flex h-2.5 w-2.5"
                  aria-label={`${value} missions currently running`}
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
                </span>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
