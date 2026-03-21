'use client';

import { useState, useMemo } from 'react';
import {
  GlassCard,
  StatCard,
  StatusBadge,
  Pill,
  PageWrapper,
  SectionHeader,
  EmptyState,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
} from '@/components/nebula';
import { cn } from '@/lib/utils';
import {
  Map,
  Zap,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  ChevronDown,
  Clock,
  ArrowRight,
  Target,
  AlertTriangle,
  Inbox,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type MissionStatus = 'planning' | 'running' | 'completed' | 'failed';
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type OperatorTeam = 'Content Strike' | 'Growth' | 'Revenue' | 'Brand Guardian';

interface Job {
  id: string;
  title: string;
  status: MissionStatus | 'queued';
  operator: OperatorTeam;
  type: string;
  duration: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  priority: Priority;
  teams: OperatorTeam[];
  jobsComplete: number;
  jobsTotal: number;
  createdAt: string;
  plan: string[];
  jobs: Job[];
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Create a 45-second TikTok reel script about Agent Moe',
    description:
      'Write, storyboard, and produce a 45-second vertical TikTok reel showcasing how Agent Moe automates content creation while the user sleeps. Include AI-generated scene images and voiceover script.',
    status: 'running',
    priority: 'high',
    teams: ['Content Strike', 'Brand Guardian'],
    jobsComplete: 5,
    jobsTotal: 7,
    createdAt: '2 hours ago',
    plan: [
      'Research trending TikTok formats and hooks',
      'Write script with 7-scene storyboard',
      'Generate AI images for each scene',
      'Compose voiceover narration text',
      'Render video with transitions',
      'Brand review and approval',
      'Schedule for optimal posting time',
    ],
    jobs: [
      { id: 'j1', title: 'Research trending hooks', status: 'completed', operator: 'Content Strike', type: 'research', duration: '2m 14s' },
      { id: 'j2', title: 'Write 7-scene script', status: 'completed', operator: 'Content Strike', type: 'generation', duration: '3m 42s' },
      { id: 'j3', title: 'Generate scene images', status: 'completed', operator: 'Content Strike', type: 'generation', duration: '5m 08s' },
      { id: 'j4', title: 'Compose voiceover text', status: 'completed', operator: 'Content Strike', type: 'generation', duration: '1m 55s' },
      { id: 'j5', title: 'Render video', status: 'completed', operator: 'Content Strike', type: 'render', duration: '4m 20s' },
      { id: 'j6', title: 'Brand compliance review', status: 'running', operator: 'Brand Guardian', type: 'review', duration: '1m 10s' },
      { id: 'j7', title: 'Schedule post', status: 'queued', operator: 'Growth', type: 'action', duration: '--' },
    ],
  },
  {
    id: 'm2',
    title: 'Analyze competitor pricing strategies for Q2',
    description:
      'Deep dive into 5 top competitor pricing pages, extract tiers, features, and positioning. Produce a comparison matrix and strategic recommendations.',
    status: 'completed',
    priority: 'normal',
    teams: ['Revenue', 'Growth'],
    jobsComplete: 6,
    jobsTotal: 6,
    createdAt: '1 day ago',
    plan: [
      'Identify top 5 competitors',
      'Scrape pricing pages via browser agent',
      'Extract tier data into structured format',
      'Build comparison matrix',
      'Analyze positioning gaps',
      'Generate strategic recommendations',
    ],
    jobs: [
      { id: 'j8', title: 'Identify competitors', status: 'completed', operator: 'Growth', type: 'research', duration: '1m 30s' },
      { id: 'j9', title: 'Scrape pricing pages', status: 'completed', operator: 'Growth', type: 'browser', duration: '8m 45s' },
      { id: 'j10', title: 'Extract tier data', status: 'completed', operator: 'Revenue', type: 'analysis', duration: '2m 12s' },
      { id: 'j11', title: 'Build comparison matrix', status: 'completed', operator: 'Revenue', type: 'generation', duration: '3m 05s' },
      { id: 'j12', title: 'Analyze positioning gaps', status: 'completed', operator: 'Revenue', type: 'analysis', duration: '2m 48s' },
      { id: 'j13', title: 'Generate recommendations', status: 'completed', operator: 'Revenue', type: 'generation', duration: '4m 15s' },
    ],
  },
  {
    id: 'm3',
    title: 'Launch Instagram carousel campaign for new features',
    description:
      'Design and schedule a 10-slide Instagram carousel highlighting the top 5 new features released this month. Include brand-consistent visuals and copy.',
    status: 'planning',
    priority: 'normal',
    teams: ['Content Strike', 'Brand Guardian'],
    jobsComplete: 0,
    jobsTotal: 5,
    createdAt: '30 minutes ago',
    plan: [
      'Select top 5 features to highlight',
      'Write slide copy for each feature',
      'Generate carousel images with branding',
      'Brand Guardian review',
      'Schedule carousel post',
    ],
    jobs: [
      { id: 'j14', title: 'Select features', status: 'queued', operator: 'Content Strike', type: 'research', duration: '--' },
      { id: 'j15', title: 'Write slide copy', status: 'queued', operator: 'Content Strike', type: 'generation', duration: '--' },
      { id: 'j16', title: 'Generate carousel images', status: 'queued', operator: 'Content Strike', type: 'generation', duration: '--' },
      { id: 'j17', title: 'Brand review', status: 'queued', operator: 'Brand Guardian', type: 'review', duration: '--' },
      { id: 'j18', title: 'Schedule post', status: 'queued', operator: 'Growth', type: 'action', duration: '--' },
    ],
  },
  {
    id: 'm4',
    title: 'Monitor brand mentions and sentiment across social',
    description:
      'Set up real-time monitoring of brand mentions on Twitter/X, Reddit, and LinkedIn. Classify sentiment and flag negative mentions for immediate response.',
    status: 'running',
    priority: 'urgent',
    teams: ['Brand Guardian', 'Growth'],
    jobsComplete: 3,
    jobsTotal: 5,
    createdAt: '4 hours ago',
    plan: [
      'Configure social listening queries',
      'Scrape mentions from target platforms',
      'Classify sentiment with AI',
      'Flag negative mentions for review',
      'Generate daily sentiment report',
    ],
    jobs: [
      { id: 'j19', title: 'Configure queries', status: 'completed', operator: 'Brand Guardian', type: 'config', duration: '0m 45s' },
      { id: 'j20', title: 'Scrape social mentions', status: 'completed', operator: 'Growth', type: 'browser', duration: '6m 30s' },
      { id: 'j21', title: 'Classify sentiment', status: 'completed', operator: 'Brand Guardian', type: 'analysis', duration: '3m 10s' },
      { id: 'j22', title: 'Flag negative mentions', status: 'running', operator: 'Brand Guardian', type: 'action', duration: '1m 22s' },
      { id: 'j23', title: 'Generate sentiment report', status: 'queued', operator: 'Brand Guardian', type: 'generation', duration: '--' },
    ],
  },
  {
    id: 'm5',
    title: 'Generate weekly newsletter content',
    description:
      'Curate top 5 industry stories, write newsletter sections, add product updates, and prepare the email for sending via connected email service.',
    status: 'completed',
    priority: 'normal',
    teams: ['Content Strike'],
    jobsComplete: 4,
    jobsTotal: 4,
    createdAt: '2 days ago',
    plan: [
      'Curate top 5 industry stories',
      'Write newsletter sections',
      'Add product updates section',
      'Format and prepare email',
    ],
    jobs: [
      { id: 'j24', title: 'Curate stories', status: 'completed', operator: 'Content Strike', type: 'research', duration: '3m 20s' },
      { id: 'j25', title: 'Write sections', status: 'completed', operator: 'Content Strike', type: 'generation', duration: '5m 45s' },
      { id: 'j26', title: 'Product updates', status: 'completed', operator: 'Content Strike', type: 'generation', duration: '2m 10s' },
      { id: 'j27', title: 'Format email', status: 'completed', operator: 'Content Strike', type: 'action', duration: '1m 05s' },
    ],
  },
  {
    id: 'm6',
    title: 'A/B test landing page headline variants',
    description:
      'Generate 5 headline variants for the main landing page, set up A/B test tracking, and monitor conversion rates over 48 hours.',
    status: 'failed',
    priority: 'high',
    teams: ['Growth', 'Revenue'],
    jobsComplete: 2,
    jobsTotal: 5,
    createdAt: '3 days ago',
    plan: [
      'Analyze current headline performance',
      'Generate 5 headline variants',
      'Set up A/B test infrastructure',
      'Deploy test to production',
      'Monitor and report results',
    ],
    jobs: [
      { id: 'j28', title: 'Analyze current headline', status: 'completed', operator: 'Growth', type: 'analysis', duration: '2m 15s' },
      { id: 'j29', title: 'Generate headline variants', status: 'completed', operator: 'Growth', type: 'generation', duration: '1m 50s' },
      { id: 'j30', title: 'Set up A/B infrastructure', status: 'failed', operator: 'Revenue', type: 'config', duration: '4m 02s' },
      { id: 'j31', title: 'Deploy to production', status: 'queued', operator: 'Revenue', type: 'action', duration: '--' },
      { id: 'j32', title: 'Monitor results', status: 'queued', operator: 'Growth', type: 'analysis', duration: '--' },
    ],
  },
  {
    id: 'm7',
    title: 'Build prospect outreach sequence for SaaS leads',
    description:
      'Create a 5-email drip sequence targeting SaaS founders, including personalized opening lines, value propositions, and CTA optimization.',
    status: 'completed',
    priority: 'high',
    teams: ['Revenue', 'Content Strike'],
    jobsComplete: 5,
    jobsTotal: 5,
    createdAt: '5 days ago',
    plan: [
      'Define target persona and pain points',
      'Write 5-email drip sequence',
      'Generate personalized opening lines',
      'Optimize CTAs with scoring model',
      'Load sequence into email automation',
    ],
    jobs: [
      { id: 'j33', title: 'Define persona', status: 'completed', operator: 'Revenue', type: 'research', duration: '2m 30s' },
      { id: 'j34', title: 'Write email sequence', status: 'completed', operator: 'Content Strike', type: 'generation', duration: '7m 12s' },
      { id: 'j35', title: 'Personalized openers', status: 'completed', operator: 'Content Strike', type: 'generation', duration: '3m 40s' },
      { id: 'j36', title: 'Optimize CTAs', status: 'completed', operator: 'Revenue', type: 'analysis', duration: '1m 55s' },
      { id: 'j37', title: 'Load into automation', status: 'completed', operator: 'Revenue', type: 'action', duration: '0m 42s' },
    ],
  },
  {
    id: 'm8',
    title: 'Audit website for SEO technical issues',
    description:
      'Crawl the entire website, identify broken links, missing meta tags, slow pages, and generate a prioritized fix list with estimated impact scores.',
    status: 'running',
    priority: 'normal',
    teams: ['Growth'],
    jobsComplete: 2,
    jobsTotal: 4,
    createdAt: '6 hours ago',
    plan: [
      'Crawl all website pages',
      'Identify technical SEO issues',
      'Score issues by impact',
      'Generate prioritized fix report',
    ],
    jobs: [
      { id: 'j38', title: 'Crawl website pages', status: 'completed', operator: 'Growth', type: 'browser', duration: '12m 30s' },
      { id: 'j39', title: 'Identify SEO issues', status: 'completed', operator: 'Growth', type: 'analysis', duration: '4m 15s' },
      { id: 'j40', title: 'Score by impact', status: 'running', operator: 'Growth', type: 'analysis', duration: '2m 05s' },
      { id: 'j41', title: 'Generate fix report', status: 'queued', operator: 'Growth', type: 'generation', duration: '--' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const STATUS_BADGE_MAP: Record<
  MissionStatus | 'queued',
  { variant: 'warning' | 'primary' | 'success' | 'danger' | 'default'; pulse?: boolean }
> = {
  planning: { variant: 'warning' },
  running: { variant: 'primary', pulse: true },
  completed: { variant: 'success' },
  failed: { variant: 'danger' },
  queued: { variant: 'default' },
};

const PRIORITY_PILL_MAP: Record<Priority, { tone: 'muted' | 'default' | 'warning' | 'danger' }> = {
  low: { tone: 'muted' },
  normal: { tone: 'default' },
  high: { tone: 'warning' },
  urgent: { tone: 'danger' },
};

const TEAM_TONE_MAP: Record<OperatorTeam, 'primary' | 'success' | 'accent' | 'danger'> = {
  'Content Strike': 'primary',
  Growth: 'success',
  Revenue: 'accent',
  'Brand Guardian': 'danger',
};

const PROGRESS_COLOR_MAP: Record<MissionStatus, string> = {
  planning: 'bg-[var(--warning)]',
  running: 'bg-[var(--primary)]',
  completed: 'bg-[var(--success)]',
  failed: 'bg-[var(--danger)]',
};

const STATUS_OPTIONS: { label: string; value: MissionStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Planning', value: 'planning' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
];

const TEAM_OPTIONS: { label: string; value: OperatorTeam | 'all' }[] = [
  { label: 'All Teams', value: 'all' },
  { label: 'Content Strike', value: 'Content Strike' },
  { label: 'Growth', value: 'Growth' },
  { label: 'Revenue', value: 'Revenue' },
  { label: 'Brand Guardian', value: 'Brand Guardian' },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function WireframeMissionsPage() {
  const [statusFilter, setStatusFilter] = useState<MissionStatus | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<OperatorTeam | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>('m1');
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_MISSIONS.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (teamFilter !== 'all' && !m.teams.includes(teamFilter)) return false;
      if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, teamFilter, search]);

  const selected = MOCK_MISSIONS.find((m) => m.id === selectedId) ?? null;

  return (
    <PageWrapper>
      <MotionFadeIn>
        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)] tracking-tight">Missions</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Track and manage all operator missions
            </p>
          </div>
          <button
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)]',
              'bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white',
              'text-sm font-medium shadow-md',
              'hover:opacity-90 transition-opacity',
            )}
          >
            <Plus size={16} />
            New Mission
          </button>
        </div>

        {/* ---- Stats Row ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Missions" value={24} icon={Map} tone="default" />
          <StatCard label="Active" value={3} icon={Zap} tone="primary" subtitle="Running now" subtitleTone="neutral" />
          <StatCard label="Completed" value={18} icon={CheckCircle2} tone="success" subtitle="+4 this week" subtitleTone="positive" />
          <StatCard label="Success Rate" value={92} icon={TrendingUp} tone="accent" suffix="%" subtitle="Last 30 days" subtitleTone="neutral" />
        </div>

        {/* ---- Filter Bar ---- */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors',
                  statusFilter === opt.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Team dropdown */}
          <div className="relative">
            <button
              onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)]',
                'bg-[var(--surface-elevated)] border border-[var(--border)]',
                'text-xs font-medium text-[var(--text-secondary)]',
                'hover:border-[var(--border-hover)] transition-colors',
              )}
            >
              {TEAM_OPTIONS.find((t) => t.value === teamFilter)?.label}
              <ChevronDown size={14} className={cn('transition-transform', teamDropdownOpen && 'rotate-180')} />
            </button>
            {teamDropdownOpen && (
              <div
                className={cn(
                  'absolute right-0 top-full mt-1 z-20 min-w-[180px]',
                  'rounded-[var(--radius-sm)] border border-[var(--border)]',
                  'bg-[var(--surface-solid)] shadow-lg',
                )}
              >
                {TEAM_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTeamFilter(opt.value);
                      setTeamDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs font-medium transition-colors',
                      teamFilter === opt.value
                        ? 'text-[var(--primary)] bg-[var(--primary-muted)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search missions..."
              className={cn(
                'w-full md:w-56 pl-8 pr-3 py-1.5 rounded-[var(--radius-sm)]',
                'bg-[var(--surface-elevated)] border border-[var(--border)]',
                'text-xs text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                'focus:outline-none focus:border-[var(--primary)] transition-colors',
              )}
            />
          </div>
        </div>

        {/* ---- Main Content: Mission List + Detail ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
          {/* Left: Mission List */}
          <div className="flex flex-col gap-3 min-h-0">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No missions found"
                description="Try adjusting your filters or create a new mission."
              />
            ) : (
              <MotionStagger className="flex flex-col gap-3">
                {filtered.map((mission) => {
                  const badge = STATUS_BADGE_MAP[mission.status];
                  const priorityPill = PRIORITY_PILL_MAP[mission.priority];
                  const pct = mission.jobsTotal > 0 ? Math.round((mission.jobsComplete / mission.jobsTotal) * 100) : 0;
                  const isSelected = selectedId === mission.id;

                  return (
                    <MotionStaggerItem key={mission.id}>
                      <GlassCard
                        className={cn(
                          'cursor-pointer',
                          isSelected && 'ring-1 ring-[var(--primary)] border-[var(--primary)]',
                        )}
                        padding="md"
                        hover
                        as="button"
                      >
                        <div
                          className="w-full text-left"
                          onClick={() => setSelectedId(mission.id)}
                        >
                          {/* Top row: title + status */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-sm font-medium text-[var(--text)] leading-snug line-clamp-2 flex-1">
                              {mission.title}
                            </h4>
                            <StatusBadge
                              label={mission.status}
                              variant={badge.variant}
                              pulse={badge.pulse}
                              size="sm"
                            />
                          </div>

                          {/* Pills row: priority + teams */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <Pill tone={priorityPill.tone}>{mission.priority}</Pill>
                            {mission.teams.map((team) => (
                              <Pill key={team} tone={TEAM_TONE_MAP[team]}>
                                {team}
                              </Pill>
                            ))}
                          </div>

                          {/* Progress bar */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
                              <span>
                                {mission.jobsComplete}/{mission.jobsTotal} jobs complete
                              </span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-500', PROGRESS_COLOR_MAP[mission.status])}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer: created */}
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-disabled)]">
                            <Clock size={11} />
                            <span>{mission.createdAt}</span>
                          </div>
                        </div>
                      </GlassCard>
                    </MotionStaggerItem>
                  );
                })}
              </MotionStagger>
            )}
          </div>

          {/* Right: Mission Detail */}
          <div className="min-h-0">
            {selected ? (
              <MissionDetailPanel mission={selected} />
            ) : (
              <GlassCard className="h-full flex items-center justify-center min-h-[400px]" padding="lg">
                <div className="text-center">
                  <Target size={32} className="mx-auto text-[var(--text-disabled)] mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">Select a mission to view details</p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </MotionFadeIn>
    </PageWrapper>
  );
}

/* ------------------------------------------------------------------ */
/* Mission Detail Panel                                                */
/* ------------------------------------------------------------------ */

function MissionDetailPanel({ mission }: { mission: Mission }) {
  const badge = STATUS_BADGE_MAP[mission.status];
  const pct = mission.jobsTotal > 0 ? Math.round((mission.jobsComplete / mission.jobsTotal) * 100) : 0;

  return (
    <GlassCard padding="lg" className="sticky top-14">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--text)] leading-snug mb-1">
            {mission.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge label={mission.status} variant={badge.variant} pulse={badge.pulse} size="md" />
            <Pill tone={PRIORITY_PILL_MAP[mission.priority].tone}>{mission.priority} priority</Pill>
            {mission.teams.map((team) => (
              <Pill key={team} tone={TEAM_TONE_MAP[team]}>
                {team}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
        {mission.description}
      </p>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
          <span className="font-medium">
            Progress: {mission.jobsComplete}/{mission.jobsTotal} jobs
          </span>
          <span className="font-semibold text-[var(--text)]">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', PROGRESS_COLOR_MAP[mission.status])}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Plan */}
      <SectionHeader title="Plan" description="Step-by-step breakdown" className="mb-3" />
      <div className="space-y-2 mb-6">
        {mission.plan.map((step, i) => {
          const done = i < mission.jobsComplete;
          const active = i === mission.jobsComplete && mission.status === 'running';
          return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 py-2 px-3 rounded-[var(--radius-sm)]',
                active && 'bg-[var(--primary-muted)]',
                done && 'opacity-70',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 mt-0.5',
                  done
                    ? 'bg-[var(--success)] text-white'
                    : active
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
                )}
              >
                {done ? (
                  <CheckCircle2 size={12} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'text-xs leading-snug',
                  done
                    ? 'text-[var(--text-muted)] line-through'
                    : active
                      ? 'text-[var(--primary)] font-medium'
                      : 'text-[var(--text-secondary)]',
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Jobs */}
      <SectionHeader title="Jobs" description="Individual tasks and their status" className="mb-3" />
      <div className="space-y-1.5">
        {mission.jobs.map((job) => {
          const jBadge = STATUS_BADGE_MAP[job.status];
          return (
            <div
              key={job.id}
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-[var(--radius-sm)]',
                'bg-[var(--surface)] border border-[var(--border-subtle)]',
                'transition-colors hover:bg-[var(--surface-hover)]',
              )}
            >
              {/* Status dot */}
              <StatusBadge label={job.status} variant={jBadge.variant} pulse={jBadge.pulse} size="sm" />

              {/* Title */}
              <span className="flex-1 text-xs font-medium text-[var(--text)] truncate">
                {job.title}
              </span>

              {/* Operator */}
              <Pill tone={TEAM_TONE_MAP[job.operator]}>{job.operator}</Pill>

              {/* Type */}
              <span className="hidden sm:inline text-[10px] text-[var(--text-disabled)] uppercase tracking-wide font-medium min-w-[60px] text-right">
                {job.type}
              </span>

              {/* Duration */}
              <span className="text-[11px] text-[var(--text-muted)] font-mono min-w-[55px] text-right">
                {job.duration}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline footer */}
      <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <Clock size={12} />
          Created {mission.createdAt}
        </span>
        {mission.status === 'running' && (
          <span className="flex items-center gap-1.5 text-[var(--primary)]">
            <ArrowRight size={12} />
            In progress
          </span>
        )}
        {mission.status === 'failed' && (
          <span className="flex items-center gap-1.5 text-[var(--danger)]">
            <AlertTriangle size={12} />
            Failed at step {mission.jobsComplete + 1}
          </span>
        )}
        {mission.status === 'completed' && (
          <span className="flex items-center gap-1.5 text-[var(--success)]">
            <CheckCircle2 size={12} />
            All jobs complete
          </span>
        )}
      </div>
    </GlassCard>
  );
}
