'use client';

import { useState } from 'react';
import {
  Map,
  Zap,
  Briefcase,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Radio,
  FileText,
  Video,
  Image as ImageIcon,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Inbox,
  Users,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StatCard,
  SectionCard,
  StatusBadge,
  Pill,
  PageWrapper,
  SectionHeader,
  EmptyState,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
} from '@/components/nebula';

// --------------- Mock Data ---------------

const OPERATOR_TEAMS = [
  { id: 'content', label: 'Content S.', tone: 'primary' as const },
  { id: 'growth', label: 'Growth O.', tone: 'success' as const },
  { id: 'revenue', label: 'Revenue C.', tone: 'accent' as const },
  { id: 'brand', label: 'Brand Gu.', tone: 'warning' as const },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', tone: 'muted' as const },
  { id: 'normal', label: 'Normal', tone: 'default' as const },
  { id: 'high', label: 'High', tone: 'warning' as const },
  { id: 'urgent', label: 'Urgent', tone: 'danger' as const },
];

type Mission = {
  id: number;
  title: string;
  status: 'running' | 'planning' | 'queued';
  progress: number;
  operators: string[];
  timestamp: string;
  jobs: { name: string; status: string }[];
};

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 12,
    title: 'Generate Q1 performance thread for X',
    status: 'running',
    progress: 72,
    operators: ['content', 'brand'],
    timestamp: '2 min ago',
    jobs: [
      { name: 'Research trending topics', status: 'done' },
      { name: 'Draft thread copy', status: 'running' },
      { name: 'Brand review', status: 'pending' },
    ],
  },
  {
    id: 11,
    title: 'Scan competitor LinkedIn activity',
    status: 'running',
    progress: 45,
    operators: ['growth'],
    timestamp: '8 min ago',
    jobs: [
      { name: 'Scrape profiles', status: 'done' },
      { name: 'Analyze engagement', status: 'running' },
    ],
  },
  {
    id: 10,
    title: 'Prepare cold outreach sequence',
    status: 'planning',
    progress: 15,
    operators: ['revenue'],
    timestamp: '12 min ago',
    jobs: [
      { name: 'Identify leads', status: 'running' },
      { name: 'Draft emails', status: 'pending' },
      { name: 'Set cadence', status: 'pending' },
    ],
  },
  {
    id: 9,
    title: 'Audit brand voice consistency',
    status: 'queued',
    progress: 0,
    operators: ['brand', 'content'],
    timestamp: '20 min ago',
    jobs: [
      { name: 'Collect recent assets', status: 'pending' },
      { name: 'Run tone analysis', status: 'pending' },
    ],
  },
];

const ACTIVITY_STREAM = [
  { id: 1, icon: CheckCircle2, text: 'Mission #12 — thread draft completed', time: '2 min ago', tone: 'success' as const },
  { id: 2, icon: AlertTriangle, text: 'Brand Guardian flagged asset BV-042', time: '5 min ago', tone: 'warning' as const },
  { id: 3, icon: TrendingUp, text: 'Growth scan found 5 new signals', time: '11 min ago', tone: 'accent' as const },
  { id: 4, icon: Radio, text: 'Revenue Closer sent 12 outreach emails', time: '18 min ago', tone: 'primary' as const },
  { id: 5, icon: CheckCircle2, text: 'Mission #8 completed successfully', time: '25 min ago', tone: 'success' as const },
  { id: 6, icon: Zap, text: 'Content Strike Team started new batch', time: '32 min ago', tone: 'primary' as const },
];

type Asset = {
  id: number;
  type: 'post' | 'video' | 'image' | 'thread';
  title: string;
  platform: string;
  platformTone: 'default' | 'primary' | 'accent' | 'danger';
  time: string;
};

const RECENT_ASSETS: Asset[] = [
  { id: 1, type: 'thread', title: 'Why AI agents beat dashboards...', platform: 'X', platformTone: 'default', time: '3m ago' },
  { id: 2, type: 'post', title: 'Agent MOE case study draft', platform: 'LinkedIn', platformTone: 'primary', time: '8m ago' },
  { id: 3, type: 'video', title: 'How MOE works while you sleep', platform: 'TikTok', platformTone: 'danger', time: '15m ago' },
  { id: 4, type: 'image', title: 'Brand kit — social banner v3', platform: 'X', platformTone: 'default', time: '22m ago' },
  { id: 5, type: 'post', title: '5 automation mistakes founders make', platform: 'LinkedIn', platformTone: 'primary', time: '30m ago' },
  { id: 6, type: 'thread', title: 'Our stack: Claude + GPT-5 Nano', platform: 'X', platformTone: 'default', time: '41m ago' },
  { id: 7, type: 'video', title: 'Revenue Closer walkthrough', platform: 'TikTok', platformTone: 'danger', time: '55m ago' },
  { id: 8, type: 'image', title: 'Infographic — operator teams', platform: 'LinkedIn', platformTone: 'primary', time: '1h ago' },
];

const ASSET_ICONS: Record<Asset['type'], typeof FileText> = {
  post: FileText,
  video: Video,
  image: ImageIcon,
  thread: MessageSquare,
};

const STATUS_MAP: Record<Mission['status'], { label: string; variant: 'success' | 'primary' | 'default'; pulse: boolean }> = {
  running: { label: 'Running', variant: 'success', pulse: true },
  planning: { label: 'Planning', variant: 'primary', pulse: false },
  queued: { label: 'Queued', variant: 'default', pulse: false },
};

// --------------- Component ---------------

let nextMissionId = 13;

export default function WireframeCommandCenter() {
  // Mission composer state
  const [prompt, setPrompt] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [priority, setPriority] = useState('normal');

  // Missions state
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [expandedMission, setExpandedMission] = useState<number | null>(null);

  const toggleTeam = (id: string) => {
    setSelectedTeams((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const launchMission = () => {
    if (!prompt.trim()) return;
    const newMission: Mission = {
      id: nextMissionId++,
      title: prompt.trim(),
      status: 'queued',
      progress: 0,
      operators: selectedTeams.length > 0 ? [...selectedTeams] : ['content'],
      timestamp: 'just now',
      jobs: [{ name: 'Initializing...', status: 'pending' }],
    };
    setMissions((prev) => [newMission, ...prev]);
    setPrompt('');
    setSelectedTeams([]);
    setPriority('normal');
  };

  const canLaunch = prompt.trim().length > 0;
  const runningCount = missions.filter((m) => m.status === 'running').length;

  return (
    <PageWrapper>
      <MotionFadeIn>
        <SectionHeader
          title="Command Center"
          description="Launch missions, monitor operators, review assets"
        />
      </MotionFadeIn>

      {/* ---- Stat Cards ---- */}
      <MotionStagger className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionStaggerItem>
          <StatCard label="Total Missions" value={missions.length + 13} icon={Map} tone="primary" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            label="Running"
            value={runningCount}
            icon={Zap}
            tone="success"
            subtitle={`${runningCount} active now`}
            subtitleTone="positive"
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Total Jobs" value={111} icon={Briefcase} tone="accent" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Pending Approvals" value={3} icon={ShieldCheck} tone="warning" />
        </MotionStaggerItem>
      </MotionStagger>

      {/* ---- Main Grid ---- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ====== LEFT COLUMN (3/5) ====== */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Mission Composer */}
          <MotionFadeIn>
            <SectionCard title="New Mission">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should the operators do?"
                rows={3}
                className={cn(
                  'w-full resize-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                  'focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]',
                )}
              />

              {/* Operator team pills */}
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Operator Teams</p>
                <div className="flex flex-wrap gap-2">
                  {OPERATOR_TEAMS.map((team) => {
                    const active = selectedTeams.includes(team.id);
                    return (
                      <button
                        key={team.id}
                        onClick={() => toggleTeam(team.id)}
                        className={cn(
                          'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium transition-all',
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                        )}
                      >
                        {team.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority selector */}
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Priority</p>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => {
                    const active = priority === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPriority(p.id)}
                        className={cn(
                          'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium transition-all',
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Launch button */}
              <button
                disabled={!canLaunch}
                onClick={launchMission}
                className={cn(
                  'mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] px-4 py-2.5 text-sm font-semibold transition-all',
                  canLaunch
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:brightness-110'
                    : 'cursor-not-allowed bg-[var(--surface-elevated)] text-[var(--text-disabled)]',
                )}
              >
                <Send className="h-4 w-4" />
                Launch Mission
              </button>
            </SectionCard>
          </MotionFadeIn>

          {/* Active Missions */}
          <MotionFadeIn>
            <SectionCard
              title="Active Missions"
              action={
                <Pill tone="primary">{missions.length}</Pill>
              }
            >
              {missions.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No active missions"
                  description="Launch a mission above to get started"
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {missions.map((mission) => {
                    const statusInfo = STATUS_MAP[mission.status];
                    const isExpanded = expandedMission === mission.id;
                    const teamLabels = OPERATOR_TEAMS.filter((t) =>
                      mission.operators.includes(t.id),
                    );

                    return (
                      <button
                        key={mission.id}
                        onClick={() =>
                          setExpandedMission(isExpanded ? null : mission.id)
                        }
                        className={cn(
                          'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)] p-3 text-left transition-colors hover:border-[var(--border-hover)]',
                          isExpanded && 'border-[var(--primary)]/40',
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[var(--text-disabled)]">
                                #{mission.id}
                              </span>
                              <StatusBadge
                                label={statusInfo.label}
                                variant={statusInfo.variant}
                                pulse={statusInfo.pulse}
                                size="sm"
                              />
                            </div>
                            <p className="mt-1 text-sm font-medium text-[var(--text)] truncate">
                              {mission.title}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-[var(--text-muted)]">
                              {mission.timestamp}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500"
                              style={{ width: `${mission.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-[var(--text-muted)]">
                            {mission.progress}%
                          </span>
                        </div>

                        {/* Operator pills */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {teamLabels.map((t) => (
                            <Pill key={t.id} tone={t.tone}>
                              {t.label}
                            </Pill>
                          ))}
                        </div>

                        {/* Expanded job breakdown */}
                        {isExpanded && (
                          <div className="mt-3 border-t border-[var(--border)] pt-3">
                            <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
                              Job Breakdown
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {mission.jobs.map((job, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full shrink-0',
                                      job.status === 'done' && 'bg-[var(--success)]',
                                      job.status === 'running' && 'bg-[var(--primary)] animate-pulse',
                                      job.status === 'pending' && 'bg-[var(--text-disabled)]',
                                    )}
                                  />
                                  <span className="text-[var(--text-secondary)]">
                                    {job.name}
                                  </span>
                                  <span className="ml-auto text-[var(--text-muted)] capitalize">
                                    {job.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </MotionFadeIn>
        </div>

        {/* ====== RIGHT COLUMN (2/5) ====== */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* System Intelligence */}
          <MotionFadeIn>
            <SectionCard title="System Intelligence">
              <div className="flex flex-col gap-3">
                {ACTIVITY_STREAM.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-2.5"
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                          item.tone === 'success' && 'bg-[var(--success-muted)] text-[var(--success)]',
                          item.tone === 'warning' && 'bg-[var(--warning-muted)] text-[var(--warning)]',
                          item.tone === 'accent' && 'bg-[var(--accent-muted)] text-[var(--accent)]',
                          item.tone === 'primary' && 'bg-[var(--primary-muted)] text-[var(--primary)]',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[var(--text-secondary)] leading-snug">
                          {item.text}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* System health */}
              <div className="mt-4 flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" />
                <span className="text-xs font-medium text-[var(--success)]">
                  All Systems Operational
                </span>
              </div>
            </SectionCard>
          </MotionFadeIn>

          {/* System Status */}
          <MotionFadeIn>
            <SectionCard title="System Status">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">Job Queue</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text)]">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">Active Operators</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text)]">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">Approval Queue</span>
                  </div>
                  <button className="text-sm font-semibold text-[var(--primary)] hover:underline">
                    3 pending
                  </button>
                </div>
              </div>
            </SectionCard>
          </MotionFadeIn>

          {/* Recent Assets */}
          <MotionFadeIn>
            <SectionCard title="Recent Assets" action={<Pill tone="muted">8</Pill>}>
              <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
                {RECENT_ASSETS.map((asset) => {
                  const Icon = ASSET_ICONS[asset.type];
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 transition-colors hover:border-[var(--border-hover)]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                      <p className="min-w-0 flex-1 truncate text-xs text-[var(--text-secondary)]">
                        {asset.title}
                      </p>
                      <Pill tone={asset.platformTone}>{asset.platform}</Pill>
                      <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                        {asset.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </MotionFadeIn>
        </div>
      </div>
    </PageWrapper>
  );
}
