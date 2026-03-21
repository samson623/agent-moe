'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  GlassCard,
  StatCard,
  SectionCard,
  StatusBadge,
  Pill,
  PageWrapper,
  EmptyState,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  AnimatePresence,
  motion,
  panelSlideRight,
  overlayVariants,
} from '@/components/nebula';
import { cn } from '@/lib/utils';
import {
  FileText,
  Video,
  MessageSquare,
  Megaphone,
  Image,
  ListTree,
  Layers,
  CheckCircle2,
  Clock,
  Globe,
  Search,
  LayoutGrid,
  List,
  X,
  Edit3,
  Copy,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  ChevronRight,
  History,
  Target,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentType = 'Post' | 'Script' | 'Caption' | 'CTA' | 'Thumbnail' | 'Thread';
type Platform = 'X' | 'LinkedIn' | 'Instagram' | 'TikTok' | 'YouTube';
type Status = 'Draft' | 'Review' | 'Approved' | 'Published' | 'Archived';

interface MockAsset {
  id: string;
  title: string;
  body: string;
  type: ContentType;
  platform: Platform;
  status: Status;
  confidence: number;
  operator: string;
  missionId: string;
  createdAt: string;
  versions: { id: number; timestamp: string; body: string }[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ASSETS: MockAsset[] = [
  {
    id: 'a1',
    title: 'AI Productivity Thread',
    body: 'Thread: 7 ways AI agents are replacing entire departments in 2026. Most companies are still stuck in the "chatbot" era...\n\n1/ Autonomous task execution\n2/ Multi-agent orchestration\n3/ Real-time data pipelines\n4/ Self-healing workflows\n5/ Predictive resource allocation\n6/ Cross-platform integration\n7/ Continuous learning loops',
    type: 'Thread',
    platform: 'X',
    status: 'Approved',
    confidence: 94,
    operator: 'Content Strike Team',
    missionId: 'M-0042',
    createdAt: '2026-03-17T08:30:00Z',
    versions: [
      { id: 3, timestamp: '2026-03-17T08:30:00Z', body: 'Thread: 7 ways AI agents are replacing entire departments in 2026. Most companies are still stuck in the "chatbot" era...' },
      { id: 2, timestamp: '2026-03-16T22:15:00Z', body: 'Thread: 5 ways AI agents are changing work in 2026. Companies are missing the shift...' },
      { id: 1, timestamp: '2026-03-16T14:00:00Z', body: 'Draft: AI agents are the future of work. Here is why...' },
    ],
  },
  {
    id: 'a2',
    title: 'LinkedIn Thought Leadership',
    body: 'The biggest misconception about AI automation: it replaces people.\n\nThe reality? It replaces *tasks*.\n\nOur team went from 12 hours of manual reporting to 12 minutes. Nobody lost their job. Everyone got promoted.',
    type: 'Post',
    platform: 'LinkedIn',
    status: 'Published',
    confidence: 91,
    operator: 'Growth Operator',
    missionId: 'M-0038',
    createdAt: '2026-03-16T14:20:00Z',
    versions: [
      { id: 2, timestamp: '2026-03-16T14:20:00Z', body: 'The biggest misconception about AI automation: it replaces people...' },
      { id: 1, timestamp: '2026-03-15T19:00:00Z', body: 'AI automation doesn\'t replace people, it replaces tasks. Here\'s our experience...' },
    ],
  },
  {
    id: 'a3',
    title: 'TikTok Hook Script',
    body: '[HOOK] "Stop scrolling if you run a business."\n[PROBLEM] "You\'re probably spending 6 hours a day on tasks AI could do in 6 minutes."\n[AGITATE] "Your competitors already figured this out."\n[SOLUTION] "Here\'s the exact AI stack we use..."\n[CTA] "Follow for part 2."',
    type: 'Script',
    platform: 'TikTok',
    status: 'Review',
    confidence: 87,
    operator: 'Content Strike Team',
    missionId: 'M-0045',
    createdAt: '2026-03-17T06:00:00Z',
    versions: [
      { id: 2, timestamp: '2026-03-17T06:00:00Z', body: '[HOOK] "Stop scrolling if you run a business..."' },
      { id: 1, timestamp: '2026-03-16T23:30:00Z', body: 'Hey business owners, let me show you something...' },
    ],
  },
  {
    id: 'a4',
    title: 'Instagram Caption - AI Tools',
    body: 'The AI tools we use daily (that actually work):\n\n1. Agent orchestration for content\n2. Automated lead scoring\n3. Real-time analytics dashboards\n4. Predictive revenue modeling\n\nSave this for later. You\'ll need it.',
    type: 'Caption',
    platform: 'Instagram',
    status: 'Approved',
    confidence: 88,
    operator: 'Content Strike Team',
    missionId: 'M-0041',
    createdAt: '2026-03-16T20:15:00Z',
    versions: [
      { id: 1, timestamp: '2026-03-16T20:15:00Z', body: 'The AI tools we use daily (that actually work)...' },
    ],
  },
  {
    id: 'a5',
    title: 'YouTube CTA Overlay',
    body: 'Ready to automate your entire content pipeline? Link in description. Use code AGENT50 for 50% off your first month.',
    type: 'CTA',
    platform: 'YouTube',
    status: 'Draft',
    confidence: 72,
    operator: 'Revenue Closer',
    missionId: 'M-0039',
    createdAt: '2026-03-17T02:45:00Z',
    versions: [
      { id: 1, timestamp: '2026-03-17T02:45:00Z', body: 'Ready to automate your entire content pipeline? Link in description...' },
    ],
  },
  {
    id: 'a6',
    title: 'Thumbnail - AI Dashboard',
    body: '[Thumbnail Design]\nLayout: Split screen\nLeft: Overwhelmed person at desk with papers\nRight: Clean AI dashboard with green metrics\nText overlay: "Before vs After AI"\nStyle: Bold contrast, neon accents',
    type: 'Thumbnail',
    platform: 'YouTube',
    status: 'Review',
    confidence: 79,
    operator: 'Content Strike Team',
    missionId: 'M-0040',
    createdAt: '2026-03-16T18:00:00Z',
    versions: [
      { id: 2, timestamp: '2026-03-16T18:00:00Z', body: '[Thumbnail Design] Layout: Split screen...' },
      { id: 1, timestamp: '2026-03-16T10:00:00Z', body: '[Thumbnail] Simple dashboard screenshot with text' },
    ],
  },
  {
    id: 'a7',
    title: 'X Post - Agent Moe Launch',
    body: 'Agent Moe just ran 47 tasks while I was sleeping.\n\n- 12 content pieces drafted\n- 8 leads scored and routed\n- 15 analytics reports generated\n- 12 social posts scheduled\n\nThis is what autonomous AI looks like.\n\nNot a chatbot. An operator.',
    type: 'Post',
    platform: 'X',
    status: 'Published',
    confidence: 96,
    operator: 'Growth Operator',
    missionId: 'M-0035',
    createdAt: '2026-03-15T09:00:00Z',
    versions: [
      { id: 3, timestamp: '2026-03-15T09:00:00Z', body: 'Agent Moe just ran 47 tasks while I was sleeping...' },
      { id: 2, timestamp: '2026-03-14T22:00:00Z', body: 'Agent Moe completed 47 tasks overnight. Here is the breakdown...' },
      { id: 1, timestamp: '2026-03-14T16:00:00Z', body: 'Our AI agent ran autonomously last night. Results inside.' },
    ],
  },
  {
    id: 'a8',
    title: 'LinkedIn Post - Hiring AI',
    body: 'We stopped hiring for 3 roles last quarter.\n\nNot because of budget cuts.\n\nBecause AI agents handle those workflows now.\n\nThe ROI? 340% in 60 days.\n\nHere\'s what we learned about building an AI-first team...',
    type: 'Post',
    platform: 'LinkedIn',
    status: 'Draft',
    confidence: 83,
    operator: 'Growth Operator',
    missionId: 'M-0044',
    createdAt: '2026-03-17T04:30:00Z',
    versions: [
      { id: 1, timestamp: '2026-03-17T04:30:00Z', body: 'We stopped hiring for 3 roles last quarter...' },
    ],
  },
  {
    id: 'a9',
    title: 'Instagram Reel Script',
    body: '[SCENE 1] Close-up of phone notification: "47 tasks completed"\n[SCENE 2] Dashboard with green metrics scrolling\n[SCENE 3] Person relaxing with coffee, laptop shows AI running\n[SCENE 4] Text: "This is Agent Moe"\n[CTA] "Link in bio"',
    type: 'Script',
    platform: 'Instagram',
    status: 'Approved',
    confidence: 90,
    operator: 'Content Strike Team',
    missionId: 'M-0043',
    createdAt: '2026-03-16T16:45:00Z',
    versions: [
      { id: 1, timestamp: '2026-03-16T16:45:00Z', body: '[SCENE 1] Close-up of phone notification...' },
    ],
  },
  {
    id: 'a10',
    title: 'X Thread - Revenue Stack',
    body: 'Our AI revenue stack generates $12K/mo on autopilot.\n\nHere\'s the exact setup (no gatekeeping):\n\n1/ Lead capture via AI forms\n2/ Instant scoring with GPT-5 Nano\n3/ Personalized outreach sequences\n4/ Automated follow-ups\n5/ Revenue attribution dashboard',
    type: 'Thread',
    platform: 'X',
    status: 'Review',
    confidence: 85,
    operator: 'Revenue Closer',
    missionId: 'M-0046',
    createdAt: '2026-03-17T07:15:00Z',
    versions: [
      { id: 2, timestamp: '2026-03-17T07:15:00Z', body: 'Our AI revenue stack generates $12K/mo on autopilot...' },
      { id: 1, timestamp: '2026-03-16T21:00:00Z', body: 'Here is how we built a $12K/mo automated revenue engine...' },
    ],
  },
  {
    id: 'a11',
    title: 'TikTok Caption - Quick Tip',
    body: 'POV: You let AI agents run your business for a week\n\nResult: 340% ROI, 12 content pieces, 0 burnout\n\n#AIautomation #AgentMoe #BusinessAI #Productivity',
    type: 'Caption',
    platform: 'TikTok',
    status: 'Published',
    confidence: 92,
    operator: 'Content Strike Team',
    missionId: 'M-0037',
    createdAt: '2026-03-15T12:30:00Z',
    versions: [
      { id: 1, timestamp: '2026-03-15T12:30:00Z', body: 'POV: You let AI agents run your business for a week...' },
    ],
  },
  {
    id: 'a12',
    title: 'CTA - Newsletter Signup',
    body: 'Join 2,400+ operators getting our weekly AI playbook. Real strategies. Real results. No fluff.\n\n[Subscribe Free]',
    type: 'CTA',
    platform: 'LinkedIn',
    status: 'Archived',
    confidence: 68,
    operator: 'Growth Operator',
    missionId: 'M-0030',
    createdAt: '2026-03-10T11:00:00Z',
    versions: [
      { id: 1, timestamp: '2026-03-10T11:00:00Z', body: 'Join 2,400+ operators getting our weekly AI playbook...' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<ContentType, typeof FileText> = {
  Post: FileText,
  Script: Video,
  Caption: MessageSquare,
  CTA: Megaphone,
  Thumbnail: Image,
  Thread: ListTree,
};

const CONTENT_TYPES: ContentType[] = ['Post', 'Script', 'Caption', 'CTA', 'Thumbnail', 'Thread'];
const PLATFORMS: Platform[] = ['X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube'];
const STATUSES: Status[] = ['Draft', 'Review', 'Approved', 'Published', 'Archived'];

const STATUS_VARIANT: Record<Status, 'default' | 'warning' | 'primary' | 'success' | 'info'> = {
  Draft: 'default',
  Review: 'warning',
  Approved: 'primary',
  Published: 'success',
  Archived: 'info',
};

const PLATFORM_TONE: Record<Platform, 'default' | 'primary' | 'accent' | 'danger' | 'success' | 'warning' | 'muted'> = {
  X: 'default',
  LinkedIn: 'primary',
  Instagram: 'accent',
  TikTok: 'danger',
  YouTube: 'danger',
};

function confidenceColor(c: number) {
  if (c >= 90) return 'text-[var(--success)]';
  if (c >= 75) return 'text-[var(--accent)]';
  return 'text-[var(--warning)]';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentStudioWireframe() {
  // Filters
  const [typeFilter, setTypeFilter] = useState<'All' | ContentType>('All');
  const [platformFilter, setPlatformFilter] = useState<'All' | Platform>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | Status>('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Detail panel
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [platformTargets, setPlatformTargets] = useState<Record<Platform, boolean>>({
    X: true,
    LinkedIn: true,
    Instagram: false,
    TikTok: false,
    YouTube: false,
  });

  // Filtered assets
  const filtered = useMemo(() => {
    return MOCK_ASSETS.filter((a) => {
      if (typeFilter !== 'All' && a.type !== typeFilter) return false;
      if (platformFilter !== 'All' && a.platform !== platformFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.body.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [typeFilter, platformFilter, statusFilter, search]);

  // Stats
  const stats = useMemo(() => ({
    total: MOCK_ASSETS.length,
    approved: MOCK_ASSETS.filter((a) => a.status === 'Approved').length,
    inReview: MOCK_ASSETS.filter((a) => a.status === 'Review').length,
    published: MOCK_ASSETS.filter((a) => a.status === 'Published').length,
  }), []);

  const detailAsset = detailId ? MOCK_ASSETS.find((a) => a.id === detailId) ?? null : null;

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  }, [filtered, selected.size]);

  const openDetail = useCallback((asset: MockAsset) => {
    setDetailId(asset.id);
    setEditing(false);
    setEditBody(asset.body);
    setViewingVersion(null);
    setShowDiff(false);
    setPlatformTargets({
      X: asset.platform === 'X',
      LinkedIn: asset.platform === 'LinkedIn',
      Instagram: asset.platform === 'Instagram',
      TikTok: asset.platform === 'TikTok',
      YouTube: asset.platform === 'YouTube',
    });
  }, []);

  const closeDetail = useCallback(() => {
    setDetailId(null);
    setEditing(false);
    setViewingVersion(null);
    setShowDiff(false);
  }, []);

  return (
    <PageWrapper>
      {/* ---- Page Header ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Content Studio</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage, review, and publish AI-generated content assets
        </p>
      </div>

      {/* ---- Stats Row ---- */}
      <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MotionStaggerItem>
          <StatCard label="Total Assets" value={stats.total} icon={Layers} tone="default" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="In Review" value={stats.inReview} icon={Clock} tone="warning" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Published" value={stats.published} icon={Globe} tone="primary" />
        </MotionStaggerItem>
      </MotionStagger>

      {/* ---- Filter Bar ---- */}
      <MotionFadeIn delay={0.1}>
        <GlassCard padding="md" hover={false} className="mb-6">
          {/* Content Type Tabs */}
          <div className="flex flex-wrap items-center gap-1 mb-3">
            <span className="text-xs font-medium text-[var(--text-muted)] mr-2">Type</span>
            {(['All', ...CONTENT_TYPES] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
                  typeFilter === t
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text)]',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Platform Pills */}
          <div className="flex flex-wrap items-center gap-1 mb-3">
            <span className="text-xs font-medium text-[var(--text-muted)] mr-2">Platform</span>
            {(['All', ...PLATFORMS] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={cn(
                  'px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium border transition-colors',
                  platformFilter === p
                    ? 'bg-[var(--primary-muted)] text-[var(--primary)] border-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]',
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status + Search + View Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-[var(--text-muted)] mr-1">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | Status)}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs px-2 py-1.5 outline-none focus:border-[var(--primary)]"
              >
                <option>All</option>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-disabled)]" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs pl-8 pr-3 py-1.5 outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-disabled)]"
              />
            </div>

            {/* View Toggle */}
            <div className="flex rounded-[var(--radius-sm)] border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'p-1.5 transition-colors',
                  view === 'grid'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'p-1.5 transition-colors',
                  view === 'list'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]',
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </GlassCard>
      </MotionFadeIn>

      {/* ---- Bulk Action Bar ---- */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-3 rounded-[var(--radius)] border border-[var(--primary)] bg-[var(--primary-muted)] px-4 py-2.5"
          >
            <span className="text-sm font-medium text-[var(--text)]">
              {selected.size} selected
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Clear
              </button>
              <button className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--success)] text-white hover:opacity-90 transition-opacity flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Approve All
              </button>
              <button className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--warning)] text-white hover:opacity-90 transition-opacity flex items-center gap-1">
                <ThumbsDown className="h-3 w-3" /> Reject
              </button>
              <button className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1">
                <Copy className="h-3 w-3" /> Duplicate
              </button>
              <button className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--danger)] text-white hover:opacity-90 transition-opacity flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Asset Grid / List ---- */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assets found"
          description="Try adjusting your filters or search query."
        />
      ) : view === 'grid' ? (
        /* ---- GRID VIEW ---- */
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((asset) => {
            const TypeIcon = TYPE_ICONS[asset.type];
            return (
              <MotionStaggerItem key={asset.id}>
                <GlassCard
                  padding="none"
                  className={cn(
                    'cursor-pointer overflow-hidden',
                    selected.has(asset.id) && 'ring-2 ring-[var(--primary)]',
                  )}
                >
                  <div className="p-4">
                    {/* Top row: checkbox + type icon + confidence */}
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={selected.has(asset.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(asset.id);
                        }}
                        className="h-3.5 w-3.5 rounded accent-[var(--primary)] cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        <TypeIcon className="h-3.5 w-3.5" />
                        <span className="text-xs">{asset.type}</span>
                      </div>
                      <span className={cn('ml-auto text-xs font-semibold', confidenceColor(asset.confidence))}>
                        {asset.confidence}%
                      </span>
                    </div>

                    {/* Title */}
                    <button
                      onClick={() => openDetail(asset)}
                      className="text-left w-full"
                    >
                      <h3 className="text-sm font-semibold text-[var(--text)] truncate mb-1.5 hover:text-[var(--primary)] transition-colors">
                        {asset.title}
                      </h3>
                    </button>

                    {/* Body preview */}
                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 mb-3 cursor-pointer" onClick={() => openDetail(asset)}>
                      {asset.body}
                    </p>

                    {/* Bottom: platform pill + status badge + date */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill tone={PLATFORM_TONE[asset.platform]}>{asset.platform}</Pill>
                      <StatusBadge label={asset.status} variant={STATUS_VARIANT[asset.status]} />
                      <span className="ml-auto text-[10px] text-[var(--text-disabled)]">
                        {formatDate(asset.createdAt)}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      ) : (
        /* ---- LIST VIEW ---- */
        <SectionCard title={`${filtered.length} Assets`} subtitle="Sorted by most recent">
          {/* Header row */}
          <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border)]">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded accent-[var(--primary)] cursor-pointer"
            />
            <span className="w-8" />
            <span className="flex-1 min-w-0">Title</span>
            <span className="w-20 text-center hidden sm:block">Type</span>
            <span className="w-20 text-center hidden md:block">Platform</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-16 text-right hidden lg:block">Score</span>
            <span className="w-28 text-right hidden xl:block">Date</span>
          </div>

          {/* Rows */}
          {filtered.map((asset) => {
            const TypeIcon = TYPE_ICONS[asset.type];
            return (
              <div
                key={asset.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer group',
                  selected.has(asset.id) && 'bg-[var(--primary-muted)]',
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(asset.id)}
                  onChange={() => toggleSelect(asset.id)}
                  className="h-3.5 w-3.5 rounded accent-[var(--primary)] cursor-pointer"
                />
                <div className="w-8 flex items-center justify-center text-[var(--text-muted)]">
                  <TypeIcon className="h-4 w-4" />
                </div>
                <button
                  onClick={() => openDetail(asset)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="text-sm font-medium text-[var(--text)] truncate block group-hover:text-[var(--primary)] transition-colors">
                    {asset.title}
                  </span>
                  <span className="text-xs text-[var(--text-disabled)] truncate block">
                    {asset.body.slice(0, 80)}...
                  </span>
                </button>
                <span className="w-20 text-center hidden sm:block">
                  <span className="text-xs text-[var(--text-muted)]">{asset.type}</span>
                </span>
                <span className="w-20 text-center hidden md:block">
                  <Pill tone={PLATFORM_TONE[asset.platform]}>{asset.platform}</Pill>
                </span>
                <span className="w-20 text-center">
                  <StatusBadge label={asset.status} variant={STATUS_VARIANT[asset.status]} />
                </span>
                <span className={cn('w-16 text-right text-xs font-semibold hidden lg:block', confidenceColor(asset.confidence))}>
                  {asset.confidence}%
                </span>
                <span className="w-28 text-right text-[10px] text-[var(--text-disabled)] hidden xl:block">
                  {formatDate(asset.createdAt)}
                </span>
              </div>
            );
          })}
        </SectionCard>
      )}

      {/* ---- Detail Panel (Slide-in) ---- */}
      <AnimatePresence>
        {detailAsset && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeDetail}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              variants={panelSlideRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 z-50 h-full w-full max-w-[500px] overflow-y-auto border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl"
            >
              <div className="p-6">
                {/* Panel Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-[var(--text)] truncate pr-4">
                    {detailAsset.title}
                  </h2>
                  <button
                    onClick={closeDetail}
                    className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Status + Type + Platform */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <StatusBadge label={detailAsset.status} variant={STATUS_VARIANT[detailAsset.status]} size="md" />
                  <Pill>{detailAsset.type}</Pill>
                  <Pill tone={PLATFORM_TONE[detailAsset.platform]}>{detailAsset.platform}</Pill>
                  <span className={cn('text-sm font-semibold ml-auto', confidenceColor(detailAsset.confidence))}>
                    <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                    {detailAsset.confidence}% confidence
                  </span>
                </div>

                {/* ---- Social Media Preview (for Posts) ---- */}
                {(detailAsset.type === 'Post' || detailAsset.type === 'Thread') && (
                  <div className="mb-5">
                    <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                      Social Preview
                    </h4>
                    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--primary-muted)] flex items-center justify-center">
                          <span className="text-sm font-bold text-[var(--primary)]">M</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">Agent Moe</p>
                          <p className="text-xs text-[var(--text-disabled)]">@agentmoe_ai</p>
                        </div>
                        <span className="ml-auto text-xs text-[var(--text-disabled)]">
                          {formatDate(detailAsset.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed mb-3">
                        {viewingVersion !== null
                          ? detailAsset.versions.find((v) => v.id === viewingVersion)?.body ?? detailAsset.body
                          : detailAsset.body}
                      </p>
                      <div className="flex items-center gap-6 text-[var(--text-disabled)]">
                        <span className="flex items-center gap-1 text-xs"><Heart className="h-3.5 w-3.5" /> 847</span>
                        <span className="flex items-center gap-1 text-xs"><MessageCircle className="h-3.5 w-3.5" /> 124</span>
                        <span className="flex items-center gap-1 text-xs"><Repeat2 className="h-3.5 w-3.5" /> 312</span>
                        <span className="flex items-center gap-1 text-xs"><Share className="h-3.5 w-3.5" /> 89</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- Content Body / Editor ---- */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Content
                    </h4>
                    {!editing ? (
                      <button
                        onClick={() => {
                          setEditing(true);
                          setEditBody(
                            viewingVersion !== null
                              ? detailAsset.versions.find((v) => v.id === viewingVersion)?.body ?? detailAsset.body
                              : detailAsset.body,
                          );
                        }}
                        className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(false)}
                          className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--success)] text-white hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {editing ? (
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full h-48 rounded-[var(--radius)] border border-[var(--primary)] bg-[var(--surface)] text-[var(--text)] text-sm p-3 outline-none resize-y font-mono"
                    />
                  ) : (
                    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                        {viewingVersion !== null
                          ? detailAsset.versions.find((v) => v.id === viewingVersion)?.body ?? detailAsset.body
                          : detailAsset.body}
                      </p>
                    </div>
                  )}
                </div>

                {/* ---- Metadata ---- */}
                <div className="mb-5">
                  <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                    Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Type', value: detailAsset.type },
                      { label: 'Platform', value: detailAsset.platform },
                      { label: 'Operator', value: detailAsset.operator },
                      { label: 'Mission', value: detailAsset.missionId },
                      { label: 'Confidence', value: `${detailAsset.confidence}%` },
                      { label: 'Created', value: formatDate(detailAsset.createdAt) },
                    ].map((m) => (
                      <div key={m.label} className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] p-2.5">
                        <p className="text-[10px] text-[var(--text-disabled)] uppercase tracking-wider mb-0.5">{m.label}</p>
                        <p className="text-xs font-medium text-[var(--text)]">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ---- Version History ---- */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                      <History className="h-3.5 w-3.5" /> Version History
                    </h4>
                    {viewingVersion !== null && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDiff(!showDiff)}
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          {showDiff ? 'Hide Diff' : 'Show Diff'}
                        </button>
                        <button
                          onClick={() => { setViewingVersion(null); setShowDiff(false); }}
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          Back to latest
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {detailAsset.versions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setViewingVersion(v.id); setShowDiff(false); }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-left transition-colors',
                          viewingVersion === v.id
                            ? 'bg-[var(--primary-muted)] border border-[var(--primary)]'
                            : 'border border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)]',
                        )}
                      >
                        <span className="text-xs font-mono font-semibold text-[var(--text-muted)]">v{v.id}</span>
                        <span className="text-xs text-[var(--text)] truncate flex-1">{v.body.slice(0, 50)}...</span>
                        <span className="text-[10px] text-[var(--text-disabled)] shrink-0">{formatDate(v.timestamp)}</span>
                        <ChevronRight className="h-3 w-3 text-[var(--text-disabled)] shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Version Diff */}
                  <AnimatePresence>
                    {showDiff && viewingVersion !== null && detailAsset.versions.length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--danger-muted)] p-3">
                            <p className="text-[10px] font-medium text-[var(--danger)] mb-1 uppercase">
                              Previous (v{Math.max(1, viewingVersion - 1)})
                            </p>
                            <p className="text-xs text-[var(--text)] whitespace-pre-wrap">
                              {detailAsset.versions.find((v) => v.id === Math.max(1, viewingVersion - 1))?.body ?? 'N/A'}
                            </p>
                          </div>
                          <div className="rounded-[var(--radius-sm)] border border-[var(--success)] bg-[var(--success-muted)] p-3">
                            <p className="text-[10px] font-medium text-[var(--success)] mb-1 uppercase">
                              Current (v{viewingVersion})
                            </p>
                            <p className="text-xs text-[var(--text)] whitespace-pre-wrap">
                              {detailAsset.versions.find((v) => v.id === viewingVersion)?.body ?? 'N/A'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ---- Platform Targeting ---- */}
                <div className="mb-5">
                  <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" /> Platform Targeting
                  </h4>
                  <div className="space-y-2">
                    {PLATFORMS.map((p) => (
                      <div
                        key={p}
                        className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)]"
                      >
                        <span className="text-xs font-medium text-[var(--text)]">{p}</span>
                        <button
                          onClick={() =>
                            setPlatformTargets((prev) => ({ ...prev, [p]: !prev[p] }))
                          }
                          className={cn(
                            'relative h-5 w-9 rounded-full transition-colors',
                            platformTargets[p] ? 'bg-[var(--primary)]' : 'bg-[var(--surface-elevated)] border border-[var(--border)]',
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                              platformTargets[p] ? 'left-[18px]' : 'left-0.5',
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ---- Status Actions ---- */}
                <div>
                  <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                    Actions
                  </h4>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-[var(--success)] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                      <ThumbsUp className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-[var(--danger)] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                      <ThumbsDown className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] text-xs font-medium hover:text-[var(--text)] hover:border-[var(--border-hover)] transition-colors">
                      <RotateCcw className="h-3.5 w-3.5" /> Send Back
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
