'use client';

import { useState, useCallback } from 'react';
import {
  TrendingUp,
  Target,
  BarChart2,
  Search,
  Globe,
  Lightbulb,
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StatCard,
  SectionCard,
  Pill,
  PageWrapper,
  StatusBadge,
  GlassCard,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
} from '@/components/nebula';

// --------------- Types ---------------

type Momentum = 'Rising' | 'Peaking' | 'Stable' | 'Declining';
type Category = 'AI Tools' | 'Creator Economy' | 'Social Media' | 'Marketing';

interface Signal {
  id: string;
  title: string;
  score: number;
  momentum: Momentum;
  category: Category;
  source: string;
  timestamp: string;
  relevance: number;
}

interface Opportunity {
  id: string;
  title: string;
  score: number;
  momentum: Momentum;
}

interface MarketAngle {
  id: string;
  title: string;
  description: string;
  confidence: number;
  audience: string;
  analysis: string;
}

// --------------- Mock Data ---------------

const MOCK_SIGNALS: Signal[] = [
  { id: 's1', title: 'AI Code Assistants Surge in Enterprise', score: 9.2, momentum: 'Rising', category: 'AI Tools', source: 'TechCrunch', timestamp: '12 min ago', relevance: 94 },
  { id: 's2', title: 'Short-Form Video Revenue Models Evolve', score: 8.7, momentum: 'Peaking', category: 'Creator Economy', source: 'Creator Insider', timestamp: '28 min ago', relevance: 88 },
  { id: 's3', title: 'LinkedIn Algorithm Favors Carousels', score: 8.1, momentum: 'Rising', category: 'Social Media', source: 'Social Media Today', timestamp: '1h ago', relevance: 82 },
  { id: 's4', title: 'Email Marketing Personalization at Scale', score: 7.5, momentum: 'Stable', category: 'Marketing', source: 'HubSpot Blog', timestamp: '2h ago', relevance: 76 },
  { id: 's5', title: 'Multimodal AI Agents for Workflows', score: 9.0, momentum: 'Rising', category: 'AI Tools', source: 'The Verge', timestamp: '3h ago', relevance: 91 },
  { id: 's6', title: 'Creator Economy Hits $500B Valuation', score: 7.8, momentum: 'Peaking', category: 'Creator Economy', source: 'Bloomberg', timestamp: '4h ago', relevance: 79 },
  { id: 's7', title: 'Instagram Threads API Opens to Brands', score: 6.9, momentum: 'Declining', category: 'Social Media', source: 'Engadget', timestamp: '5h ago', relevance: 65 },
  { id: 's8', title: 'Programmatic Ad Spend Shifts to CTV', score: 7.2, momentum: 'Stable', category: 'Marketing', source: 'AdAge', timestamp: '6h ago', relevance: 72 },
];

const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: 'o1', title: 'Launch AI Workflow Automation Content Series', score: 9.4, momentum: 'Rising' },
  { id: 'o2', title: 'Creator Revenue Playbook for Q2', score: 8.9, momentum: 'Peaking' },
  { id: 'o3', title: 'LinkedIn Carousel Template Pack', score: 8.3, momentum: 'Rising' },
  { id: 'o4', title: 'Enterprise AI Adoption Case Studies', score: 7.9, momentum: 'Stable' },
  { id: 'o5', title: 'Short-Form Video Monetization Guide', score: 7.6, momentum: 'Peaking' },
];

const MOCK_ANGLES: MarketAngle[] = [
  { id: 'a1', title: 'AI-Native Solopreneur Stack', description: 'Position AI tools as essential infrastructure for one-person businesses', confidence: 92, audience: 'Solopreneurs', analysis: 'The convergence of AI code assistants, content generators, and workflow automation tools is creating a new category: the AI-native solopreneur stack. Early movers who document their stack and results are seeing 3-5x engagement. Key angles: cost savings vs hiring, speed to market, and quality parity with agencies.' },
  { id: 'a2', title: 'Creator Middle Class Narrative', description: 'Content about sustainable creator income vs viral fame', confidence: 85, audience: 'Mid-tier Creators', analysis: 'Fatigue with "quit your job" creator content is driving demand for realistic, sustainable creator income stories. The $50K-$150K/yr creator earner is underserved in content. Angles: diversified revenue streams, audience quality over quantity, and long-term compounding.' },
  { id: 'a3', title: 'Algorithm-Proof Distribution', description: 'Multi-platform strategies that reduce single-platform risk', confidence: 78, audience: 'Content Marketers', analysis: 'Platform algorithm changes continue to disrupt single-channel strategies. Cross-platform repurposing with platform-native optimization is the moat. Discuss: content atomization, platform-specific hooks, and owned audience building via email/community.' },
  { id: 'a4', title: 'Conversational Commerce Wave', description: 'AI chat-driven sales replacing traditional funnels', confidence: 71, audience: 'E-commerce Brands', analysis: 'AI-powered conversational commerce is replacing traditional landing page funnels for certain product categories. WhatsApp, Instagram DMs, and custom chat interfaces are showing 2-4x conversion rates. Cover: implementation cost, best-fit verticals, and customer experience design.' },
];

const MOMENTUM_TONES: Record<Momentum, 'success' | 'accent' | 'default' | 'danger'> = {
  Rising: 'success',
  Peaking: 'accent',
  Stable: 'default',
  Declining: 'danger',
};

const MOMENTUM_BORDERS: Record<Momentum, string> = {
  Rising: 'border-l-[var(--success)]',
  Peaking: 'border-l-[var(--accent)]',
  Stable: 'border-l-[var(--text-muted)]',
  Declining: 'border-l-[var(--danger)]',
};

const CATEGORY_TONES: Record<Category, 'primary' | 'success' | 'accent' | 'warning'> = {
  'AI Tools': 'primary',
  'Creator Economy': 'success',
  'Social Media': 'accent',
  'Marketing': 'warning',
};

const GROWTH_ACTIONS = [
  { id: 'scan', label: 'Scan Competitors', icon: Globe },
  { id: 'gaps', label: 'Find Gaps', icon: Search },
  { id: 'score', label: 'Score Trending', icon: BarChart2 },
  { id: 'angles', label: 'Generate Angles', icon: Lightbulb },
  { id: 'report', label: 'Create Report', icon: FileText },
];

const MOMENTUM_OPTIONS: (Momentum | 'All')[] = ['All', 'Rising', 'Peaking', 'Stable', 'Declining'];
const CATEGORY_OPTIONS: (Category | 'All')[] = ['All', 'AI Tools', 'Creator Economy', 'Social Media', 'Marketing'];

// --------------- Helpers ---------------

function scoreColor(score: number): string {
  if (score >= 8) return 'var(--success)';
  if (score >= 6) return 'var(--accent)';
  if (score >= 4) return 'var(--warning)';
  return 'var(--danger)';
}

// --------------- Sub-Components ---------------

function ScoreBar({ score, max = 10, className }: { score: number; max?: number; className?: string }) {
  const pct = (score / max) * 100;
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-[var(--surface-elevated)]', className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: scoreColor(score) }}
      />
    </div>
  );
}

function TrendScanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [topics, setTopics] = useState('');
  const [depth, setDepth] = useState<'quick' | 'deep'>('quick');
  const [scanning, setScanning] = useState(false);

  const handleScan = useCallback(() => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onClose();
    }, 1500);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <GlassCard variant="elevated" padding="lg" className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text)]">Run Trend Scan</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-muted)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Topics (comma-separated)</label>
        <textarea
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="AI agents, creator economy, video marketing..."
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] resize-none h-24 mb-4"
        />

        <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Scan Depth</label>
        <div className="flex gap-2 mb-6">
          {(['quick', 'deep'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              className={cn(
                'flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-all',
                depth === d
                  ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
              )}
            >
              {d === 'quick' ? 'Quick Scan' : 'Deep Scan'}
            </button>
          ))}
        </div>

        <button
          onClick={handleScan}
          disabled={scanning || !topics.trim()}
          className={cn(
            'w-full rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold text-white transition-all',
            'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]',
            'hover:shadow-[var(--glow-primary)] disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {scanning ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</span>
          ) : (
            'Start Scan'
          )}
        </button>
      </GlassCard>
    </div>
  );
}

// --------------- Main Page ---------------

export default function GrowthEnginePage() {
  const [momentumFilter, setMomentumFilter] = useState<Momentum | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  // Topic Scorer state
  const [scorerTopic, setScorerTopic] = useState('');
  const [scorerResult, setScorerResult] = useState<{
    score: number;
    relevance: number;
    timeliness: number;
    audienceFit: number;
    competition: number;
    recommendation: string;
  } | null>(null);
  const [scorerLoading, setScorerLoading] = useState(false);

  // Growth Actions state
  const [actionStates, setActionStates] = useState<Record<string, 'idle' | 'running' | 'done'>>({});

  // Mission toast state
  const [missionToast, setMissionToast] = useState<string | null>(null);

  // Expanded angles
  const [expandedAngle, setExpandedAngle] = useState<string | null>(null);

  // Filter signals
  const filteredSignals = MOCK_SIGNALS.filter((s) => {
    if (momentumFilter !== 'All' && s.momentum !== momentumFilter) return false;
    if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Handlers
  const handleScoreTopic = useCallback(() => {
    if (!scorerTopic.trim()) return;
    setScorerLoading(true);
    setTimeout(() => {
      setScorerResult({
        score: 7.8,
        relevance: 82,
        timeliness: 91,
        audienceFit: 74,
        competition: 68,
        recommendation: 'Strong topic with high timeliness. Consider narrowing to a specific sub-niche to reduce competition and improve audience fit.',
      });
      setScorerLoading(false);
    }, 800);
  }, [scorerTopic]);

  const handleAction = useCallback((id: string) => {
    setActionStates((prev) => ({ ...prev, [id]: 'running' }));
    setTimeout(() => {
      setActionStates((prev) => ({ ...prev, [id]: 'done' }));
      setTimeout(() => {
        setActionStates((prev) => ({ ...prev, [id]: 'idle' }));
      }, 2000);
    }, 1500);
  }, []);

  const handleCreateMission = useCallback((title: string) => {
    setMissionToast(title);
    setTimeout(() => setMissionToast(null), 2500);
  }, []);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Growth Engine</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Discover trends, score opportunities, and generate market angles
        </p>
      </div>

      {/* Stats Row */}
      <MotionFadeIn>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Signals Found" value={89} icon={TrendingUp} tone="primary" />
          <StatCard label="Opportunities" value={34} icon={Target} tone="success" />
          <StatCard label="Avg Score" value="7.8/10" icon={BarChart2} tone="accent" />
          <StatCard
            label="Active Scans"
            value={2}
            icon={Search}
            tone="warning"
            subtitle="2 scans running"
            subtitleTone="neutral"
          />
        </div>
      </MotionFadeIn>

      {/* Filter / Action Bar */}
      <MotionFadeIn>
        <GlassCard padding="sm" hover={false} className="mb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Momentum pills */}
              {MOMENTUM_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMomentumFilter(m)}
                  className={cn(
                    'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium transition-all',
                    momentumFilter === m
                      ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                  )}
                >
                  {m}
                </button>
              ))}

              <div className="h-5 w-px bg-[var(--border)] mx-1 hidden lg:block" />

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Right: search + scan button */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search signals..."
                  className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] w-48"
                />
              </div>
              <button
                onClick={() => setScanModalOpen(true)}
                className={cn(
                  'rounded-[var(--radius-sm)] px-4 py-1.5 text-xs font-semibold text-white transition-all whitespace-nowrap',
                  'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]',
                  'hover:shadow-[var(--glow-primary)]',
                )}
              >
                <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Run Trend Scan</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </MotionFadeIn>

      {/* Main Grid: Signals (left 3) + Panels (right 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Signal Grid — left column */}
        <div className="lg:col-span-3">
          <SectionCard title="Trend Signals" subtitle={`${filteredSignals.length} signals detected`}>
            {filteredSignals.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">No signals match your filters</div>
            ) : (
              <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredSignals.map((signal) => (
                  <MotionStaggerItem key={signal.id}>
                    <button
                      onClick={() => setSelectedSignal(selectedSignal === signal.id ? null : signal.id)}
                      className={cn(
                        'w-full text-left rounded-[var(--radius-sm)] border-l-[3px] border border-[var(--border)] bg-[var(--surface)] p-3 transition-all hover:border-[var(--border-hover)]',
                        MOMENTUM_BORDERS[signal.momentum],
                        selectedSignal === signal.id && 'ring-1 ring-[var(--primary)] border-[var(--primary)]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-xs font-semibold text-[var(--text)] line-clamp-2 leading-snug">{signal.title}</h4>
                        <span className="text-xs font-bold shrink-0" style={{ color: scoreColor(signal.score) }}>
                          {signal.score}
                        </span>
                      </div>
                      <ScoreBar score={signal.score} className="mb-2" />
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <StatusBadge label={signal.momentum} variant={MOMENTUM_TONES[signal.momentum]} size="sm" />
                        <Pill tone={CATEGORY_TONES[signal.category]} className="text-[10px]">{signal.category}</Pill>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                        <span>{signal.source}</span>
                        <span>{signal.relevance}% relevant</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{signal.timestamp}</div>
                    </button>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            )}
          </SectionCard>
        </div>

        {/* Right Column — Panels */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Opportunity Board */}
          <MotionFadeIn>
            <SectionCard title="Opportunity Board" subtitle="Top ranked opportunities">
              <div className="space-y-3">
                {MOCK_OPPORTUNITIES.map((opp, i) => (
                  <div
                    key={opp.id}
                    className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-muted)] text-xs font-bold text-[var(--primary)]">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text)] truncate">{opp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <ScoreBar score={opp.score} className="flex-1" />
                        <span className="text-[10px] font-semibold shrink-0" style={{ color: scoreColor(opp.score) }}>{opp.score}</span>
                        <StatusBadge label={opp.momentum} variant={MOMENTUM_TONES[opp.momentum]} size="sm" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateMission(opp.title)}
                      className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--primary)] bg-[var(--primary-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                    >
                      Create Mission
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </MotionFadeIn>

          {/* Market Angles */}
          <MotionFadeIn>
            <SectionCard title="Market Angles" subtitle="Strategic content angles">
              <div className="space-y-2">
                {MOCK_ANGLES.map((angle) => (
                  <div
                    key={angle.id}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedAngle(expandedAngle === angle.id ? null : angle.id)}
                      className="w-full text-left p-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xs font-semibold text-[var(--text)] truncate">{angle.title}</h4>
                          <Pill tone="primary" className="text-[10px] shrink-0">{angle.audience}</Pill>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{angle.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold" style={{ color: scoreColor(angle.confidence / 10) }}>
                          {angle.confidence}%
                        </span>
                        {expandedAngle === angle.id ? (
                          <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        )}
                      </div>
                    </button>
                    {expandedAngle === angle.id && (
                      <div className="px-3 pb-3 border-t border-[var(--border)]">
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pt-2">{angle.analysis}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          </MotionFadeIn>

          {/* Topic Scorer */}
          <MotionFadeIn>
            <SectionCard title="Topic Scorer" subtitle="Score any topic for opportunity">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={scorerTopic}
                  onChange={(e) => setScorerTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScoreTopic()}
                  placeholder="Enter a topic to score..."
                  className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
                <button
                  onClick={handleScoreTopic}
                  disabled={scorerLoading || !scorerTopic.trim()}
                  className={cn(
                    'rounded-[var(--radius-sm)] px-4 py-2 text-xs font-semibold text-white transition-all',
                    'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]',
                    'hover:shadow-[var(--glow-primary)] disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {scorerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Score'}
                </button>
              </div>

              {scorerResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-elevated)]">
                      <span className="text-2xl font-bold" style={{ color: scoreColor(scorerResult.score) }}>
                        {scorerResult.score}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[var(--text)]">{scorerTopic}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Overall Opportunity Score</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Relevance', value: scorerResult.relevance },
                      { label: 'Timeliness', value: scorerResult.timeliness },
                      { label: 'Audience Fit', value: scorerResult.audienceFit },
                      { label: 'Competition', value: scorerResult.competition },
                    ].map((b) => (
                      <div key={b.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--text-muted)] w-20 shrink-0">{b.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-elevated)]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${b.value}%`, backgroundColor: scoreColor(b.value / 10) }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--text)] w-8 text-right">{b.value}%</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--surface-elevated)] rounded-[var(--radius-sm)] p-2.5 leading-relaxed">
                    {scorerResult.recommendation}
                  </p>
                </div>
              )}
            </SectionCard>
          </MotionFadeIn>

          {/* Growth Actions */}
          <MotionFadeIn>
            <SectionCard title="Growth Actions" subtitle="One-click intelligence operations">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GROWTH_ACTIONS.map((action) => {
                  const state = actionStates[action.id] || 'idle';
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => state === 'idle' && handleAction(action.id)}
                      disabled={state === 'running'}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-3 text-xs font-medium transition-all',
                        state === 'done'
                          ? 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]'
                          : state === 'running'
                            ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]',
                      )}
                    >
                      {state === 'done' ? (
                        <Check className="h-4 w-4" />
                      ) : state === 'running' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span className="text-center leading-tight">
                        {state === 'running' ? 'Running...' : state === 'done' ? 'Done' : action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          </MotionFadeIn>
        </div>
      </div>

      {/* Trend Scan Modal */}
      <TrendScanModal open={scanModalOpen} onClose={() => setScanModalOpen(false)} />

      {/* Mission Toast */}
      {missionToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-[var(--radius)] border border-[var(--success)] bg-[var(--success-muted)] px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5">
          <Zap className="h-4 w-4 text-[var(--success)]" />
          <span className="text-sm font-medium text-[var(--success)]">
            Mission created: {missionToast}
          </span>
        </div>
      )}
    </PageWrapper>
  );
}
