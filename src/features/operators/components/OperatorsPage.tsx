'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  TrendingUp,
  DollarSign,
  Shield,
  Wallet,
  Activity,
  Clock,
  Cpu,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, StatCard, SectionHeader, StatusBadge, EmptyState, PageWrapper } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem, MotionFadeIn } from '@/components/nebula/motion'
import { cn } from '@/lib/utils'
import { useOperatorStats, type TeamStats } from '../hooks/use-operator-stats'
import { useOperatorActivity, type ActivityItem } from '../hooks/use-operator-activity'
import { OperatorTeamCard, type OperatorTeam } from './OperatorTeamCard'

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Operator team config
// ---------------------------------------------------------------------------

interface TeamConfig {
  key: 'content_strike' | 'growth_operator' | 'revenue_closer' | 'brand_guardian'
  name: string
  role: string
  icon: LucideIcon
  color: string
  model: string
  capabilities: string[]
}

const TEAMS: TeamConfig[] = [
  {
    key: 'content_strike',
    name: 'Content Strike Team',
    role: 'Content Generation',
    icon: FileText,
    color: '#3b82f6',
    model: 'Claude',
    capabilities: ['Social posts', 'Video scripts', 'Captions', 'Hooks', 'CTA packs', 'Repurposing'],
  },
  {
    key: 'growth_operator',
    name: 'Growth Operator',
    role: 'Market Intelligence',
    icon: TrendingUp,
    color: '#10b981',
    model: 'Claude + Nano',
    capabilities: ['Trend scanning', 'Topic scoring', 'Competitor analysis', 'Opportunity board', 'Audience fit'],
  },
  {
    key: 'revenue_closer',
    name: 'Revenue Closer',
    role: 'Monetization Strategy',
    icon: DollarSign,
    color: '#f59e0b',
    model: 'Claude + Nano',
    capabilities: ['Offer mapping', 'CTA strategy', 'Lead magnets', 'Funnel logic', 'Pricing ladders'],
  },
  {
    key: 'brand_guardian',
    name: 'Brand Guardian',
    role: 'Safety & Approval',
    icon: Shield,
    color: '#7c3aed',
    model: 'Claude',
    capabilities: ['Tone enforcement', 'Claim flagging', 'Safety review', 'Approval routing', 'Brand rules'],
  },
]

// ---------------------------------------------------------------------------
// Operator team overview cards data
// ---------------------------------------------------------------------------

const OPERATOR_TEAMS: OperatorTeam[] = [
  {
    id: 'content_strike',
    name: 'Content Strike Team',
    icon: FileText,
    description: 'Research, hooks, scripts, captions, thumbnails',
    status: 'Live',
    output: '34 assets/day',
    value: '$3.4K/mo impact',
  },
  {
    id: 'growth_operator',
    name: 'Growth Operator',
    icon: TrendingUp,
    description: 'Trend detection, competitor gaps, timing windows',
    status: 'Live',
    output: '+27% engagement',
    value: '$4.9K/mo impact',
  },
  {
    id: 'revenue_closer',
    name: 'Revenue Closer',
    icon: Wallet,
    description: 'Offer routing, lead qualification, nurture sequences',
    status: 'Armed',
    output: '19 SQLs/week',
    value: '$7.8K/mo impact',
  },
  {
    id: 'brand_guardian',
    name: 'Brand Guardian',
    icon: Shield,
    description: 'Safety checks, claim filters, tone alignment',
    status: 'Live',
    output: '99.2% compliance',
    value: 'Risk reduced',
  },
]

// ---------------------------------------------------------------------------
// Activity icon resolver
// ---------------------------------------------------------------------------

const ACTION_ICONS: Record<string, LucideIcon> = {
  completed: CheckCircle2,
  failed: XCircle,
  started: Zap,
  queued: Clock,
  approved: Shield,
}

function getActionIcon(action: string): LucideIcon {
  const lower = action.toLowerCase()
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return Activity
}

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius)] bg-[var(--skeleton)]',
        className,
      )}
    />
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} padding="md">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="mt-3">
            <Skeleton className="h-7 w-12" />
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function TeamCardSkeleton() {
  return (
    <GlassCard padding="none">
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-[var(--radius)]" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-16 rounded-full" />
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Error alert
// ---------------------------------------------------------------------------

function ErrorAlert({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/10 text-red-400">
      <AlertTriangle size={18} className="shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Team Card
// ---------------------------------------------------------------------------

function TeamCard({ team, teamStats }: { team: TeamConfig; teamStats: TeamStats }) {
  const Icon = team.icon
  const isActive = teamStats.running > 0
  const completedRatio = teamStats.total > 0 ? (teamStats.completed / teamStats.total) * 100 : 0

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${team.color}, ${team.color}40)` }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-[var(--radius)]"
              style={{ background: `${team.color}18`, border: `1px solid ${team.color}30` }}
            >
              <Icon size={18} style={{ color: team.color }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text)]">{team.name}</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{team.role}</p>
            </div>
          </div>
          <StatusBadge
            label={isActive ? 'Active' : 'Idle'}
            variant={isActive ? 'success' : 'default'}
            pulse={isActive}
          />
        </div>

        <div className="mt-4 space-y-4">
          {/* Mini stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Completed', value: teamStats.completed, cls: 'text-[var(--success)]' },
              { label: 'Failed', value: teamStats.failed, cls: 'text-[var(--danger)]' },
              { label: 'Pending', value: teamStats.pending, cls: 'text-[var(--warning)]' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={cn('text-sm font-bold tabular-nums', s.cls)}>
                  {s.value}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Completed progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Completed ratio</span>
              <span className="tabular-nums">{completedRatio.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--surface-elevated)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completedRatio}%`,
                  background: team.color,
                }}
              />
            </div>
          </div>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-1.5">
            {team.capabilities.map((cap) => (
              <span
                key={cap}
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
                  'border border-[var(--border-subtle)]',
                )}
              >
                {cap}
              </span>
            ))}
          </div>

          {/* Footer: model info */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <Cpu size={12} className="text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">{team.model}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Activity Feed
// ---------------------------------------------------------------------------

function ActivityFeed({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-7 h-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No operator activity yet"
        description="Submit a mission to get started."
      />
    )
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const ActionIcon = getActionIcon(item.action)
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shrink-0">
              <ActionIcon size={13} className="text-[var(--text-muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text)] truncate">
                <span className="font-medium">{item.actor_type}</span>{' '}
                <span className="text-[var(--text-secondary)]">{item.summary || item.action}</span>
              </p>
            </div>
            <span className="text-xs text-[var(--text-muted)] tabular-nums shrink-0">
              {formatTimeAgo(item.created_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function OperatorsPage({ workspaceId }: { workspaceId: string }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useOperatorStats(workspaceId)
  const { activity, loading: activityLoading, error: activityError, refresh: refreshActivity } = useOperatorActivity(workspaceId, 15)

  const isLive = !!workspaceId

  const totalJobs = TEAMS.reduce((sum, t) => sum + stats[t.key].total, 0)
  const activeJobs = TEAMS.reduce((sum, t) => sum + stats[t.key].running, 0)
  const completedJobs = TEAMS.reduce((sum, t) => sum + stats[t.key].completed, 0)
  const pendingJobs = TEAMS.reduce((sum, t) => sum + stats[t.key].pending, 0)

  const handleRefresh = () => {
    refreshStats()
    refreshActivity()
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <MotionFadeIn>
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Operator Teams"
              description="AI operator teams executing missions across your workspace"
              className="mb-0"
            />
            <div className="flex items-center gap-2">
              <StatusBadge
                label={isLive ? 'Live' : 'No Workspace'}
                variant={isLive ? 'success' : 'warning'}
                pulse={isLive}
              />
              <Button variant="ghost" size="icon-sm" onClick={handleRefresh} title="Refresh">
                <RefreshCw size={14} />
              </Button>
            </div>
          </div>
        </MotionFadeIn>

        {/* Errors */}
        {statsError && <ErrorAlert message={statsError} onRetry={refreshStats} />}
        {activityError && <ErrorAlert message={activityError} onRetry={refreshActivity} />}

        {/* Operator team overview cards */}
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {OPERATOR_TEAMS.map((team) => (
            <MotionStaggerItem key={team.id}>
              <OperatorTeamCard
                team={team}
                active={selectedTeamId === team.id}
                onClick={() =>
                  setSelectedTeamId((prev) => (prev === team.id ? null : team.id))
                }
              />
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        {/* Quick stats row */}
        <MotionFadeIn delay={0.05}>
          {statsLoading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Jobs Executed" value={totalJobs.toLocaleString()} icon={Cpu} tone="primary" />
              <StatCard label="Active Jobs" value={activeJobs.toLocaleString()} icon={Activity} tone="accent" />
              <StatCard label="Jobs Completed" value={completedJobs.toLocaleString()} icon={CheckCircle2} tone="success" />
              <StatCard label="Pending Queue" value={pendingJobs.toLocaleString()} icon={Clock} tone="warning" />
            </div>
          )}
        </MotionFadeIn>

        {/* Operator team cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <MotionStagger className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TEAMS.map((team) => (
              <MotionStaggerItem key={team.key}>
                <TeamCard team={team} teamStats={stats[team.key]} />
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        )}

        {/* Recent activity feed */}
        <MotionFadeIn delay={0.15}>
          <GlassCard padding="none">
            <div className="p-5">
              <SectionHeader
                title="Recent Activity"
                action={
                  activity.length > 0 ? (
                    <StatusBadge label={`${activity.length} items`} variant="default" />
                  ) : undefined
                }
              />
              <ActivityFeed items={activity} loading={activityLoading} />
            </div>
          </GlassCard>
        </MotionFadeIn>
      </div>
    </PageWrapper>
  )
}
