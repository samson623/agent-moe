'use client';

import { useState } from 'react';
import {
  FileText,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Briefcase,
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  AnimatePresence,
  motion,
} from '@/components/nebula';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type PillTone = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'primary' | 'muted';

interface OperatorTeam {
  id: string;
  name: string;
  icon: LucideIcon;
  tone: 'primary' | 'success' | 'accent' | 'warning';
  status: { label: string; variant: 'success' | 'warning'; pulse: boolean };
  stats: { label: string; value: string }[];
  recent: { text: string; time: string };
  specialties: { label: string; tone: PillTone }[];
  jobs: Job[];
  activity: ActivityEntry[];
  performance: { label: string; value: number; max: number }[];
}

interface Job {
  id: string;
  title: string;
  status: 'running' | 'queued' | 'completed' | 'failed';
  type: string;
  priority: 'high' | 'medium' | 'low';
  duration: string;
}

interface ActivityEntry {
  id: string;
  text: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

interface CombinedFeedEntry {
  id: string;
  team: string;
  teamTone: PillTone;
  text: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                           */
/* ------------------------------------------------------------------ */

const TEAMS: OperatorTeam[] = [
  {
    id: 'content',
    name: 'Content Strike Team',
    icon: FileText,
    tone: 'primary',
    status: { label: 'Active', variant: 'success', pulse: true },
    stats: [
      { label: 'Assets Created', value: '234' },
      { label: 'Active Jobs', value: '12' },
      { label: 'Quality Score', value: '96%' },
    ],
    recent: { text: 'Generated 3 TikTok scripts', time: '2m ago' },
    specialties: [
      { label: 'Posts', tone: 'primary' },
      { label: 'Scripts', tone: 'primary' },
      { label: 'Captions', tone: 'primary' },
      { label: 'CTAs', tone: 'primary' },
      { label: 'Thumbnails', tone: 'primary' },
    ],
    jobs: [
      { id: 'j1', title: 'Generate TikTok script batch', status: 'running', type: 'Script Gen', priority: 'high', duration: '2m 34s' },
      { id: 'j2', title: 'Write 5 LinkedIn carousel slides', status: 'running', type: 'Content Gen', priority: 'high', duration: '1m 12s' },
      { id: 'j3', title: 'Create CTA variants for ebook', status: 'queued', type: 'CTA Gen', priority: 'medium', duration: 'Pending' },
      { id: 'j4', title: 'Caption batch for Instagram reels', status: 'completed', type: 'Caption Gen', priority: 'medium', duration: '45s' },
      { id: 'j5', title: 'Thumbnail concepts for YouTube', status: 'completed', type: 'Thumbnail', priority: 'low', duration: '1m 08s' },
    ],
    activity: [
      { id: 'a1', text: 'Generated 3 TikTok scripts for AI tools niche', time: '2m ago', status: 'success' },
      { id: 'a2', text: 'Completed LinkedIn carousel on productivity', time: '8m ago', status: 'success' },
      { id: 'a3', text: 'Started CTA variant generation for Course offer', time: '12m ago', status: 'info' },
      { id: 'a4', text: 'Quality check passed for blog post batch', time: '18m ago', status: 'success' },
      { id: 'a5', text: 'Caption generation failed — retrying with fallback', time: '22m ago', status: 'warning' },
      { id: 'a6', text: 'Thumbnail concepts delivered for review', time: '30m ago', status: 'info' },
      { id: 'a7', text: 'Generated 12 tweet variants for launch campaign', time: '45m ago', status: 'success' },
      { id: 'a8', text: 'Blog outline approved and queued for expansion', time: '1h ago', status: 'success' },
    ],
    performance: [
      { label: 'Scripts', value: 89, max: 100 },
      { label: 'Posts', value: 72, max: 100 },
      { label: 'Captions', value: 95, max: 100 },
      { label: 'CTAs', value: 68, max: 100 },
    ],
  },
  {
    id: 'growth',
    name: 'Growth Operator',
    icon: TrendingUp,
    tone: 'success',
    status: { label: 'Scanning', variant: 'warning', pulse: true },
    stats: [
      { label: 'Signals Found', value: '89' },
      { label: 'Active Scans', value: '5' },
      { label: 'Opportunities', value: '78' },
    ],
    recent: { text: 'Completed trend scan for AI tools', time: '5m ago' },
    specialties: [
      { label: 'Trends', tone: 'success' },
      { label: 'Scoring', tone: 'success' },
      { label: 'Competitors', tone: 'success' },
      { label: 'Angles', tone: 'success' },
    ],
    jobs: [
      { id: 'j1', title: 'Scan Reddit for AI tool discussions', status: 'running', type: 'Trend Scan', priority: 'high', duration: '4m 10s' },
      { id: 'j2', title: 'Score 23 new signals from Twitter', status: 'running', type: 'Scoring', priority: 'high', duration: '1m 45s' },
      { id: 'j3', title: 'Competitor analysis: TopAI launch', status: 'queued', type: 'Competitor', priority: 'medium', duration: 'Pending' },
      { id: 'j4', title: 'Generate content angles from signals', status: 'completed', type: 'Angle Gen', priority: 'medium', duration: '2m 22s' },
      { id: 'j5', title: 'Weekly trend report compilation', status: 'completed', type: 'Report', priority: 'low', duration: '3m 05s' },
    ],
    activity: [
      { id: 'a1', text: 'Completed trend scan for AI tools niche', time: '5m ago', status: 'success' },
      { id: 'a2', text: 'Found 12 high-score signals on Twitter', time: '10m ago', status: 'success' },
      { id: 'a3', text: 'Started competitor analysis for TopAI launch', time: '15m ago', status: 'info' },
      { id: 'a4', text: 'Scored 45 signals — 8 above threshold', time: '25m ago', status: 'success' },
      { id: 'a5', text: 'Reddit scan rate-limited — backing off', time: '32m ago', status: 'warning' },
      { id: 'a6', text: 'Generated 6 content angles from top signals', time: '40m ago', status: 'success' },
      { id: 'a7', text: 'Weekly trend report ready for review', time: '55m ago', status: 'info' },
      { id: 'a8', text: 'Identified emerging trend: AI video editing', time: '1h ago', status: 'success' },
    ],
    performance: [
      { label: 'Signals', value: 89, max: 100 },
      { label: 'Accuracy', value: 78, max: 100 },
      { label: 'Speed', value: 92, max: 100 },
      { label: 'Coverage', value: 65, max: 100 },
    ],
  },
  {
    id: 'revenue',
    name: 'Revenue Closer',
    icon: DollarSign,
    tone: 'accent',
    status: { label: 'Active', variant: 'success', pulse: true },
    stats: [
      { label: 'Offers Analyzed', value: '45' },
      { label: 'CTA Sets Generated', value: '8' },
      { label: 'Projected', value: '$12.4K' },
    ],
    recent: { text: 'Generated CTA variants for Course offer', time: '15m ago' },
    specialties: [
      { label: 'Offers', tone: 'accent' },
      { label: 'CTAs', tone: 'accent' },
      { label: 'Funnels', tone: 'accent' },
      { label: 'Lead Magnets', tone: 'accent' },
    ],
    jobs: [
      { id: 'j1', title: 'Analyze conversion rates for ebook funnel', status: 'running', type: 'Analysis', priority: 'high', duration: '3m 15s' },
      { id: 'j2', title: 'Generate CTA set for webinar signup', status: 'running', type: 'CTA Gen', priority: 'high', duration: '55s' },
      { id: 'j3', title: 'Lead magnet scoring for Q1 offers', status: 'queued', type: 'Scoring', priority: 'medium', duration: 'Pending' },
      { id: 'j4', title: 'Funnel optimization suggestions', status: 'completed', type: 'Optimize', priority: 'medium', duration: '2m 40s' },
      { id: 'j5', title: 'A/B test results for pricing page', status: 'completed', type: 'Testing', priority: 'low', duration: '1m 30s' },
    ],
    activity: [
      { id: 'a1', text: 'Generated CTA variants for Course offer', time: '15m ago', status: 'success' },
      { id: 'a2', text: 'Ebook funnel analysis in progress', time: '18m ago', status: 'info' },
      { id: 'a3', text: 'Webinar CTA set delivered — 6 variants', time: '28m ago', status: 'success' },
      { id: 'a4', text: 'Pricing page A/B test concluded — Variant B wins', time: '35m ago', status: 'success' },
      { id: 'a5', text: 'Lead magnet score: "AI Toolkit" rated 87/100', time: '42m ago', status: 'success' },
      { id: 'a6', text: 'Funnel drop-off detected at step 3', time: '50m ago', status: 'warning' },
      { id: 'a7', text: 'Upsell sequence drafted for premium tier', time: '1h ago', status: 'info' },
      { id: 'a8', text: 'Revenue projection updated: +18% from new funnel', time: '1.5h ago', status: 'success' },
    ],
    performance: [
      { label: 'CTAs', value: 82, max: 100 },
      { label: 'Funnels', value: 71, max: 100 },
      { label: 'Conversion', value: 88, max: 100 },
      { label: 'Revenue', value: 76, max: 100 },
    ],
  },
  {
    id: 'brand',
    name: 'Brand Guardian',
    icon: ShieldCheck,
    tone: 'warning',
    status: { label: 'Monitoring', variant: 'success', pulse: true },
    stats: [
      { label: 'Reviews', value: '156' },
      { label: 'Flags Raised', value: '12' },
      { label: 'Safe Rate', value: '99.2%' },
    ],
    recent: { text: 'Flagged risky claim in health post', time: '8m ago' },
    specialties: [
      { label: 'Safety', tone: 'warning' },
      { label: 'Tone', tone: 'warning' },
      { label: 'Claims', tone: 'warning' },
      { label: 'Compliance', tone: 'warning' },
    ],
    jobs: [
      { id: 'j1', title: 'Review batch: 15 social media posts', status: 'running', type: 'Review', priority: 'high', duration: '1m 50s' },
      { id: 'j2', title: 'Compliance check on affiliate disclosures', status: 'running', type: 'Compliance', priority: 'high', duration: '2m 05s' },
      { id: 'j3', title: 'Tone analysis for email campaign', status: 'queued', type: 'Tone Check', priority: 'medium', duration: 'Pending' },
      { id: 'j4', title: 'Flagged health claim in supplement post', status: 'completed', type: 'Claims', priority: 'high', duration: '30s' },
      { id: 'j5', title: 'Weekly brand consistency report', status: 'completed', type: 'Report', priority: 'low', duration: '4m 12s' },
    ],
    activity: [
      { id: 'a1', text: 'Flagged risky claim in health post — needs revision', time: '8m ago', status: 'warning' },
      { id: 'a2', text: 'Approved 12 social posts — all brand-safe', time: '14m ago', status: 'success' },
      { id: 'a3', text: 'Compliance check started for affiliate content', time: '20m ago', status: 'info' },
      { id: 'a4', text: 'Tone drift detected in email campaign draft', time: '28m ago', status: 'warning' },
      { id: 'a5', text: 'All YouTube thumbnails passed brand review', time: '35m ago', status: 'success' },
      { id: 'a6', text: 'FTC disclosure missing in 2 affiliate posts', time: '42m ago', status: 'error' },
      { id: 'a7', text: 'Brand voice consistency score: 94%', time: '55m ago', status: 'success' },
      { id: 'a8', text: 'Weekly report generated — 3 items need attention', time: '1h ago', status: 'info' },
    ],
    performance: [
      { label: 'Safety', value: 99, max: 100 },
      { label: 'Tone', value: 94, max: 100 },
      { label: 'Speed', value: 87, max: 100 },
      { label: 'Coverage', value: 91, max: 100 },
    ],
  },
];

const COMBINED_FEED: CombinedFeedEntry[] = [
  { id: 'f1', team: 'Content', teamTone: 'primary', text: 'Generated 3 TikTok scripts for AI tools niche', time: '2m ago', status: 'success' },
  { id: 'f2', team: 'Growth', teamTone: 'success', text: 'Completed trend scan for AI tools niche', time: '5m ago', status: 'success' },
  { id: 'f3', team: 'Brand', teamTone: 'warning', text: 'Flagged risky claim in health post', time: '8m ago', status: 'warning' },
  { id: 'f4', team: 'Content', teamTone: 'primary', text: 'Completed LinkedIn carousel on productivity', time: '8m ago', status: 'success' },
  { id: 'f5', team: 'Growth', teamTone: 'success', text: 'Found 12 high-score signals on Twitter', time: '10m ago', status: 'success' },
  { id: 'f6', team: 'Revenue', teamTone: 'accent', text: 'Generated CTA variants for Course offer', time: '15m ago', status: 'success' },
  { id: 'f7', team: 'Brand', teamTone: 'warning', text: 'Approved 12 social posts — all brand-safe', time: '14m ago', status: 'success' },
  { id: 'f8', team: 'Content', teamTone: 'primary', text: 'Quality check passed for blog post batch', time: '18m ago', status: 'success' },
  { id: 'f9', team: 'Revenue', teamTone: 'accent', text: 'Ebook funnel analysis in progress', time: '18m ago', status: 'info' },
  { id: 'f10', team: 'Growth', teamTone: 'success', text: 'Started competitor analysis for TopAI launch', time: '15m ago', status: 'info' },
];

/* ------------------------------------------------------------------ */
/* Helper Components                                                   */
/* ------------------------------------------------------------------ */

const jobStatusConfig: Record<Job['status'], { icon: LucideIcon; color: string; bg: string }> = {
  running: { icon: Zap, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-muted)]' },
  queued: { icon: Clock, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--surface-elevated)]' },
  completed: { icon: CheckCircle2, color: 'text-[var(--success)]', bg: 'bg-[var(--success-muted)]' },
  failed: { icon: XCircle, color: 'text-[var(--danger)]', bg: 'bg-[var(--danger-muted)]' },
};

const priorityConfig: Record<Job['priority'], { label: string; tone: 'danger' | 'warning' | 'muted' }> = {
  high: { label: 'High', tone: 'danger' },
  medium: { label: 'Med', tone: 'warning' },
  low: { label: 'Low', tone: 'muted' },
};

const activityStatusIcon: Record<ActivityEntry['status'], { icon: LucideIcon; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-[var(--success)]' },
  info: { icon: ArrowRight, color: 'text-[var(--primary)]' },
  warning: { icon: AlertTriangle, color: 'text-[var(--warning)]' },
  error: { icon: XCircle, color: 'text-[var(--danger)]' },
};

function JobRow({ job }: { job: Job }) {
  const st = jobStatusConfig[job.status];
  const pr = priorityConfig[job.priority];
  const StatusIcon = st.icon;

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[var(--surface-hover)] transition-colors group">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', st.bg)}>
        <StatusIcon className={cn('h-3.5 w-3.5', st.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text)] truncate">{job.title}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{job.type}</p>
      </div>
      <Pill tone={pr.tone} className="shrink-0 text-[10px]">{pr.label}</Pill>
      <span className="text-[11px] text-[var(--text-muted)] shrink-0 w-16 text-right tabular-nums">
        {job.duration}
      </span>
    </div>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const cfg = activityStatusIcon[entry.status];
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-2.5 py-2 px-3 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
      <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', cfg.color)} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{entry.text}</p>
      </div>
      <span className="text-[11px] text-[var(--text-muted)] shrink-0">{entry.time}</span>
    </div>
  );
}

function PerformanceBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[var(--text-muted)] w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-medium text-[var(--text-secondary)] w-8 text-right tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Operator Team Card                                                  */
/* ------------------------------------------------------------------ */

function OperatorCard({
  team,
  isSelected,
  onSelect,
}: {
  team: OperatorTeam;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = team.icon;

  const toneMap: Record<string, string> = {
    primary: 'var(--primary)',
    success: 'var(--success)',
    accent: 'var(--accent)',
    warning: 'var(--warning)',
  };

  const toneBgMap: Record<string, string> = {
    primary: 'bg-[var(--primary-muted)]',
    success: 'bg-[var(--success-muted)]',
    accent: 'bg-[var(--accent-muted)]',
    warning: 'bg-[var(--warning-muted)]',
  };

  const toneTextMap: Record<string, string> = {
    primary: 'text-[var(--primary)]',
    success: 'text-[var(--success)]',
    accent: 'text-[var(--accent)]',
    warning: 'text-[var(--warning)]',
  };

  return (
    <GlassCard
      variant={isSelected ? 'glow' : 'default'}
      padding="none"
      hover
      className={cn(
        'cursor-pointer transition-all duration-200',
        isSelected && 'ring-1 ring-[var(--primary)] shadow-[var(--glow-primary)]',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left p-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                toneBgMap[team.tone],
              )}
            >
              <Icon className={cn('h-5 w-5', toneTextMap[team.tone])} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">{team.name}</h3>
              <StatusBadge
                label={team.status.label}
                variant={team.status.variant}
                pulse={team.status.pulse}
                size="sm"
              />
            </div>
          </div>
          <div className={cn('transition-transform duration-200', isSelected && 'rotate-180')}>
            <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {team.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-lg font-semibold text-[var(--text)] tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="flex items-center gap-2 mb-4 px-2.5 py-2 rounded-lg bg-[var(--surface-elevated)]">
          <Activity className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
          <p className="text-xs text-[var(--text-secondary)] truncate flex-1">{team.recent.text}</p>
          <span className="text-[11px] text-[var(--text-muted)] shrink-0">{team.recent.time}</span>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5">
          {team.specialties.map((s) => (
            <Pill key={s.label} tone={s.tone} className="text-[10px]">
              {s.label}
            </Pill>
          ))}
        </div>
      </button>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Team Detail Panel (expanded)                                        */
/* ------------------------------------------------------------------ */

function TeamDetailPanel({ team }: { team: OperatorTeam }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        {/* Job Queue */}
        <SectionCard title="Job Queue" subtitle={`${team.jobs.filter((j) => j.status === 'running').length} running`}>
          <div className="space-y-0.5">
            {team.jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </SectionCard>

        {/* Activity Feed */}
        <SectionCard title="Activity Feed" subtitle="Recent actions">
          <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-1">
            {team.activity.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </div>
        </SectionCard>

        {/* Performance */}
        <SectionCard title="Performance" subtitle="Output quality breakdown">
          <div className="space-y-3 mt-1">
            {team.performance.map((bar) => (
              <PerformanceBar key={bar.label} {...bar} />
            ))}
          </div>

          {/* Summary stats */}
          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-semibold text-[var(--text)] tabular-nums">
                  {Math.round(team.performance.reduce((a, b) => a + b.value, 0) / team.performance.length)}%
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">Avg Score</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--text)] tabular-nums">
                  {team.jobs.filter((j) => j.status === 'completed').length}/{team.jobs.length}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">Completed</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Combined Activity Feed                                              */
/* ------------------------------------------------------------------ */

function CombinedActivityFeed() {
  return (
    <SectionCard title="Team Activity Feed" subtitle="Combined feed from all operator teams">
      <div className="max-h-[400px] overflow-y-auto pr-1 space-y-0.5">
        {COMBINED_FEED.map((entry) => {
          const cfg = activityStatusIcon[entry.status];
          const StatusIcon = cfg.icon;

          return (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 py-2.5 px-3 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
            >
              <StatusIcon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', cfg.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Pill tone={entry.teamTone} className="text-[10px]">{entry.team}</Pill>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{entry.text}</p>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] shrink-0">{entry.time}</span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function WireframeOperatorsPage() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedTeam((prev) => (prev === id ? null : id));
  };

  const selected = TEAMS.find((t) => t.id === selectedTeam) ?? null;

  return (
    <PageWrapper>
      {/* Header */}
      <MotionFadeIn>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[var(--text)] tracking-tight">
            Operator Teams
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            AI-powered specialist teams handling your missions
          </p>
        </div>
      </MotionFadeIn>

      {/* Overall Stats */}
      <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MotionStaggerItem>
          <StatCard
            label="Total Jobs Completed"
            value={512}
            icon={Briefcase}
            tone="primary"
            subtitle="+38 today"
            subtitleTone="positive"
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            label="Active Now"
            value={18}
            icon={Zap}
            tone="success"
            subtitle="Across 4 teams"
            subtitleTone="neutral"
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            label="Avg Quality"
            value={94}
            icon={BarChart3}
            tone="accent"
            suffix="%"
            subtitle="+2% from last week"
            subtitleTone="positive"
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            label="Total Output Value"
            value="$45.2K"
            icon={DollarSign}
            tone="warning"
            subtitle="+$3.1K this week"
            subtitleTone="positive"
          />
        </MotionStaggerItem>
      </MotionStagger>

      {/* Operator Team Cards - 2x2 Grid */}
      <MotionStagger className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {TEAMS.map((team) => (
          <MotionStaggerItem key={team.id}>
            <OperatorCard
              team={team}
              isSelected={selectedTeam === team.id}
              onSelect={() => handleSelect(team.id)}
            />
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      {/* Expanded Detail Panel */}
      <AnimatePresence mode="wait">
        {selected && (
          <div className="mb-6" key={selected.id}>
            <TeamDetailPanel team={selected} />
          </div>
        )}
      </AnimatePresence>

      {/* Combined Activity Feed */}
      <MotionFadeIn delay={0.2}>
        <CombinedActivityFeed />
      </MotionFadeIn>
    </PageWrapper>
  );
}
