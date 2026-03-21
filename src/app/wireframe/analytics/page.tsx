'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  GlassCard,
  StatCard,
  SectionCard,
  StatusBadge,
  Pill,
  PageWrapper,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
} from '@/components/nebula';
import { cn } from '@/lib/utils';
import {
  Target,
  Layers,
  CheckCircle2,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Shield,
  Megaphone,
  DollarSign,
  Loader2,
  Clock,
} from 'lucide-react';

/* ─────────────────── Types ─────────────────── */

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';
type Tab = 'overview' | 'missions' | 'content';
type SortField = 'mission' | 'status' | 'jobs' | 'duration' | 'quality';
type SortDir = 'asc' | 'desc';

/* ─────────────────── Mock Data ─────────────────── */

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'All Time' },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'missions', label: 'Mission Intel' },
  { key: 'content', label: 'Content Performance' },
];

const KPI_DATA: Record<TimeRange, { missions: number; assets: number; approval: number; avgResponse: number }> = {
  '24h': { missions: 18, assets: 156, approval: 96.1, avgResponse: 1.8 },
  '7d': { missions: 142, assets: 1247, approval: 94.2, avgResponse: 2.3 },
  '30d': { missions: 583, assets: 4892, approval: 93.8, avgResponse: 2.5 },
  '90d': { missions: 1641, assets: 13420, approval: 92.4, avgResponse: 2.7 },
  all: { missions: 3284, assets: 27610, approval: 91.9, avgResponse: 2.9 },
};

const DAILY_ACTIVITY = [
  { day: 'Mon', value: 24 },
  { day: 'Tue', value: 38 },
  { day: 'Wed', value: 31 },
  { day: 'Thu', value: 45 },
  { day: 'Fri', value: 28 },
  { day: 'Sat', value: 15 },
  { day: 'Sun', value: 12 },
];

const OPERATORS = [
  { rank: 1, name: 'Content Strike Team', icon: Sparkles, jobs: 487, quality: 96.2, output: 1840 },
  { rank: 2, name: 'Growth Operator', icon: Megaphone, jobs: 352, quality: 93.8, output: 1290 },
  { rank: 3, name: 'Revenue Closer', icon: DollarSign, jobs: 218, quality: 91.5, output: 870 },
  { rank: 4, name: 'Brand Guardian', icon: Shield, jobs: 190, quality: 97.1, output: 620 },
];

type EventType = 'mission' | 'asset' | 'approval' | 'system';
const EVENT_TONE: Record<EventType, 'primary' | 'success' | 'accent' | 'muted'> = {
  mission: 'primary',
  asset: 'success',
  approval: 'accent',
  system: 'muted',
};

const EVENTS: { time: string; type: EventType; desc: string }[] = [
  { time: '2 min ago', type: 'mission', desc: 'Mission "Q1 LinkedIn Push" completed successfully' },
  { time: '8 min ago', type: 'asset', desc: 'Generated 12 social captions for Instagram campaign' },
  { time: '15 min ago', type: 'approval', desc: 'Blog post "AI Trends 2026" approved by Brand Guardian' },
  { time: '22 min ago', type: 'system', desc: 'Model router switched to GPT-5 Nano for CTA batch' },
  { time: '31 min ago', type: 'asset', desc: 'Created 5 thumbnail variants for YouTube video' },
  { time: '45 min ago', type: 'mission', desc: 'Mission "TikTok Growth Sprint" launched with 8 jobs' },
  { time: '1 hr ago', type: 'approval', desc: 'Revenue report copy approved — pushed to Launchpad' },
  { time: '1.5 hr ago', type: 'system', desc: 'Claude Agent SDK reconnected after timeout' },
  { time: '2 hr ago', type: 'asset', desc: 'Generated email sequence (5 emails) for product launch' },
  { time: '3 hr ago', type: 'mission', desc: 'Mission "Weekly Newsletter" completed — 3 assets produced' },
];

const MISSIONS_TABLE = [
  { mission: 'Q1 LinkedIn Push', status: 'completed' as const, jobs: 12, duration: '4m 32s', quality: 96 },
  { mission: 'TikTok Growth Sprint', status: 'running' as const, jobs: 8, duration: '2m 10s', quality: 91 },
  { mission: 'Email Nurture Seq', status: 'completed' as const, jobs: 5, duration: '3m 48s', quality: 94 },
  { mission: 'Blog SEO Refresh', status: 'completed' as const, jobs: 15, duration: '6m 22s', quality: 88 },
  { mission: 'Instagram Carousel', status: 'failed' as const, jobs: 3, duration: '1m 05s', quality: 42 },
  { mission: 'Weekly Newsletter', status: 'completed' as const, jobs: 3, duration: '2m 55s', quality: 97 },
  { mission: 'YouTube Thumbnails', status: 'partial' as const, jobs: 7, duration: '3m 18s', quality: 85 },
  { mission: 'Product Launch Copy', status: 'completed' as const, jobs: 10, duration: '5m 44s', quality: 93 },
];

const STATUS_VARIANT: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
  completed: 'success',
  running: 'primary',
  partial: 'warning',
  failed: 'danger',
};

const CONTENT_TYPES = [
  { label: 'Posts', pct: 45, color: 'var(--primary)' },
  { label: 'Scripts', pct: 25, color: 'var(--success)' },
  { label: 'Captions', pct: 15, color: 'var(--accent)' },
  { label: 'CTAs', pct: 10, color: 'var(--warning)' },
  { label: 'Thumbnails', pct: 5, color: 'var(--danger)' },
];

const PLATFORMS = [
  { name: 'X', assets: 312, engagement: 8.4, top: '"AI agents are the new interns" — 12K impressions' },
  { name: 'LinkedIn', assets: 287, engagement: 6.2, top: '"How MOE runs our content ops" — 4.8K views' },
  { name: 'Instagram', assets: 198, engagement: 7.1, top: 'Carousel: "5 AI Automations" — 2.1K saves' },
  { name: 'TikTok', assets: 156, engagement: 9.3, top: '"MOE works while you sleep" — 48K views' },
  { name: 'YouTube', assets: 94, engagement: 5.8, top: '"Full AI Workflow Tour" — 6.2K watch hours' },
];

const AI_INSIGHTS = [
  {
    icon: Lightbulb,
    title: 'Content Volume Spike Detected',
    desc: 'Caption output increased 34% this week. The Content Strike Team is producing at peak efficiency.',
    action: 'Consider allocating more GPU budget to maintain throughput during Q1 push.',
  },
  {
    icon: TrendingUp,
    title: 'TikTok Outperforming Other Channels',
    desc: 'TikTok engagement rate (9.3%) is 47% higher than the platform average. Short-form video is resonating.',
    action: 'Double down on TikTok-first content strategy. Route more missions through video pipeline.',
  },
  {
    icon: AlertTriangle,
    title: 'Instagram Carousel Failures Rising',
    desc: '3 carousel missions failed this week due to image generation timeouts. Quality score dropped to 42%.',
    action: 'Switch image provider to GPT Image 1.5 for carousel tasks. Add retry logic to image pipeline.',
  },
];

/* ─────────────────── Component ─────────────────── */

export default function AnalyticsWireframePage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sortField, setSortField] = useState<SortField>('quality');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsVisible, setInsightsVisible] = useState(false);

  const kpi = KPI_DATA[timeRange];

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('desc');
      }
    },
    [sortField],
  );

  const sortedMissions = useMemo(() => {
    const copy = [...MISSIONS_TABLE];
    const dir = sortDir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortField) {
        case 'mission':
          return dir * a.mission.localeCompare(b.mission);
        case 'status':
          return dir * a.status.localeCompare(b.status);
        case 'jobs':
          return dir * (a.jobs - b.jobs);
        case 'duration':
          return dir * (a.duration.localeCompare(b.duration));
        case 'quality':
          return dir * (a.quality - b.quality);
        default:
          return 0;
      }
    });
    return copy;
  }, [sortField, sortDir]);

  const generateInsights = useCallback(() => {
    setInsightsLoading(true);
    setInsightsVisible(false);
    setTimeout(() => {
      setInsightsLoading(false);
      setInsightsVisible(true);
    }, 2000);
  }, []);

  const maxOperatorJobs = Math.max(...OPERATORS.map((o) => o.jobs));
  const maxBarValue = Math.max(...DAILY_ACTIVITY.map((d) => d.value));

  /* ─── Sort header helper ─── */
  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const active = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={cn(
          'flex items-center gap-1 text-xs font-medium transition-colors',
          active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
        )}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    );
  }

  return (
    <PageWrapper>
      <MotionFadeIn>
        {/* ─── Header ─── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Performance metrics, mission intel, and content insights.
          </p>
        </div>

        {/* ─── Time Range Selector ─── */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.key}
              onClick={() => setTimeRange(tr.key)}
              className={cn(
                'rounded-[var(--radius-pill)] border px-4 py-1.5 text-xs font-medium transition-all',
                timeRange === tr.key
                  ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]',
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {/* ─── KPI Stats Row ─── */}
        <MotionStagger className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MotionStaggerItem>
            <StatCard
              label="Missions Completed"
              value={kpi.missions}
              icon={Target}
              tone="primary"
              subtitle="+12% from last period"
              subtitleTone="positive"
            />
          </MotionStaggerItem>
          <MotionStaggerItem>
            <StatCard
              label="Assets Generated"
              value={kpi.assets}
              icon={Layers}
              tone="success"
              subtitle="+8% from last period"
              subtitleTone="positive"
              prefix=""
              suffix=""
            />
          </MotionStaggerItem>
          <MotionStaggerItem>
            <StatCard
              label="Approval Rate"
              value={kpi.approval}
              icon={CheckCircle2}
              tone="accent"
              suffix="%"
              decimals={1}
              subtitle="Above 90% target"
              subtitleTone="positive"
            />
          </MotionStaggerItem>
          <MotionStaggerItem>
            <StatCard
              label="Avg Response Time"
              value={kpi.avgResponse}
              icon={Zap}
              tone="warning"
              suffix="s"
              decimals={1}
              subtitle="Within SLA threshold"
              subtitleTone="neutral"
            />
          </MotionStaggerItem>
        </MotionStagger>

        {/* ─── Tab Navigation ─── */}
        <div className="mb-6 flex gap-6 border-b border-[var(--border)]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative pb-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Daily Activity Chart */}
            <GlassCard padding="md">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Daily Activity</h3>
              <div className="flex items-end gap-3" style={{ height: 180 }}>
                {/* Y-axis labels */}
                <div className="flex h-full flex-col justify-between pb-6 text-right">
                  {[maxBarValue, Math.round(maxBarValue * 0.66), Math.round(maxBarValue * 0.33), 0].map(
                    (v) => (
                      <span key={v} className="text-[10px] text-[var(--text-muted)] w-6">
                        {v}
                      </span>
                    ),
                  )}
                </div>
                {/* Bars */}
                <div className="flex flex-1 items-end justify-around gap-2">
                  {DAILY_ACTIVITY.map((d) => (
                    <div key={d.day} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-8 rounded-t-md bg-[var(--primary)] transition-all duration-300 hover:bg-[var(--primary-hover)]"
                        style={{ height: `${(d.value / maxBarValue) * 140}px` }}
                        title={`${d.value} tasks`}
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Operator Leaderboard */}
              <SectionCard title="Operator Leaderboard" subtitle="Ranked by total output">
                <div className="space-y-3">
                  {OPERATORS.map((op) => {
                    const Icon = op.icon;
                    return (
                      <div
                        key={op.rank}
                        className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] p-3"
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                            op.rank === 1
                              ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                              : 'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
                          )}
                        >
                          #{op.rank}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-muted)]">
                          <Icon className="h-4 w-4 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--text)] truncate">{op.name}</p>
                          {/* Jobs bar */}
                          <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--surface-elevated)]">
                            <div
                              className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                              style={{ width: `${(op.jobs / maxOperatorJobs) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-[var(--text)]">{op.output.toLocaleString()}</p>
                          <p className="text-[10px] text-[var(--success)]">{op.quality}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Event Feed */}
              <SectionCard title="Recent Events" subtitle="Live activity stream">
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                  {EVENTS.map((evt, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] p-3"
                    >
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-disabled)]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-[var(--text-muted)]">{evt.time}</span>
                          <Pill tone={EVENT_TONE[evt.type]}>{evt.type}</Pill>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{evt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* ═══════════════ MISSION INTEL TAB ═══════════════ */}
        {activeTab === 'missions' && (
          <div className="space-y-6">
            {/* Mission Performance Table */}
            <SectionCard title="Mission Performance" subtitle="Click column headers to sort">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="pb-3 pr-4">
                        <SortHeader field="mission" label="Mission" />
                      </th>
                      <th className="pb-3 pr-4">
                        <SortHeader field="status" label="Status" />
                      </th>
                      <th className="pb-3 pr-4">
                        <SortHeader field="jobs" label="Jobs" />
                      </th>
                      <th className="pb-3 pr-4">
                        <SortHeader field="duration" label="Duration" />
                      </th>
                      <th className="pb-3">
                        <SortHeader field="quality" label="Quality Score" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMissions.map((m, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border-subtle)] last:border-0"
                      >
                        <td className="py-3 pr-4 text-xs font-medium text-[var(--text)]">{m.mission}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge label={m.status} variant={STATUS_VARIANT[m.status]} />
                        </td>
                        <td className="py-3 pr-4 text-xs text-[var(--text-secondary)]">{m.jobs}</td>
                        <td className="py-3 pr-4 text-xs text-[var(--text-muted)]">{m.duration}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-[var(--surface-elevated)]">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  m.quality >= 90
                                    ? 'bg-[var(--success)]'
                                    : m.quality >= 70
                                      ? 'bg-[var(--warning)]'
                                      : 'bg-[var(--danger)]',
                                )}
                                style={{ width: `${m.quality}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[var(--text)]">{m.quality}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Success/Failure Donut */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard title="Success / Failure Breakdown">
                <div className="flex flex-col items-center gap-6">
                  {/* CSS Donut */}
                  <div className="relative">
                    <div
                      className="h-40 w-40 rounded-full"
                      style={{
                        background:
                          'conic-gradient(var(--success) 0% 92%, var(--warning) 92% 97%, var(--danger) 97% 100%)',
                      }}
                    />
                    <div className="absolute inset-4 flex items-center justify-center rounded-full bg-[var(--surface-solid)]">
                      <div className="text-center">
                        <p className="text-xl font-bold text-[var(--text)]">92%</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Success</p>
                      </div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex gap-6">
                    {[
                      { label: 'Success', pct: '92%', color: 'var(--success)' },
                      { label: 'Partial', pct: '5%', color: 'var(--warning)' },
                      { label: 'Failed', pct: '3%', color: 'var(--danger)' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {item.label} ({item.pct})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Quick stats panel */}
              <SectionCard title="Mission Metrics">
                <div className="space-y-4">
                  {[
                    { label: 'Total Missions', value: '142', tone: 'primary' as const },
                    { label: 'Avg Jobs per Mission', value: '7.9', tone: 'success' as const },
                    { label: 'Avg Duration', value: '3m 42s', tone: 'accent' as const },
                    { label: 'Avg Quality Score', value: '91.4%', tone: 'warning' as const },
                    { label: 'Failure Rate', value: '3%', tone: 'danger' as const },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-2.5"
                    >
                      <span className="text-xs text-[var(--text-muted)]">{m.label}</span>
                      <Pill tone={m.tone}>{m.value}</Pill>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* ═══════════════ CONTENT PERFORMANCE TAB ═══════════════ */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Content Type Breakdown */}
            <SectionCard title="Content Type Breakdown" subtitle="Distribution by asset type">
              <div className="space-y-3">
                {CONTENT_TYPES.map((ct) => (
                  <div key={ct.label} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-[var(--text-secondary)] text-right">{ct.label}</span>
                    <div className="flex-1 h-5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${ct.pct}%`, backgroundColor: ct.color }}
                      />
                    </div>
                    <span className="w-10 text-xs font-medium text-[var(--text)]">{ct.pct}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Platform Distribution */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {PLATFORMS.map((p) => (
                <GlassCard key={p.name} padding="md">
                  <p className="text-lg font-bold text-[var(--text)]">{p.name}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Assets</span>
                      <span className="font-medium text-[var(--text)]">{p.assets}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Engagement</span>
                      <span className="font-medium text-[var(--success)]">{p.engagement}%</span>
                    </div>
                  </div>
                  <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] p-2">
                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{p.top}</p>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Feedback Insights Panel */}
            <SectionCard
              title="Feedback Insights"
              subtitle="AI-powered analysis of content performance"
              action={
                <button
                  onClick={generateInsights}
                  disabled={insightsLoading}
                  className={cn(
                    'flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-2 text-xs font-medium transition-all',
                    insightsLoading
                      ? 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-disabled)] cursor-not-allowed'
                      : 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white',
                  )}
                >
                  {insightsLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate Insights
                    </>
                  )}
                </button>
              }
            >
              {insightsLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="animate-pulse rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--surface-elevated)]" />
                        <div className="h-3 w-32 rounded bg-[var(--surface-elevated)]" />
                      </div>
                      <div className="h-2 w-full rounded bg-[var(--surface-elevated)] mb-2" />
                      <div className="h-2 w-3/4 rounded bg-[var(--surface-elevated)]" />
                    </div>
                  ))}
                </div>
              )}

              {insightsVisible && !insightsLoading && (
                <MotionStagger className="space-y-4">
                  {AI_INSIGHTS.map((insight, i) => {
                    const Icon = insight.icon;
                    const tones = ['primary', 'success', 'warning'] as const;
                    const tone = tones[i];
                    return (
                      <MotionStaggerItem key={i}>
                        <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full',
                                tone === 'primary' && 'bg-[var(--primary-muted)] text-[var(--primary)]',
                                tone === 'success' && 'bg-[var(--success-muted)] text-[var(--success)]',
                                tone === 'warning' && 'bg-[var(--warning-muted)] text-[var(--warning)]',
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <h4 className="text-xs font-semibold text-[var(--text)]">{insight.title}</h4>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">
                            {insight.desc}
                          </p>
                          <p className="text-[10px] text-[var(--primary)] font-medium">{insight.action}</p>
                        </div>
                      </MotionStaggerItem>
                    );
                  })}
                </MotionStagger>
              )}

              {!insightsVisible && !insightsLoading && (
                <div className="flex flex-col items-center py-8 text-center">
                  <Sparkles className="h-8 w-8 text-[var(--text-disabled)] mb-3" />
                  <p className="text-xs text-[var(--text-muted)]">
                    Click &quot;Generate Insights&quot; to analyze your content performance with AI.
                  </p>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </MotionFadeIn>
    </PageWrapper>
  );
}
