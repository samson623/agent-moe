'use client';

import { Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SystemHealthPanelProps {
  stats: {
    missions_running: number;
    total_jobs: number;
    pending_approvals: number;
  } | null;
  isLoading: boolean;
}

const OPERATOR_TEAMS = [
  { name: 'Content Strike', color: 'bg-[var(--primary)]', inactiveColor: 'bg-[var(--primary-muted)]' },
  { name: 'Growth', color: 'bg-[var(--success)]', inactiveColor: 'bg-[var(--success-muted)]' },
  { name: 'Revenue', color: 'bg-[var(--warning)]', inactiveColor: 'bg-[var(--warning-muted)]' },
  { name: 'Brand', color: 'bg-[var(--danger)]', inactiveColor: 'bg-[var(--danger-muted)]' },
] as const;

const MAX_QUEUE_BAR = 50;

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="h-3.5 w-24 rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] animate-pulse" />
      <div className="h-3.5 w-10 rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] animate-pulse" />
    </div>
  );
}

export function SystemHealthPanel({ stats, isLoading }: SystemHealthPanelProps) {
  const isOperational = !isLoading && stats !== null;
  const running = stats?.missions_running ?? 0;
  const jobs = stats?.total_jobs ?? 0;
  const approvals = stats?.pending_approvals ?? 0;
  const queuePercent = Math.min((jobs / MAX_QUEUE_BAR) * 100, 100);

  return (
    <Card aria-label="System health status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server size={16} className="text-[var(--text-muted)]" />
            <CardTitle className="text-base">System Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-5 w-20 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
            ) : (
              <>
                <span
                  className={cn(
                    'inline-block h-2 w-2 rounded-full',
                    isOperational ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    isOperational ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                  )}
                >
                  {isOperational ? 'Operational' : 'Offline'}
                </span>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] text-[var(--text-secondary)]">Job Queue</span>
              <div className="flex items-center gap-3">
                <div className="w-20 h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      queuePercent > 80
                        ? 'bg-[var(--danger)]'
                        : queuePercent > 50
                          ? 'bg-[var(--warning)]'
                          : 'bg-[var(--primary)]'
                    )}
                    style={{ width: `${queuePercent}%` }}
                  />
                </div>
                <span className="text-[15px] font-medium text-[var(--text)] tabular-nums w-6 text-right">
                  {jobs}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] text-[var(--text-secondary)]">Active Operators</span>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'inline-block h-2 w-2 rounded-full transition-colors duration-300',
                    running > 0 ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'
                  )}
                />
                <span className="text-[15px] font-medium text-[var(--text)] tabular-nums w-6 text-right">
                  {running}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] text-[var(--text-secondary)]">Approval Queue</span>
              <div className="flex items-center gap-2.5">
                {approvals > 0 ? (
                  <Badge variant="warning" className="text-xs px-1.5 py-0">
                    {approvals}
                  </Badge>
                ) : (
                  <span className="text-[15px] font-medium text-[var(--text)] tabular-nums w-6 text-right">
                    0
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        <div
          className={cn(
            'pt-4 mt-2 border-t border-[var(--border-subtle)]',
            'flex items-end justify-between gap-2'
          )}
        >
          {isLoading
            ? OPERATOR_TEAMS.map((team) => (
                <div key={team.name} className="flex flex-col items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
                  <div className="h-2.5 w-10 rounded bg-[var(--surface-elevated)] animate-pulse" />
                </div>
              ))
            : OPERATOR_TEAMS.map((team) => (
                <div
                  key={team.name}
                  className="flex flex-col items-center gap-1.5"
                  aria-label={`${team.name} team — ${running > 0 ? 'active' : 'standby'}`}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 rounded-full transition-colors duration-300',
                      running > 0 ? team.color : team.inactiveColor
                    )}
                  />
                  <span className="text-xs text-[var(--text-muted)] leading-none">
                    {team.name}
                  </span>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
