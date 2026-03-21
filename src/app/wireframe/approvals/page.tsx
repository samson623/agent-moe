'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  PageWrapper,
  StatCard,
  SectionCard,
  GlassCard,
  Pill,
  StatusBadge,
  EmptyState,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  AnimatePresence,
  motion,
  panelSlideRight,
} from '@/components/nebula';
import { cn } from '@/lib/utils';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Zap,
  Search,
  Check,
  X,
  RotateCcw,
  Shield,
  ChevronDown,
  ChevronUp,
  FileText,
  Inbox,
  Clock,
  Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type ContentType = 'Post' | 'Script' | 'Caption' | 'CTA';
type RiskLevel = 'Low' | 'Medium' | 'High';
type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Revision Requested';
type OperatorTeam = 'Content Strike Team' | 'Growth Operator' | 'Revenue Closer' | 'Brand Guardian';

interface ApprovalItem {
  id: string;
  missionId: string;
  missionTitle: string;
  contentPreview: string;
  fullContent: string;
  contentType: ContentType;
  riskLevel: RiskLevel;
  confidenceScore: number;
  operatorTeam: OperatorTeam;
  flaggedReasons: string[];
  status: ApprovalStatus;
  timestamp: string;
  linkedOffer?: string;
  brandGuardian?: {
    safetyScore: number;
    toneScore: number;
    claimFlags: string[];
    suggestedRevision?: string;
  };
}

interface HistoryEntry {
  id: string;
  title: string;
  decision: 'Approved' | 'Rejected' | 'Revision';
  reviewer: string;
  timestamp: string;
  reason: string;
}

// ─── Mock Data ───────────────────────────────────────────────────

const MOCK_ITEMS: ApprovalItem[] = [
  {
    id: 'a1',
    missionId: 'm1',
    missionTitle: 'Sleep Supplement Launch',
    contentPreview: 'Unlock deeper sleep tonight with our clinically-tested magnesium blend. 87% of users reported...',
    fullContent:
      'Unlock deeper sleep tonight with our clinically-tested magnesium blend. 87% of users reported improved sleep quality within the first week. Our proprietary formula combines magnesium glycinate, L-theanine, and ashwagandha root extract for a synergistic effect that helps you fall asleep faster, stay asleep longer, and wake up refreshed.\n\nLimited time: Get 30% off your first order with code SLEEP30.',
    contentType: 'Post',
    riskLevel: 'High',
    confidenceScore: 72,
    operatorTeam: 'Content Strike Team',
    flaggedReasons: ['Risky health claim', 'Unverified statistic (87%)'],
    status: 'Pending',
    timestamp: '2026-03-17T09:12:00Z',
    linkedOffer: 'Sleep Stack Pro — 30% Off',
    brandGuardian: {
      safetyScore: 58,
      toneScore: 82,
      claimFlags: ['87% statistic needs source citation', 'Clinically-tested requires FDA disclaimer'],
      suggestedRevision:
        'Unlock deeper sleep tonight with our magnesium blend. Many users report improved sleep quality. Our formula combines magnesium glycinate, L-theanine, and ashwagandha root extract to support restful sleep.\n\nLimited time: Get 30% off your first order with code SLEEP30.',
    },
  },
  {
    id: 'a2',
    missionId: 'm1',
    missionTitle: 'Sleep Supplement Launch',
    contentPreview: '"I haven\'t slept this well in years" — Real customer testimonial video script for TikTok...',
    fullContent:
      '"I haven\'t slept this well in years."\n\n[Scene 1: Person tossing in bed, blue light from phone]\nVO: We\'ve all been there. Counting sheep at 2 AM.\n\n[Scene 2: Product shot with calming music]\nVO: Sleep Stack Pro changed everything for me.\n\n[Scene 3: Person sleeping peacefully, morning light]\nVO: Deeper sleep. Better mornings. Try it tonight.\n\n[CTA: Link in bio — 30% off first order]',
    contentType: 'Script',
    riskLevel: 'Medium',
    confidenceScore: 85,
    operatorTeam: 'Content Strike Team',
    flaggedReasons: ['Testimonial needs disclosure'],
    status: 'Pending',
    timestamp: '2026-03-17T09:30:00Z',
    linkedOffer: 'Sleep Stack Pro — 30% Off',
    brandGuardian: {
      safetyScore: 74,
      toneScore: 91,
      claimFlags: ['Testimonial requires #ad or #sponsored disclosure'],
    },
  },
  {
    id: 'a3',
    missionId: 'm1',
    missionTitle: 'Sleep Supplement Launch',
    contentPreview: 'Your body deserves rest that actually works. Sleep Stack Pro — because counting sheep is outdated.',
    fullContent: 'Your body deserves rest that actually works. Sleep Stack Pro — because counting sheep is outdated. Wake up feeling like a new person.',
    contentType: 'Caption',
    riskLevel: 'Low',
    confidenceScore: 94,
    operatorTeam: 'Content Strike Team',
    flaggedReasons: [],
    status: 'Pending',
    timestamp: '2026-03-17T09:45:00Z',
    brandGuardian: {
      safetyScore: 92,
      toneScore: 95,
      claimFlags: [],
    },
  },
  {
    id: 'a4',
    missionId: 'm2',
    missionTitle: 'Q1 Email Nurture Sequence',
    contentPreview: 'Subject: The #1 mistake killing your morning energy (and the 30-second fix)...',
    fullContent:
      'Subject: The #1 mistake killing your morning energy (and the 30-second fix)\n\nHey {first_name},\n\nYou know that groggy feeling where your alarm goes off and you hit snooze 5 times?\n\nIt\'s not because you\'re lazy. It\'s because your sleep architecture is broken.\n\nHere\'s what most people get wrong: They focus on hours of sleep instead of quality of sleep.\n\nThe fix? A simple 30-second nighttime ritual that resets your circadian rhythm.\n\n[CTA: Learn the ritual →]\n\nTo better mornings,\nThe MOE Team',
    contentType: 'Post',
    riskLevel: 'Low',
    confidenceScore: 91,
    operatorTeam: 'Growth Operator',
    flaggedReasons: [],
    status: 'Pending',
    timestamp: '2026-03-17T08:00:00Z',
    linkedOffer: 'Free Sleep Guide Download',
    brandGuardian: {
      safetyScore: 88,
      toneScore: 90,
      claimFlags: [],
    },
  },
  {
    id: 'a5',
    missionId: 'm2',
    missionTitle: 'Q1 Email Nurture Sequence',
    contentPreview: 'Subject: [Last chance] Your exclusive 40% discount expires at midnight...',
    fullContent:
      'Subject: [Last chance] Your exclusive 40% discount expires at midnight\n\nHey {first_name},\n\nThis is your FINAL reminder.\n\nYour exclusive 40% off Sleep Stack Pro expires TONIGHT at midnight.\n\nAfter that, it\'s gone. No extensions. No exceptions.\n\nOver 2,000 people have already claimed theirs. Don\'t be the one who misses out.\n\n[CTA: Claim My 40% Off Before Midnight →]\n\nDon\'t sleep on this (pun intended),\nThe MOE Team\n\nP.S. Once this deal is gone, the next sale won\'t be until Black Friday.',
    contentType: 'Post',
    riskLevel: 'High',
    confidenceScore: 67,
    operatorTeam: 'Revenue Closer',
    flaggedReasons: ['Aggressive CTA', 'Artificial scarcity language', 'Unverified claim (2,000 people)'],
    status: 'Pending',
    timestamp: '2026-03-17T08:15:00Z',
    linkedOffer: 'Sleep Stack Pro — 40% Off',
    brandGuardian: {
      safetyScore: 45,
      toneScore: 62,
      claimFlags: ['FINAL/LAST CHANCE creates false urgency', '2,000 people claim is unverified', 'Multiple pressure tactics in single email'],
      suggestedRevision:
        'Subject: Your 40% discount is ending soon\n\nHey {first_name},\n\nJust a friendly heads-up — your 40% off Sleep Stack Pro is available through tonight.\n\nIf you\'ve been on the fence, now\'s a great time to try it.\n\n[CTA: Get 40% Off Sleep Stack Pro →]\n\nTo better sleep,\nThe MOE Team',
    },
  },
  {
    id: 'a6',
    missionId: 'm3',
    missionTitle: 'Instagram Reels Push',
    contentPreview: 'Stop scrolling. Start sleeping. 3 science-backed tips in 30 seconds. #sleephacks #wellness...',
    fullContent:
      'Stop scrolling. Start sleeping.\n\n3 science-backed tips in 30 seconds:\n\n1. No screens 1 hour before bed (blue light blocks melatonin)\n2. Room temp: 65-68F (your body needs to cool down)\n3. Magnesium before bed (the mineral 80% of Americans lack)\n\nSave this for tonight.\n\n#sleephacks #wellness #biohacking #magnesium #sleeptips',
    contentType: 'Caption',
    riskLevel: 'Medium',
    confidenceScore: 83,
    operatorTeam: 'Content Strike Team',
    flaggedReasons: ['80% statistic needs source'],
    status: 'Pending',
    timestamp: '2026-03-17T10:00:00Z',
    brandGuardian: {
      safetyScore: 76,
      toneScore: 93,
      claimFlags: ['80% of Americans statistic should cite NIH or peer-reviewed source'],
    },
  },
  {
    id: 'a7',
    missionId: 'm3',
    missionTitle: 'Instagram Reels Push',
    contentPreview: 'POV: You finally found a sleep supplement that actually works. No grogginess. No dependency...',
    fullContent:
      'POV: You finally found a sleep supplement that actually works.\n\nNo grogginess. No dependency. Just deep, restful sleep.\n\nComment "SLEEP" and I\'ll send you the link.',
    contentType: 'CTA',
    riskLevel: 'Low',
    confidenceScore: 89,
    operatorTeam: 'Growth Operator',
    flaggedReasons: [],
    status: 'Pending',
    timestamp: '2026-03-17T10:15:00Z',
    brandGuardian: {
      safetyScore: 85,
      toneScore: 94,
      claimFlags: [],
    },
  },
  {
    id: 'a8',
    missionId: 'm4',
    missionTitle: 'Affiliate Partner Kit',
    contentPreview: 'Earn $50 per sale promoting Sleep Stack Pro. We handle fulfillment, you handle the audience...',
    fullContent:
      'Earn $50 per sale promoting Sleep Stack Pro.\n\nWe handle fulfillment, you handle the audience.\n\nWhat you get:\n- Custom affiliate link with 30-day cookie\n- Pre-made swipe copy (emails, tweets, stories)\n- Exclusive 25% discount code for your audience\n- Real-time dashboard tracking clicks & conversions\n\nTop affiliates are earning $3,000+/month.\n\n[CTA: Apply to become a Sleep Stack Pro affiliate →]',
    contentType: 'Post',
    riskLevel: 'Medium',
    confidenceScore: 78,
    operatorTeam: 'Revenue Closer',
    flaggedReasons: ['Income claim ($3,000+/month)'],
    status: 'Pending',
    timestamp: '2026-03-17T07:30:00Z',
    linkedOffer: 'Affiliate Program',
    brandGuardian: {
      safetyScore: 65,
      toneScore: 86,
      claimFlags: ['$3,000+/month income claim requires disclaimer or proof'],
      suggestedRevision:
        'Earn commissions promoting Sleep Stack Pro.\n\nWe handle fulfillment, you handle the audience.\n\nWhat you get:\n- Custom affiliate link with 30-day cookie\n- Pre-made swipe copy (emails, tweets, stories)\n- Exclusive 25% discount code for your audience\n- Real-time dashboard tracking clicks & conversions\n\n[CTA: Apply to become a Sleep Stack Pro affiliate →]',
    },
  },
];

const MOCK_HISTORY: HistoryEntry[] = [
  { id: 'h1', title: 'Morning routine carousel post', decision: 'Approved', reviewer: 'Auto-Approved', timestamp: '2026-03-17T07:00:00Z', reason: 'Low risk, 96% confidence' },
  { id: 'h2', title: 'Flash sale email blast', decision: 'Rejected', reviewer: 'You', timestamp: '2026-03-17T06:45:00Z', reason: 'Too aggressive — violates brand tone guidelines' },
  { id: 'h3', title: 'Podcast ad read script', decision: 'Approved', reviewer: 'You', timestamp: '2026-03-16T22:00:00Z', reason: 'On-brand, claims verified' },
  { id: 'h4', title: 'Weight loss supplement CTA', decision: 'Revision', reviewer: 'You', timestamp: '2026-03-16T20:30:00Z', reason: 'Needs FDA disclaimer added' },
  { id: 'h5', title: 'Newsletter welcome sequence #3', decision: 'Approved', reviewer: 'Auto-Approved', timestamp: '2026-03-16T18:00:00Z', reason: 'Low risk, 92% confidence' },
  { id: 'h6', title: 'Twitter thread on sleep science', decision: 'Approved', reviewer: 'You', timestamp: '2026-03-16T15:00:00Z', reason: 'Well-sourced, on-brand tone' },
];

// ─── Helpers ─────────────────────────────────────────────────────

const riskTone = (r: RiskLevel): 'success' | 'warning' | 'danger' =>
  r === 'Low' ? 'success' : r === 'Medium' ? 'warning' : 'danger';
const contentTypeTone = (t: ContentType) =>
  t === 'Post' ? 'primary' : t === 'Script' ? 'accent' : t === 'Caption' ? 'muted' : 'warning';
const decisionVariant = (d: string) =>
  d === 'Approved' ? 'success' : d === 'Rejected' ? 'danger' : 'warning';
const confidenceColor = (s: number) =>
  s >= 85 ? 'text-[var(--success)]' : s >= 70 ? 'text-[var(--warning)]' : 'text-[var(--danger)]';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Filter Types ────────────────────────────────────────────────

type StatusFilter = 'All' | ApprovalStatus;
type RiskFilter = 'All' | RiskLevel;

const STATUS_FILTERS: StatusFilter[] = ['All', 'Pending', 'Approved', 'Rejected', 'Revision Requested'];
const RISK_FILTERS: RiskFilter[] = ['All', 'Low', 'Medium', 'High'];

// ─── Page Component ──────────────────────────────────────────────

export default function ApprovalsPage() {
  // Items state (mutable for approve/reject actions)
  const [items, setItems] = useState<ApprovalItem[]>(MOCK_ITEMS);

  // Stats
  const [stats, setStats] = useState({ pending: 7, approvedToday: 12, rejected: 2, autoApproved: 45 });

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Preview
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // History
  const [showHistory, setShowHistory] = useState(true);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (riskFilter !== 'All' && item.riskLevel !== riskFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.contentPreview.toLowerCase().includes(q) ||
          item.missionTitle.toLowerCase().includes(q) ||
          item.operatorTeam.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, statusFilter, riskFilter, searchQuery]);

  // Group by mission
  const groupedItems = useMemo(() => {
    const groups: Record<string, { missionTitle: string; items: ApprovalItem[] }> = {};
    for (const item of filteredItems) {
      if (!groups[item.missionId]) {
        groups[item.missionId] = { missionTitle: item.missionTitle, items: [] };
      }
      groups[item.missionId]!.items.push(item);
    }
    return Object.entries(groups);
  }, [filteredItems]);

  const previewItem = previewId ? items.find((i) => i.id === previewId) : null;

  // Actions
  const approveItem = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Approved' as ApprovalStatus } : i)));
    setStats((s) => ({ ...s, pending: Math.max(0, s.pending - 1), approvedToday: s.approvedToday + 1 }));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setPreviewId(null);
  }, []);

  const rejectItem = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Rejected' as ApprovalStatus } : i)));
    setStats((s) => ({ ...s, pending: Math.max(0, s.pending - 1), rejected: s.rejected + 1 }));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setPreviewId(null);
  }, []);

  const sendBackItem = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Revision Requested' as ApprovalStatus } : i)));
    setStats((s) => ({ ...s, pending: Math.max(0, s.pending - 1) }));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setRevisionMode(false);
    setRevisionNotes('');
    setPreviewId(null);
  }, []);

  const batchApprove = useCallback(() => {
    const count = selectedIds.size;
    setItems((prev) => prev.map((i) => (selectedIds.has(i.id) ? { ...i, status: 'Approved' as ApprovalStatus } : i)));
    setStats((s) => ({ ...s, pending: Math.max(0, s.pending - count), approvedToday: s.approvedToday + count }));
    setSelectedIds(new Set());
    setPreviewId(null);
  }, [selectedIds]);

  const batchReject = useCallback(() => {
    const count = selectedIds.size;
    setItems((prev) => prev.map((i) => (selectedIds.has(i.id) ? { ...i, status: 'Rejected' as ApprovalStatus } : i)));
    setStats((s) => ({ ...s, pending: Math.max(0, s.pending - count), rejected: s.rejected + count }));
    setSelectedIds(new Set());
    setPreviewId(null);
  }, [selectedIds]);

  const approveAllInMission = useCallback((missionId: string) => {
    const missionItems = items.filter((i) => i.missionId === missionId && i.status === 'Pending');
    const count = missionItems.length;
    setItems((prev) => prev.map((i) => (i.missionId === missionId && i.status === 'Pending' ? { ...i, status: 'Approved' as ApprovalStatus } : i)));
    setStats((s) => ({ ...s, pending: Math.max(0, s.pending - count), approvedToday: s.approvedToday + count }));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      missionItems.forEach((i) => next.delete(i.id));
      return next;
    });
  }, [items]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const pendingItems = filteredItems.filter((i) => i.status === 'Pending');
  const hasSelection = selectedIds.size > 0;

  return (
    <PageWrapper>
      {/* ─── Header ─── */}
      <MotionFadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Approvals</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Review, approve, or reject AI-generated content before it goes live.</p>
        </div>
      </MotionFadeIn>

      {/* ─── Stats Row ─── */}
      <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MotionStaggerItem>
          <StatCard label="Pending Review" value={stats.pending} icon={ClipboardCheck} tone="warning" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Approved Today" value={stats.approvedToday} icon={CheckCircle2} tone="success" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="danger" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Auto-Approved" value={stats.autoApproved} icon={Zap} tone="primary" />
        </MotionStaggerItem>
      </MotionStagger>

      {/* ─── Filter / Action Bar ─── */}
      <MotionFadeIn delay={0.1}>
        <GlassCard padding="md" hover={false} className="mb-6">
          <div className="flex flex-col gap-3">
            {/* Status pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[var(--text-muted)] mr-1">Status:</span>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    statusFilter === s
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-hover)]',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Risk pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[var(--text-muted)] mr-1">Risk:</span>
              {RISK_FILTERS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    riskFilter === r
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-hover)]',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Search + batch actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)]" />
                <input
                  type="text"
                  placeholder="Search content, missions, operators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!hasSelection}
                  onClick={batchApprove}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    hasSelection
                      ? 'bg-[var(--success)] text-white hover:opacity-90'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-disabled)] cursor-not-allowed',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve Selected ({selectedIds.size})
                </button>
                <button
                  disabled={!hasSelection}
                  onClick={batchReject}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    hasSelection
                      ? 'bg-[var(--danger)] text-white hover:opacity-90'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-disabled)] cursor-not-allowed',
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                  Reject Selected ({selectedIds.size})
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </MotionFadeIn>

      {/* ─── Main Content: Queue + Preview ─── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Queue */}
        <div className="flex-1 min-w-0 lg:max-h-[calc(100vh-420px)] lg:overflow-y-auto lg:pr-2">
          {groupedItems.length === 0 ? (
            <EmptyState icon={Inbox} title="No items found" description="Adjust your filters or wait for new content to arrive." />
          ) : (
            <MotionStagger className="space-y-5">
              {groupedItems.map(([missionId, group]) => (
                <MotionStaggerItem key={missionId}>
                  {/* Mission group header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[var(--primary)]" />
                      <h3 className="text-sm font-semibold text-[var(--text)]">{group.missionTitle}</h3>
                      <Pill tone="muted">{group.items.length} items</Pill>
                    </div>
                    {group.items.some((i) => i.status === 'Pending') && (
                      <button
                        onClick={() => approveAllInMission(missionId)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--success)] bg-[var(--success-muted)] hover:opacity-80 transition-opacity"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve All
                      </button>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <GlassCard
                        key={item.id}
                        padding="sm"
                        hover
                        className={cn(
                          'cursor-pointer transition-all',
                          previewId === item.id && 'ring-2 ring-[var(--primary)] border-[var(--primary)]',
                          item.status !== 'Pending' && 'opacity-50',
                        )}
                      >
                        <div className="flex items-start gap-3" onClick={() => { setPreviewId(item.id); setRevisionMode(false); setRevisionNotes(''); }}>
                          {/* Checkbox */}
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              disabled={item.status !== 'Pending'}
                              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] accent-[var(--primary)] cursor-pointer"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text)] line-clamp-2 mb-2">{item.contentPreview}</p>

                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill tone={contentTypeTone(item.contentType) as 'primary' | 'accent' | 'muted' | 'warning'}>{item.contentType}</Pill>
                              <StatusBadge label={item.riskLevel} variant={riskTone(item.riskLevel)} size="sm" />
                              <span className={cn('text-xs font-semibold', confidenceColor(item.confidenceScore))}>{item.confidenceScore}%</span>
                              <Pill tone="default">{item.operatorTeam}</Pill>
                              {item.status !== 'Pending' && (
                                <StatusBadge
                                  label={item.status}
                                  variant={item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'}
                                  size="sm"
                                />
                              )}
                            </div>

                            {/* Flagged reasons */}
                            {item.flaggedReasons.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.flaggedReasons.map((reason) => (
                                  <span
                                    key={reason}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--danger-muted)] text-[var(--danger)] border border-[rgba(248,113,113,0.15)]"
                                  >
                                    <Shield className="h-2.5 w-2.5" />
                                    {reason}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Bottom row: timestamp + actions */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-[var(--text-disabled)]">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatTime(item.timestamp)}
                              </span>

                              {item.status === 'Pending' && (
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => approveItem(item.id)}
                                    className="p-1.5 rounded-md bg-[var(--success-muted)] text-[var(--success)] hover:opacity-80 transition-opacity"
                                    title="Approve"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => rejectItem(item.id)}
                                    className="p-1.5 rounded-md bg-[var(--danger-muted)] text-[var(--danger)] hover:opacity-80 transition-opacity"
                                    title="Reject"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => sendBackItem(item.id)}
                                    className="p-1.5 rounded-md bg-[var(--warning-muted)] text-[var(--warning)] hover:opacity-80 transition-opacity"
                                    title="Send Back for Revision"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          )}
        </div>

        {/* Right: Preview Panel */}
        <div className="w-full lg:w-[420px] lg:shrink-0 lg:sticky lg:top-6 lg:self-start">
          <AnimatePresence mode="wait">
            {previewItem ? (
              <motion.div
                key={previewItem.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
              >
                <GlassCard padding="md" hover={false}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-[var(--primary)]" />
                      <h3 className="text-sm font-semibold text-[var(--text)]">Content Preview</h3>
                    </div>
                    <button
                      onClick={() => setPreviewId(null)}
                      className="p-1 rounded-md hover:bg-[var(--surface-elevated)] transition-colors"
                    >
                      <X className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                  </div>

                  {/* Full content */}
                  <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 mb-4 max-h-48 overflow-y-auto">
                    <pre className="text-sm text-[var(--text)] whitespace-pre-wrap font-sans leading-relaxed">{previewItem.fullContent}</pre>
                  </div>

                  {/* Brand Guardian Analysis */}
                  {previewItem.brandGuardian && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Brand Guardian Analysis</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3 text-center">
                          <p className="text-[10px] text-[var(--text-muted)] mb-1">Safety Score</p>
                          <p className={cn('text-lg font-bold', confidenceColor(previewItem.brandGuardian.safetyScore))}>
                            {previewItem.brandGuardian.safetyScore}
                          </p>
                        </div>
                        <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3 text-center">
                          <p className="text-[10px] text-[var(--text-muted)] mb-1">Tone Score</p>
                          <p className={cn('text-lg font-bold', confidenceColor(previewItem.brandGuardian.toneScore))}>
                            {previewItem.brandGuardian.toneScore}
                          </p>
                        </div>
                      </div>

                      {/* Claim flags */}
                      {previewItem.brandGuardian.claimFlags.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5">Claim Flags</p>
                          <ul className="space-y-1">
                            {previewItem.brandGuardian.claimFlags.map((flag) => (
                              <li key={flag} className="flex items-start gap-1.5 text-xs text-[var(--danger)]">
                                <Shield className="h-3 w-3 mt-0.5 shrink-0" />
                                {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Side-by-side: Original vs Suggested */}
                      {previewItem.brandGuardian.suggestedRevision && (
                        <div className="mb-3">
                          <p className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5">Suggested Revision</p>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="rounded-lg bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.15)] p-3">
                              <p className="text-[10px] font-semibold text-[var(--danger)] mb-1">Original</p>
                              <p className="text-xs text-[var(--text-muted)] line-clamp-4">{previewItem.fullContent}</p>
                            </div>
                            <div className="rounded-lg bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.15)] p-3">
                              <p className="text-[10px] font-semibold text-[var(--success)] mb-1">Suggested</p>
                              <p className="text-xs text-[var(--text-muted)] line-clamp-4">{previewItem.brandGuardian.suggestedRevision}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3 mb-4">
                    <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Metadata</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Mission</span>
                        <span className="text-[var(--text)] font-medium">{previewItem.missionTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Operator</span>
                        <span className="text-[var(--text)] font-medium">{previewItem.operatorTeam}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Type</span>
                        <Pill tone={contentTypeTone(previewItem.contentType) as 'primary' | 'accent' | 'muted' | 'warning'}>{previewItem.contentType}</Pill>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Confidence</span>
                        <span className={cn('font-semibold', confidenceColor(previewItem.confidenceScore))}>{previewItem.confidenceScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Submitted</span>
                        <span className="text-[var(--text)]">{formatDate(previewItem.timestamp)}</span>
                      </div>
                      {previewItem.linkedOffer && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Linked Offer</span>
                          <span className="text-[var(--accent)] font-medium">{previewItem.linkedOffer}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Revision notes */}
                  {revisionMode && (
                    <MotionFadeIn>
                      <div className="mb-4">
                        <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">Revision Notes</label>
                        <textarea
                          value={revisionNotes}
                          onChange={(e) => setRevisionNotes(e.target.value)}
                          placeholder="Describe what needs to change..."
                          rows={3}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                        />
                      </div>
                    </MotionFadeIn>
                  )}

                  {/* Action buttons */}
                  {previewItem.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveItem(previewItem.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--success)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => rejectItem(previewItem.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--danger)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                      {revisionMode ? (
                        <button
                          onClick={() => sendBackItem(previewItem.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--warning)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Send Back
                        </button>
                      ) : (
                        <button
                          onClick={() => setRevisionMode(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--warning)] text-[var(--warning)] text-sm font-medium hover:bg-[var(--warning-muted)] transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Revision
                        </button>
                      )}
                    </div>
                  )}

                  {previewItem.status !== 'Pending' && (
                    <div className="flex items-center justify-center py-2">
                      <StatusBadge
                        label={previewItem.status}
                        variant={previewItem.status === 'Approved' ? 'success' : previewItem.status === 'Rejected' ? 'danger' : 'warning'}
                        size="md"
                        pulse
                      />
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="empty-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard padding="lg" hover={false} className="flex flex-col items-center justify-center min-h-[300px] text-center">
                  <Eye className="h-10 w-10 text-[var(--text-disabled)] mb-3" />
                  <p className="text-sm font-medium text-[var(--text-muted)]">Select an item to preview</p>
                  <p className="text-xs text-[var(--text-disabled)] mt-1">Click any content card to see the full preview and Brand Guardian analysis.</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Approval History ─── */}
      <div className="mt-8">
        <SectionCard
          title="Recent Decisions"
          subtitle="Your latest approval actions"
          action={
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {showHistory ? 'Hide' : 'Show'}
              {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          }
        >
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  {MOCK_HISTORY.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg bg-[var(--surface)] border border-[var(--border)] px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusBadge
                          label={entry.decision}
                          variant={decisionVariant(entry.decision)}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text)] truncate">{entry.title}</p>
                          <p className="text-[10px] text-[var(--text-disabled)]">{entry.reason}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xs text-[var(--text-muted)]">{entry.reviewer}</p>
                        <p className="text-[10px] text-[var(--text-disabled)]">{formatDate(entry.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionCard>
      </div>
    </PageWrapper>
  );
}
