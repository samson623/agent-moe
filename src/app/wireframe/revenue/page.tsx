'use client';

import { useState, useCallback } from 'react';
import {
  GlassCard,
  StatCard,
  SectionCard,
  StatusBadge,
  Pill,
  PageWrapper,
  SliderInput,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  AnimatePresence,
  motion,
  modalVariants,
  overlayVariants,
} from '@/components/nebula';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  Package,
  Zap,
  MousePointerClick,
  Plus,
  X,
  Copy,
  Check,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Target,
  Users,
  Star,
  Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

type OfferType = 'Digital Product' | 'Course' | 'Coaching' | 'Service' | 'Template' | 'SaaS';
type OfferStatus = 'active' | 'draft' | 'archived';
type TabKey = 'library' | 'pricing' | 'cta' | 'simulator';

interface Offer {
  id: string;
  title: string;
  type: OfferType;
  price: number;
  status: OfferStatus;
  description: string;
  conversionRate: number;
  ctaCount: number;
  targetAudience: string;
  valueProposition: string;
  linkedCTAs: string[];
}

interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  conversionRate: string;
  includes: string[];
}

interface CTAVariant {
  id: string;
  text: string;
  style: string;
  charCount: number;
  note: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────

const MOCK_OFFERS: Offer[] = [
  {
    id: '1',
    title: 'AI Content Playbook',
    type: 'Digital Product',
    price: 29,
    status: 'active',
    description: 'Step-by-step guide to automating your content pipeline with AI operators. Includes templates and workflows.',
    conversionRate: 8.2,
    ctaCount: 4,
    targetAudience: 'Solo creators and small marketing teams',
    valueProposition: 'Save 20+ hours/week on content creation with proven AI workflows',
    linkedCTAs: ['Grab the Playbook', 'Start Automating Today', 'Get Instant Access'],
  },
  {
    id: '2',
    title: 'Growth Engine Masterclass',
    type: 'Course',
    price: 297,
    status: 'active',
    description: 'Complete video course on building automated growth systems. 12 modules, lifetime access.',
    conversionRate: 4.5,
    ctaCount: 3,
    targetAudience: 'Entrepreneurs scaling from 6 to 7 figures',
    valueProposition: 'Build a self-running growth engine that generates leads 24/7',
    linkedCTAs: ['Enroll Now', 'Watch Free Preview', 'Join the Masterclass'],
  },
  {
    id: '3',
    title: '1:1 AI Strategy Sprint',
    type: 'Coaching',
    price: 997,
    status: 'active',
    description: 'Intensive 4-week coaching program. Weekly calls, async Slack support, custom AI stack build.',
    conversionRate: 2.1,
    ctaCount: 2,
    targetAudience: 'Agency owners and tech-forward founders',
    valueProposition: 'Get a custom AI infrastructure built and deployed in 30 days',
    linkedCTAs: ['Book Your Sprint', 'Apply Now'],
  },
  {
    id: '4',
    title: 'Content Automation Setup',
    type: 'Service',
    price: 2997,
    status: 'draft',
    description: 'Done-for-you implementation of the full Agent MOE stack. Includes 90 days of support.',
    conversionRate: 1.3,
    ctaCount: 1,
    targetAudience: 'Brands doing $50K+/mo wanting full automation',
    valueProposition: 'Hands-off content and growth automation, fully managed',
    linkedCTAs: ['Get a Quote'],
  },
  {
    id: '5',
    title: 'Social Media Prompt Pack',
    type: 'Template',
    price: 49,
    status: 'archived',
    description: '200+ battle-tested prompts for X, LinkedIn, Instagram, and TikTok content generation.',
    conversionRate: 12.4,
    ctaCount: 3,
    targetAudience: 'Content creators and social media managers',
    valueProposition: 'Never stare at a blank screen again — ready-to-use prompts for every platform',
    linkedCTAs: ['Download Now', 'Get the Pack', 'Start Creating'],
  },
  {
    id: '6',
    title: 'MOE SaaS Platform',
    type: 'SaaS',
    price: 97,
    status: 'draft',
    description: 'Full SaaS access to the Agent MOE platform. All operators, analytics, and automation tools.',
    conversionRate: 3.8,
    ctaCount: 2,
    targetAudience: 'Teams and agencies managing multiple brands',
    valueProposition: 'One platform for all your AI-powered content and revenue operations',
    linkedCTAs: ['Start Free Trial', 'See Pricing'],
  },
];

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free Lead Magnet',
    price: '$0',
    description: 'Hook them in with irresistible free value',
    conversionRate: '35-50%',
    includes: ['AI Content Checklist PDF', 'Email welcome sequence', '3-day mini course access', 'Community invite'],
  },
  {
    id: 'low',
    name: 'Low Ticket',
    price: '$29-49',
    description: 'Convert leads into paying customers',
    conversionRate: '8-15%',
    includes: ['Digital product or template', 'Instant delivery', 'Email support', 'Upsell to mid-tier'],
  },
  {
    id: 'mid',
    name: 'Mid Tier',
    price: '$197-497',
    description: 'Core revenue driver with high perceived value',
    conversionRate: '3-6%',
    includes: ['Video course or workshop', 'Community access', 'Monthly Q&A calls', 'Bonus templates'],
  },
  {
    id: 'high',
    name: 'High Ticket',
    price: '$997-2,997',
    description: 'Premium offer for serious buyers',
    conversionRate: '1-3%',
    includes: ['1:1 coaching or service', 'Custom strategy build', 'Slack/async support', '90-day engagement'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$5,000+',
    description: 'Elite tier for maximum LTV',
    conversionRate: '0.5-1%',
    includes: ['Done-for-you implementation', 'Dedicated account manager', 'Revenue share model', 'Annual retainer'],
  },
];

const PLATFORMS = ['X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube', 'Email'] as const;
const CONTENT_TYPES = ['Post', 'Thread', 'Video', 'Story', 'Newsletter'] as const;
const OFFER_TYPES: OfferType[] = ['Digital Product', 'Course', 'Coaching', 'Service', 'Template', 'SaaS'];
const FILTER_OPTIONS = ['All', ...OFFER_TYPES] as const;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'library', label: 'Library' },
  { key: 'pricing', label: 'Pricing Ladder' },
  { key: 'cta', label: 'CTA Builder' },
  { key: 'simulator', label: 'Simulator' },
];

const STATUS_MAP: Record<OfferStatus, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  draft: { variant: 'warning', label: 'Draft' },
  archived: { variant: 'default', label: 'Archived' },
};

const TYPE_TONE: Record<OfferType, 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'default'> = {
  'Digital Product': 'primary',
  Course: 'accent',
  Coaching: 'success',
  Service: 'warning',
  Template: 'default',
  SaaS: 'danger',
};

// ─── CTA Generation (mock) ───────────────────────────────────────────────

function generateMockCTAs(platform: string, contentType: string, offer: Offer): CTAVariant[] {
  const styles = ['Direct', 'Soft', 'Urgency', 'Social Proof'];
  const templates: Record<string, string[]> = {
    Direct: [
      `Get ${offer.title} now — $${offer.price}`,
      `Grab ${offer.title} today`,
      `Ready to level up? Get ${offer.title}`,
      `${offer.title} is live. Grab yours.`,
    ],
    Soft: [
      `I put together something for you — ${offer.title}. Link in bio.`,
      `If you've been struggling with this, ${offer.title} might help.`,
      `Here's what changed everything for me: ${offer.title}`,
      `Spent months building this. It's finally ready.`,
    ],
    Urgency: [
      `Only 48 hours left to grab ${offer.title} at $${offer.price}`,
      `This deal on ${offer.title} won't last. Act now.`,
      `Price goes up tomorrow. Get ${offer.title} while you can.`,
      `Last chance — ${offer.title} closes tonight at midnight.`,
    ],
    'Social Proof': [
      `500+ people already using ${offer.title}. Join them.`,
      `"This changed my workflow completely" — join 500+ users of ${offer.title}`,
      `The #1 rated ${offer.type.toLowerCase()} for AI automation. See why.`,
      `Everyone's asking about ${offer.title}. Here's why.`,
    ],
  };

  const notes: Record<string, string> = {
    X: `Keep under 280 chars. ${contentType === 'Thread' ? 'Use as thread opener.' : 'Standalone post.'}`,
    LinkedIn: `Professional tone. ${contentType === 'Post' ? 'Add line breaks for readability.' : 'Adapt for format.'}`,
    Instagram: `${contentType === 'Story' ? 'Add swipe-up link sticker.' : 'Use "link in bio" call-out.'}`,
    TikTok: 'Pin as first comment or overlay text on video.',
    YouTube: `${contentType === 'Video' ? 'Add to description + pinned comment.' : 'Use as community post CTA.'}`,
    Email: `Place above the fold. ${contentType === 'Newsletter' ? 'Use button CTA.' : 'Inline text link.'}`,
  };

  return styles.map((style, i) => {
    const pool = templates[style] || templates.Direct!;
    const text = pool[i % pool.length]!;
    return {
      id: `cta-${i}`,
      text,
      style,
      charCount: text.length,
      note: notes[platform] || 'Adapt to platform guidelines.',
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────

export default function RevenueLabWireframe() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('library');

  // Library state
  const [filter, setFilter] = useState('All');
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOffer, setNewOffer] = useState({ title: '', type: 'Digital Product' as OfferType, price: '', description: '' });

  // Pricing state
  const [activeTier, setActiveTier] = useState<string | null>(null);

  // CTA Builder state
  const [ctaPlatform, setCtaPlatform] = useState<string>('X');
  const [ctaContentType, setCtaContentType] = useState<string>('Post');
  const [ctaOffer, setCtaOffer] = useState<string>(MOCK_OFFERS[0]!.id);
  const [ctaResults, setCtaResults] = useState<CTAVariant[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulator state
  const [dailyRuns, setDailyRuns] = useState(5);
  const [monthlyLeads, setMonthlyLeads] = useState(100);
  const [convRate, setConvRate] = useState(5);
  const [avgOrder, setAvgOrder] = useState(97);

  // ── Computed values (simulator) ──
  const monthlyCustomers = Math.round(monthlyLeads * (convRate / 100));
  const monthlyRevenue = monthlyCustomers * avgOrder;
  const annualRevenue = monthlyRevenue * 12;
  const aiCosts = dailyRuns * 30 * 0.12; // ~$0.12 per run
  const platformCosts = 49; // fixed monthly
  const totalCosts = aiCosts + platformCosts;
  const profit = monthlyRevenue - totalCosts;
  const profitMargin = monthlyRevenue > 0 ? (profit / monthlyRevenue) * 100 : 0;
  const roi = totalCosts > 0 ? monthlyRevenue / totalCosts : 0;

  // ── Handlers ──
  const filteredOffers = filter === 'All' ? offers : offers.filter((o) => o.type === filter);

  const handleCreateOffer = useCallback(() => {
    if (!newOffer.title.trim()) return;
    const created: Offer = {
      id: `new-${Date.now()}`,
      title: newOffer.title,
      type: newOffer.type,
      price: parseFloat(newOffer.price) || 0,
      status: 'draft',
      description: newOffer.description || 'New offer description.',
      conversionRate: 0,
      ctaCount: 0,
      targetAudience: 'To be defined',
      valueProposition: 'To be defined',
      linkedCTAs: [],
    };
    setOffers((prev) => [created, ...prev]);
    setNewOffer({ title: '', type: 'Digital Product', price: '', description: '' });
    setShowCreateModal(false);
  }, [newOffer]);

  const handleGenerateCTAs = useCallback(() => {
    const offer = offers.find((o) => o.id === ctaOffer);
    if (!offer) return;
    setCtaResults(generateMockCTAs(ctaPlatform, ctaContentType, offer));
  }, [ctaPlatform, ctaContentType, ctaOffer, offers]);

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <PageWrapper maxWidth="2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Revenue Lab</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Manage offers, pricing, CTAs, and revenue projections</p>
      </div>

      {/* Stats Row */}
      <MotionStagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionStaggerItem>
          <StatCard label="Total Offers" value={8} icon={Package} tone="primary" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Active" value={3} icon={Zap} tone="success" subtitle="37.5% of total" subtitleTone="neutral" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Revenue Potential" value="$24.5K/mo" icon={DollarSign} tone="accent" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="CTA Sets" value={12} icon={MousePointerClick} tone="default" />
        </MotionStaggerItem>
      </MotionStagger>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="revenue-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'library' && (
          <motion.div key="library" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <LibraryTab
              offers={filteredOffers}
              filter={filter}
              setFilter={setFilter}
              selectedOffer={selectedOffer}
              setSelectedOffer={setSelectedOffer}
              onCreateClick={() => setShowCreateModal(true)}
            />
          </motion.div>
        )}
        {activeTab === 'pricing' && (
          <motion.div key="pricing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <PricingLadderTab activeTier={activeTier} setActiveTier={setActiveTier} />
          </motion.div>
        )}
        {activeTab === 'cta' && (
          <motion.div key="cta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <CTABuilderTab
              offers={offers}
              platform={ctaPlatform}
              setPlatform={setCtaPlatform}
              contentType={ctaContentType}
              setContentType={setCtaContentType}
              selectedOffer={ctaOffer}
              setSelectedOffer={setCtaOffer}
              results={ctaResults}
              onGenerate={handleGenerateCTAs}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          </motion.div>
        )}
        {activeTab === 'simulator' && (
          <motion.div key="simulator" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <SimulatorTab
              dailyRuns={dailyRuns}
              setDailyRuns={setDailyRuns}
              monthlyLeads={monthlyLeads}
              setMonthlyLeads={setMonthlyLeads}
              convRate={convRate}
              setConvRate={setConvRate}
              avgOrder={avgOrder}
              setAvgOrder={setAvgOrder}
              monthlyRevenue={monthlyRevenue}
              annualRevenue={annualRevenue}
              aiCosts={aiCosts}
              platformCosts={platformCosts}
              totalCosts={totalCosts}
              profitMargin={profitMargin}
              roi={roi}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Offer Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              variants={overlayVariants}
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div variants={modalVariants} className="relative w-full max-w-md">
              <GlassCard variant="elevated" padding="lg">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--text)]">Create Offer</h3>
                  <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Title</label>
                    <input
                      value={newOffer.title}
                      onChange={(e) => setNewOffer((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Offer title..."
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Type</label>
                    <select
                      value={newOffer.type}
                      onChange={(e) => setNewOffer((p) => ({ ...p, type: e.target.value as OfferType }))}
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      {OFFER_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Price ($)</label>
                    <input
                      type="number"
                      value={newOffer.price}
                      onChange={(e) => setNewOffer((p) => ({ ...p, price: e.target.value }))}
                      placeholder="0"
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Description</label>
                    <textarea
                      value={newOffer.description}
                      onChange={(e) => setNewOffer((p) => ({ ...p, description: e.target.value }))}
                      placeholder="What's included..."
                      rows={3}
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                    />
                  </div>

                  <button
                    onClick={handleCreateOffer}
                    disabled={!newOffer.title.trim()}
                    className="w-full rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    Create Offer
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

// ─── Library Tab ──────────────────────────────────────────────────────────

function LibraryTab({
  offers,
  filter,
  setFilter,
  selectedOffer,
  setSelectedOffer,
  onCreateClick,
}: {
  offers: Offer[];
  filter: string;
  setFilter: (f: string) => void;
  selectedOffer: Offer | null;
  setSelectedOffer: (o: Offer | null) => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium transition-all',
              filter === f
                ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]',
            )}
          >
            {f}
          </button>
        ))}
        <button
          onClick={onCreateClick}
          className="ml-auto flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Offer
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Offer Cards */}
        <div className={cn('space-y-3', selectedOffer ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <MotionStagger className={cn('grid gap-3', selectedOffer ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
            {offers.map((offer) => (
              <MotionStaggerItem key={offer.id}>
                <GlassCard
                  padding="md"
                  variant={selectedOffer?.id === offer.id ? 'glow' : 'default'}
                  className="cursor-pointer"
                >
                  <div onClick={() => setSelectedOffer(selectedOffer?.id === offer.id ? null : offer)}>
                    <div className="mb-2 flex items-center justify-between">
                      <Pill tone={TYPE_TONE[offer.type]}>{offer.type}</Pill>
                      <StatusBadge label={STATUS_MAP[offer.status].label} variant={STATUS_MAP[offer.status].variant} />
                    </div>
                    <h4 className="mb-1 text-sm font-semibold text-[var(--text)]">{offer.title}</h4>
                    <p className="mb-3 line-clamp-2 text-xs text-[var(--text-muted)]">{offer.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-[var(--text)]">${offer.price.toLocaleString()}</span>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {offer.conversionRate}%
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {offer.ctaCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedOffer && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-1"
            >
              <GlassCard variant="elevated" padding="md" hover={false}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text)]">Offer Details</h3>
                  <button onClick={() => setSelectedOffer(null)} className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text)]">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-[var(--text)]">{selectedOffer.title}</h4>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Pill tone={TYPE_TONE[selectedOffer.type]}>{selectedOffer.type}</Pill>
                      <StatusBadge label={STATUS_MAP[selectedOffer.status].label} variant={STATUS_MAP[selectedOffer.status].variant} />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-[var(--text-muted)]">Price</span>
                    <p className="text-xl font-bold text-[var(--primary)]">${selectedOffer.price.toLocaleString()}</p>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-[var(--text-muted)]">Description</span>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{selectedOffer.description}</p>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-[var(--text-muted)]">Target Audience</span>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{selectedOffer.targetAudience}</p>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-[var(--text-muted)]">Value Proposition</span>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{selectedOffer.valueProposition}</p>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-[var(--text-muted)]">Linked CTAs</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedOffer.linkedCTAs.map((cta, i) => (
                        <Pill key={i} tone="muted">{cta}</Pill>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2 border-t border-[var(--border)]">
                    <div className="text-center">
                      <p className="text-lg font-bold text-[var(--text)]">{selectedOffer.conversionRate}%</p>
                      <p className="text-xs text-[var(--text-muted)]">Conv. Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-[var(--text)]">{selectedOffer.ctaCount}</p>
                      <p className="text-xs text-[var(--text-muted)]">CTA Sets</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Pricing Ladder Tab ───────────────────────────────────────────────────

function PricingLadderTab({
  activeTier,
  setActiveTier,
}: {
  activeTier: string | null;
  setActiveTier: (id: string | null) => void;
}) {
  const selected = PRICING_TIERS.find((t) => t.id === activeTier);

  return (
    <div className="space-y-6">
      {/* Visual Ladder */}
      <SectionCard title="Pricing Ladder" subtitle="Ascending value tiers from free to premium">
        <div className="flex flex-col items-center gap-3 py-4 sm:flex-row sm:items-end sm:gap-4">
          {PRICING_TIERS.map((tier, i) => {
            const isActive = activeTier === tier.id;
            const height = 80 + i * 40; // ascending heights

            return (
              <div key={tier.id} className="flex flex-1 flex-col items-center gap-2">
                {/* Step block */}
                <button
                  onClick={() => setActiveTier(isActive ? null : tier.id)}
                  className={cn(
                    'w-full rounded-[var(--radius)] border p-3 transition-all text-center',
                    isActive
                      ? 'border-[var(--primary)] bg-[var(--primary-muted)] shadow-[var(--glow-primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-solid)] hover:border-[var(--border-hover)]',
                  )}
                  style={{ minHeight: `${height}px` }}
                >
                  <p className={cn('text-xs font-semibold', isActive ? 'text-[var(--primary)]' : 'text-[var(--text)]')}>
                    {tier.name}
                  </p>
                  <p className={cn('mt-1 text-lg font-bold', isActive ? 'text-[var(--primary)]' : 'text-[var(--text)]')}>
                    {tier.price}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{tier.conversionRate}</p>
                </button>

                {/* Connector arrow */}
                {i < PRICING_TIERS.length - 1 && (
                  <div className="hidden sm:block absolute" style={{ display: 'none' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Connector arrows (horizontal row) */}
        <div className="hidden sm:flex items-center justify-center gap-0 -mt-2 mb-2">
          {PRICING_TIERS.slice(0, -1).map((_, i) => (
            <div key={i} className="flex items-center text-[var(--text-muted)]">
              <div className="w-12 h-px bg-[var(--border)]" />
              <ArrowRight className="h-3.5 w-3.5 -ml-1 shrink-0" />
              <div className="w-12 h-px bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Tier Detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
          >
            <SectionCard title={selected.name} subtitle={selected.description}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">Price Range</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">{selected.price}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">Expected Conversion</p>
                  <p className="text-2xl font-bold text-[var(--success)]">{selected.conversionRate}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">What&apos;s Included</p>
                <ul className="space-y-1.5">
                  {selected.includes.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CTA Builder Tab ──────────────────────────────────────────────────────

function CTABuilderTab({
  offers,
  platform,
  setPlatform,
  contentType,
  setContentType,
  selectedOffer,
  setSelectedOffer,
  results,
  onGenerate,
  copiedId,
  onCopy,
}: {
  offers: Offer[];
  platform: string;
  setPlatform: (p: string) => void;
  contentType: string;
  setContentType: (t: string) => void;
  selectedOffer: string;
  setSelectedOffer: (id: string) => void;
  results: CTAVariant[];
  onGenerate: () => void;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const STYLE_ICONS: Record<string, typeof Zap> = {
    Direct: Target,
    Soft: Star,
    Urgency: Zap,
    'Social Proof': Users,
  };

  return (
    <div className="space-y-5">
      {/* Builder Controls */}
      <SectionCard title="CTA Builder" subtitle="Generate platform-specific CTAs for your offers">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Platform */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Platform</label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={cn(
                    'rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium transition-all',
                    platform === p
                      ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Content Type</label>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setContentType(t)}
                  className={cn(
                    'rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium transition-all',
                    contentType === t
                      ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Offer Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Offer</label>
            <select
              value={selectedOffer}
              onChange={(e) => setSelectedOffer(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            >
              {offers.map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={onGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Generate CTAs
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Results */}
      {results.length > 0 && (
        <MotionStagger className="grid gap-3 sm:grid-cols-2">
          {results.map((cta) => {
            const Icon = STYLE_ICONS[cta.style] || Target;
            const isCopied = copiedId === cta.id;

            return (
              <MotionStaggerItem key={cta.id}>
                <GlassCard padding="md">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary-muted)]">
                        <Icon className="h-3.5 w-3.5 text-[var(--primary)]" />
                      </div>
                      <Pill tone="primary">{cta.style}</Pill>
                    </div>
                    <button
                      onClick={() => onCopy(cta.id, cta.text)}
                      className={cn(
                        'flex items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-medium transition-all',
                        isCopied
                          ? 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]',
                      )}
                    >
                      {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <p className="mb-2 text-sm font-medium text-[var(--text)]">&ldquo;{cta.text}&rdquo;</p>

                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{cta.charCount} chars</span>
                    <span>{cta.note}</span>
                  </div>
                </GlassCard>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      )}
    </div>
  );
}

// ─── Simulator Tab ────────────────────────────────────────────────────────

function SimulatorTab({
  dailyRuns,
  setDailyRuns,
  monthlyLeads,
  setMonthlyLeads,
  convRate,
  setConvRate,
  avgOrder,
  setAvgOrder,
  monthlyRevenue,
  annualRevenue,
  aiCosts,
  platformCosts,
  totalCosts,
  profitMargin,
  roi,
}: {
  dailyRuns: number;
  setDailyRuns: (v: number) => void;
  monthlyLeads: number;
  setMonthlyLeads: (v: number) => void;
  convRate: number;
  setConvRate: (v: number) => void;
  avgOrder: number;
  setAvgOrder: (v: number) => void;
  monthlyRevenue: number;
  annualRevenue: number;
  aiCosts: number;
  platformCosts: number;
  totalCosts: number;
  profitMargin: number;
  roi: number;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Sliders */}
      <SectionCard title="Inputs" subtitle="Adjust parameters to model revenue">
        <div className="space-y-5">
          <SliderInput
            label="Daily Content Runs"
            value={dailyRuns}
            min={1}
            max={20}
            onChange={setDailyRuns}
          />
          <SliderInput
            label="Monthly Leads Generated"
            value={monthlyLeads}
            min={10}
            max={1000}
            step={10}
            onChange={setMonthlyLeads}
          />
          <SliderInput
            label="Conversion Rate"
            value={convRate}
            min={1}
            max={20}
            onChange={setConvRate}
            formatValue={(v) => `${v}%`}
          />
          <SliderInput
            label="Average Order Value"
            value={avgOrder}
            min={10}
            max={500}
            step={1}
            onChange={setAvgOrder}
            formatValue={(v) => `$${v}`}
          />
        </div>
      </SectionCard>

      {/* Results */}
      <div className="space-y-4">
        {/* Big number */}
        <GlassCard variant="glow" padding="lg" hover={false}>
          <div className="text-center">
            <p className="text-xs font-medium text-[var(--text-muted)]">Monthly Revenue</p>
            <p className="mt-1 text-4xl font-bold text-[var(--primary)]">
              ${monthlyRevenue.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">${annualRevenue.toLocaleString()}</span> / year
            </p>
          </div>
        </GlassCard>

        {/* Cost Breakdown */}
        <SectionCard title="Cost Breakdown" subtitle="Estimated monthly operating costs">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">AI Costs ({dailyRuns} runs/day)</span>
              <span className="font-medium text-[var(--text)]">${aiCosts.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Platform Costs</span>
              <span className="font-medium text-[var(--text)]">${platformCosts.toFixed(2)}</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--text)]">Total Costs</span>
              <span className="font-bold text-[var(--text)]">${totalCosts.toFixed(2)}</span>
            </div>
          </div>
        </SectionCard>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard padding="md" hover={false}>
            <div className="text-center">
              <BarChart3 className="mx-auto h-5 w-5 text-[var(--success)]" />
              <p className="mt-2 text-2xl font-bold text-[var(--success)]">{profitMargin.toFixed(1)}%</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Profit Margin</p>
            </div>
          </GlassCard>
          <GlassCard padding="md" hover={false}>
            <div className="text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-[var(--accent)]" />
              <p className="mt-2 text-2xl font-bold text-[var(--accent)]">{roi.toFixed(1)}x</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">ROI Multiplier</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
