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
} from '@/components/nebula';
import { cn } from '@/lib/utils';
import {
  Rocket,
  BarChart3,
  Zap,
  Target,
  Search,
  Plus,
  X,
  Calendar,
  Eye,
  Send,
  Archive,
  CheckCircle2,
  Circle,
  Clock,
  Pause,
  Play,
  FileText,
  Image,
  Video,
  Type,
  Trash2,
  ChevronDown,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CampaignStatus = 'Draft' | 'Ready' | 'Active' | 'Completed' | 'Paused';
type Platform = 'X' | 'LinkedIn' | 'Instagram' | 'TikTok' | 'YouTube';
type AssetType = 'Post' | 'Image' | 'Video' | 'Article' | 'Story' | 'Reel';
type AssetStatus = 'Scheduled' | 'Published' | 'Pending' | 'Failed';
type MilestoneStatus = 'completed' | 'current' | 'upcoming';

interface Asset {
  id: string;
  title: string;
  type: AssetType;
  platform: Platform;
  status: AssetStatus;
  scheduledDate: string;
}

interface Milestone {
  id: string;
  date: string;
  title: string;
  status: MilestoneStatus;
  description: string;
}

interface Campaign {
  id: string;
  title: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  platforms: Platform[];
  assetCount: number;
  progress: number;
  description: string;
  assets: Asset[];
  milestones: Milestone[];
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const ALL_PLATFORMS: Platform[] = ['X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube'];

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    title: 'Q1 Product Launch',
    status: 'Active',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    platforms: ['X', 'LinkedIn', 'Instagram'],
    assetCount: 8,
    progress: 62,
    description: 'Full-channel launch campaign for the new AI assistant product line targeting enterprise customers.',
    assets: [
      { id: 'a1', title: 'Launch Announcement Post', type: 'Post', platform: 'X', status: 'Published', scheduledDate: '2026-03-01' },
      { id: 'a2', title: 'Product Demo Video', type: 'Video', platform: 'LinkedIn', status: 'Published', scheduledDate: '2026-03-02' },
      { id: 'a3', title: 'Feature Carousel', type: 'Image', platform: 'Instagram', status: 'Scheduled', scheduledDate: '2026-03-18' },
      { id: 'a4', title: 'Customer Testimonial', type: 'Post', platform: 'LinkedIn', status: 'Pending', scheduledDate: '2026-03-20' },
      { id: 'a5', title: 'Behind the Scenes Reel', type: 'Reel', platform: 'Instagram', status: 'Pending', scheduledDate: '2026-03-22' },
    ],
    milestones: [
      { id: 'm1', date: '2026-03-01', title: 'Campaign Kickoff', status: 'completed', description: 'Launch announcement across all channels' },
      { id: 'm2', date: '2026-03-05', title: 'Content Wave 1', status: 'completed', description: 'Product demos and feature highlights published' },
      { id: 'm3', date: '2026-03-12', title: 'Influencer Outreach', status: 'completed', description: 'Partner posts and co-branded content live' },
      { id: 'm4', date: '2026-03-18', title: 'Mid-Campaign Push', status: 'current', description: 'Carousel posts and retargeting ads deployed' },
      { id: 'm5', date: '2026-03-25', title: 'Final Wave', status: 'upcoming', description: 'Testimonials and case studies published' },
      { id: 'm6', date: '2026-03-31', title: 'Campaign Wrap-up', status: 'upcoming', description: 'Performance report and retrospective' },
    ],
  },
  {
    id: '2',
    title: 'Brand Awareness Series',
    status: 'Ready',
    startDate: '2026-03-20',
    endDate: '2026-04-20',
    platforms: ['X', 'TikTok', 'YouTube'],
    assetCount: 6,
    progress: 100,
    description: 'Thought-leadership content series to boost brand visibility among developer communities.',
    assets: [
      { id: 'b1', title: 'Intro Thread', type: 'Post', platform: 'X', status: 'Scheduled', scheduledDate: '2026-03-20' },
      { id: 'b2', title: 'TikTok Teaser', type: 'Video', platform: 'TikTok', status: 'Scheduled', scheduledDate: '2026-03-21' },
      { id: 'b3', title: 'Deep Dive Article', type: 'Article', platform: 'LinkedIn', status: 'Pending', scheduledDate: '2026-03-25' },
      { id: 'b4', title: 'YouTube Explainer', type: 'Video', platform: 'YouTube', status: 'Scheduled', scheduledDate: '2026-03-28' },
      { id: 'b5', title: 'Community Q&A Post', type: 'Post', platform: 'X', status: 'Pending', scheduledDate: '2026-04-02' },
    ],
    milestones: [
      { id: 'n1', date: '2026-03-15', title: 'Asset Review', status: 'completed', description: 'All assets reviewed and approved' },
      { id: 'n2', date: '2026-03-18', title: 'Scheduling Complete', status: 'completed', description: 'All posts scheduled across platforms' },
      { id: 'n3', date: '2026-03-20', title: 'Launch Day', status: 'current', description: 'First posts go live' },
      { id: 'n4', date: '2026-03-28', title: 'Video Release', status: 'upcoming', description: 'YouTube explainer and follow-up content' },
      { id: 'n5', date: '2026-04-10', title: 'Engagement Review', status: 'upcoming', description: 'Analyze metrics and adjust strategy' },
    ],
  },
  {
    id: '3',
    title: 'Holiday Promo Sprint',
    status: 'Completed',
    startDate: '2026-02-10',
    endDate: '2026-02-28',
    platforms: ['Instagram', 'TikTok'],
    assetCount: 5,
    progress: 100,
    description: 'Short-burst promotional campaign for seasonal discounts and limited-time offers.',
    assets: [
      { id: 'c1', title: 'Promo Reel', type: 'Reel', platform: 'Instagram', status: 'Published', scheduledDate: '2026-02-10' },
      { id: 'c2', title: 'Countdown Story', type: 'Story', platform: 'Instagram', status: 'Published', scheduledDate: '2026-02-14' },
      { id: 'c3', title: 'TikTok Ad', type: 'Video', platform: 'TikTok', status: 'Published', scheduledDate: '2026-02-16' },
      { id: 'c4', title: 'Flash Sale Post', type: 'Post', platform: 'Instagram', status: 'Published', scheduledDate: '2026-02-20' },
      { id: 'c5', title: 'Thank You Wrap-up', type: 'Post', platform: 'TikTok', status: 'Published', scheduledDate: '2026-02-28' },
    ],
    milestones: [
      { id: 'o1', date: '2026-02-10', title: 'Campaign Start', status: 'completed', description: 'Promo reel published' },
      { id: 'o2', date: '2026-02-14', title: 'Valentine Push', status: 'completed', description: 'Countdown stories live' },
      { id: 'o3', date: '2026-02-20', title: 'Flash Sale', status: 'completed', description: 'Limited-time offer posts' },
      { id: 'o4', date: '2026-02-28', title: 'Wrap-up', status: 'completed', description: 'Campaign completed successfully' },
    ],
  },
  {
    id: '4',
    title: 'Hiring Campaign',
    status: 'Draft',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    platforms: ['LinkedIn', 'X'],
    assetCount: 3,
    progress: 30,
    description: 'Employer branding and recruitment campaign to attract senior engineers and product managers.',
    assets: [
      { id: 'd1', title: 'We\'re Hiring Post', type: 'Post', platform: 'LinkedIn', status: 'Pending', scheduledDate: '2026-04-01' },
      { id: 'd2', title: 'Team Culture Video', type: 'Video', platform: 'LinkedIn', status: 'Pending', scheduledDate: '2026-04-05' },
      { id: 'd3', title: 'Job Thread', type: 'Post', platform: 'X', status: 'Pending', scheduledDate: '2026-04-07' },
    ],
    milestones: [
      { id: 'p1', date: '2026-03-25', title: 'Content Drafting', status: 'current', description: 'Writing all job posts and culture pieces' },
      { id: 'p2', date: '2026-03-30', title: 'Internal Review', status: 'upcoming', description: 'HR and marketing sign-off' },
      { id: 'p3', date: '2026-04-01', title: 'Launch', status: 'upcoming', description: 'Posts go live on LinkedIn and X' },
      { id: 'p4', date: '2026-04-15', title: 'Boost Phase', status: 'upcoming', description: 'Paid promotion and reshares' },
      { id: 'p5', date: '2026-04-30', title: 'Review', status: 'upcoming', description: 'Analyze applications and engagement' },
    ],
  },
  {
    id: '5',
    title: 'Partnership Announcement',
    status: 'Active',
    startDate: '2026-03-10',
    endDate: '2026-03-25',
    platforms: ['X', 'LinkedIn', 'YouTube'],
    assetCount: 7,
    progress: 45,
    description: 'Coordinated announcement of strategic partnership with co-branded content across channels.',
    assets: [
      { id: 'e1', title: 'Press Release Post', type: 'Article', platform: 'LinkedIn', status: 'Published', scheduledDate: '2026-03-10' },
      { id: 'e2', title: 'Announcement Thread', type: 'Post', platform: 'X', status: 'Published', scheduledDate: '2026-03-10' },
      { id: 'e3', title: 'Joint Webinar Promo', type: 'Image', platform: 'LinkedIn', status: 'Scheduled', scheduledDate: '2026-03-18' },
      { id: 'e4', title: 'Partner Spotlight Video', type: 'Video', platform: 'YouTube', status: 'Pending', scheduledDate: '2026-03-20' },
      { id: 'e5', title: 'Case Study Post', type: 'Post', platform: 'X', status: 'Pending', scheduledDate: '2026-03-22' },
      { id: 'e6', title: 'Webinar Recording', type: 'Video', platform: 'YouTube', status: 'Pending', scheduledDate: '2026-03-24' },
    ],
    milestones: [
      { id: 'q1', date: '2026-03-10', title: 'Announcement Day', status: 'completed', description: 'Press release and social posts published' },
      { id: 'q2', date: '2026-03-14', title: 'Follow-up Content', status: 'completed', description: 'Blog post and FAQ published' },
      { id: 'q3', date: '2026-03-18', title: 'Webinar Promo', status: 'current', description: 'Promoting upcoming joint webinar' },
      { id: 'q4', date: '2026-03-21', title: 'Webinar Live', status: 'upcoming', description: 'Joint webinar session' },
      { id: 'q5', date: '2026-03-25', title: 'Wrap-up', status: 'upcoming', description: 'Share recording and final recap' },
    ],
  },
  {
    id: '6',
    title: 'Podcast Launch',
    status: 'Paused',
    startDate: '2026-03-05',
    endDate: '2026-04-05',
    platforms: ['YouTube', 'X', 'Instagram'],
    assetCount: 4,
    progress: 20,
    description: 'Multi-platform podcast launch with video clips, audiograms, and social teasers.',
    assets: [
      { id: 'f1', title: 'Episode 1 Teaser', type: 'Video', platform: 'YouTube', status: 'Published', scheduledDate: '2026-03-05' },
      { id: 'f2', title: 'Clip for X', type: 'Post', platform: 'X', status: 'Failed', scheduledDate: '2026-03-08' },
      { id: 'f3', title: 'Audiogram Story', type: 'Story', platform: 'Instagram', status: 'Pending', scheduledDate: '2026-03-15' },
      { id: 'f4', title: 'Episode 2 Full', type: 'Video', platform: 'YouTube', status: 'Pending', scheduledDate: '2026-03-20' },
    ],
    milestones: [
      { id: 'r1', date: '2026-03-05', title: 'Soft Launch', status: 'completed', description: 'Episode 1 teaser released' },
      { id: 'r2', date: '2026-03-08', title: 'Social Clips', status: 'completed', description: 'Short clips distributed (1 failed)' },
      { id: 'r3', date: '2026-03-12', title: 'Paused', status: 'current', description: 'Campaign paused pending content review' },
      { id: 'r4', date: '2026-03-20', title: 'Resume & Episode 2', status: 'upcoming', description: 'Continue with revised content plan' },
      { id: 'r5', date: '2026-04-05', title: 'Series Wrap', status: 'upcoming', description: 'Final episode and campaign review' },
    ],
  },
];

const AVAILABLE_ASSETS: Asset[] = [
  { id: 'new1', title: 'Trending Topic Thread', type: 'Post', platform: 'X', status: 'Pending', scheduledDate: '2026-03-25' },
  { id: 'new2', title: 'Product Walkthrough', type: 'Video', platform: 'YouTube', status: 'Pending', scheduledDate: '2026-03-26' },
  { id: 'new3', title: 'Infographic Carousel', type: 'Image', platform: 'Instagram', status: 'Pending', scheduledDate: '2026-03-27' },
  { id: 'new4', title: 'Quick Tip Reel', type: 'Reel', platform: 'TikTok', status: 'Pending', scheduledDate: '2026-03-28' },
  { id: 'new5', title: 'Thought Piece', type: 'Article', platform: 'LinkedIn', status: 'Pending', scheduledDate: '2026-03-30' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusVariant: Record<CampaignStatus, 'primary' | 'success' | 'warning' | 'danger' | 'default' | 'accent' | 'info'> = {
  Draft: 'default',
  Ready: 'accent',
  Active: 'success',
  Completed: 'primary',
  Paused: 'warning',
};

const assetStatusVariant: Record<AssetStatus, 'success' | 'primary' | 'warning' | 'danger' | 'default'> = {
  Published: 'success',
  Scheduled: 'primary',
  Pending: 'warning',
  Failed: 'danger',
};

const assetTypeIcon: Record<AssetType, typeof FileText> = {
  Post: Type,
  Image: Image,
  Video: Video,
  Article: FileText,
  Story: Eye,
  Reel: Video,
};

const platformTone: Record<Platform, 'primary' | 'accent' | 'danger' | 'success' | 'default'> = {
  X: 'default',
  LinkedIn: 'primary',
  Instagram: 'danger',
  TikTok: 'accent',
  YouTube: 'danger',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Component: Filter Bar                                              */
/* ------------------------------------------------------------------ */

const FILTER_OPTIONS: Array<{ label: string; value: CampaignStatus | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Ready', value: 'Ready' },
  { label: 'Active', value: 'Active' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Paused', value: 'Paused' },
];

/* ------------------------------------------------------------------ */
/*  Component: New Campaign Modal                                       */
/* ------------------------------------------------------------------ */

function NewCampaignModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (c: Campaign) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const newCampaign: Campaign = {
      id: `new-${Date.now()}`,
      title: title.trim(),
      status: 'Draft',
      startDate: startDate || '2026-04-01',
      endDate: endDate || '2026-04-30',
      platforms: platforms.length ? platforms : ['X'],
      assetCount: 0,
      progress: 0,
      description: description.trim() || 'New campaign created from Launchpad.',
      assets: [],
      milestones: [
        { id: `m-${Date.now()}`, date: startDate || '2026-04-01', title: 'Campaign Created', status: 'current', description: 'Initial setup and planning' },
        { id: `m-${Date.now() + 1}`, date: endDate || '2026-04-30', title: 'Target Launch', status: 'upcoming', description: 'Planned launch date' },
      ],
    };
    onCreate(newCampaign);
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setPlatforms([]);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text)]">New Campaign</h2>
              <button onClick={onClose} className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Campaign title..."
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Campaign description..."
                  rows={3}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        'rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-medium transition-all',
                        platforms.includes(p)
                          ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreate}
                disabled={!title.trim()}
                className={cn(
                  'w-full mt-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold transition-all',
                  title.trim()
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white hover:opacity-90 shadow-lg shadow-[var(--primary)]/20'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-disabled)] cursor-not-allowed'
                )}
              >
                Create Campaign
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Component: Campaign Card                                            */
/* ------------------------------------------------------------------ */

function CampaignCard({
  campaign,
  selected,
  onClick,
}: {
  campaign: Campaign;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <GlassCard
      variant={selected ? 'glow' : 'default'}
      padding="md"
      className={cn('cursor-pointer', selected && 'ring-1 ring-[var(--primary)]/40')}
    >
      <div onClick={onClick}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-[var(--text)] truncate">{campaign.title}</h3>
          <StatusBadge label={campaign.status} variant={statusVariant[campaign.status]} pulse={campaign.status === 'Active'} />
        </div>

        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{campaign.description}</p>

        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-3">
          <Calendar size={12} />
          <span>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {campaign.platforms.map((p) => (
            <Pill key={p} tone={platformTone[p]}>{p}</Pill>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
          <span>{campaign.assetCount || campaign.assets.length} assets</span>
          <span>{campaign.progress}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-[var(--surface-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500"
            style={{ width: `${campaign.progress}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Component: Timeline                                                 */
/* ------------------------------------------------------------------ */

function Timeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[var(--border)]" />

      <div className="space-y-5">
        {milestones.map((m) => (
          <div key={m.id} className="relative flex gap-3">
            {/* Dot */}
            <div className="absolute -left-6 top-0.5 flex items-center justify-center">
              {m.status === 'completed' ? (
                <CheckCircle2 size={18} className="text-[var(--success)]" />
              ) : m.status === 'current' ? (
                <div className="relative">
                  <Circle size={18} className="text-[var(--primary)]" />
                  <div className="absolute inset-0 rounded-full bg-[var(--primary)] opacity-30 animate-ping" />
                </div>
              ) : (
                <Circle size={18} className="text-[var(--text-disabled)]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-[var(--text)]">{m.title}</span>
                <span className="text-xs text-[var(--text-muted)]">{formatDate(m.date)}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{m.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component: Asset List                                               */
/* ------------------------------------------------------------------ */

function AssetList({
  assets,
  onRemove,
  onAdd,
}: {
  assets: Asset[];
  onRemove: (id: string) => void;
  onAdd: (asset: Asset) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--text-muted)]">{assets.length} assets</span>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors"
          >
            <Plus size={12} />
            Add Asset
            <ChevronDown size={12} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 z-20 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)] shadow-xl p-1">
              {AVAILABLE_ASSETS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { onAdd(a); setShowDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] rounded-[var(--radius-sm)] transition-colors"
                >
                  {a.title} ({a.platform})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {assets.map((asset) => {
          const Icon = assetTypeIcon[asset.type];
          return (
            <div
              key={asset.id}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-elevated)]">
                <Icon size={14} className="text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text)] truncate">{asset.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Pill tone={platformTone[asset.platform]}>{asset.platform}</Pill>
                  <span className="text-xs text-[var(--text-muted)]">{formatDate(asset.scheduledDate)}</span>
                </div>
              </div>
              <StatusBadge label={asset.status} variant={assetStatusVariant[asset.status]} size="sm" />
              <button
                onClick={() => onRemove(asset.id)}
                className="p-1 rounded-[var(--radius-sm)] text-[var(--text-disabled)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {assets.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center py-6">No assets assigned yet.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component: Launch Controls                                          */
/* ------------------------------------------------------------------ */

function LaunchControls({
  onAction,
}: {
  onAction: (action: string) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const handleClick = (action: string) => {
    setLoading(action);
    setConfirmed(null);
    setTimeout(() => {
      setLoading(null);
      setConfirmed(action);
      onAction(action);
      setTimeout(() => setConfirmed(null), 2000);
    }, 1200);
  };

  const actions = [
    { key: 'schedule', label: 'Schedule Posts', icon: Calendar, style: 'default' as const },
    { key: 'preview', label: 'Preview', icon: Eye, style: 'default' as const },
    { key: 'test', label: 'Send Test', icon: Send, style: 'default' as const },
    { key: 'launch', label: 'Launch Now', icon: Rocket, style: 'primary' as const },
    { key: 'archive', label: 'Archive', icon: Archive, style: 'muted' as const },
  ];

  return (
    <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
      {actions.map(({ key, label, icon: Icon, style }) => (
        <button
          key={key}
          onClick={() => handleClick(key)}
          disabled={loading !== null}
          className={cn(
            'inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium transition-all',
            style === 'primary' && 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white hover:opacity-90 shadow-lg shadow-[var(--primary)]/20',
            style === 'default' && 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-elevated)]',
            style === 'muted' && 'border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border)]',
            loading !== null && 'opacity-60 cursor-not-allowed',
          )}
        >
          {loading === key ? (
            <Loader2 size={14} className="animate-spin" />
          ) : confirmed === key ? (
            <CheckCircle2 size={14} className="text-[var(--success)]" />
          ) : (
            <Icon size={14} />
          )}
          {confirmed === key ? 'Done' : label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component: Campaign Detail Panel                                    */
/* ------------------------------------------------------------------ */

type DetailTab = 'overview' | 'timeline' | 'assets';

function CampaignDetailPanel({
  campaign,
  onUpdate,
  onClose,
}: {
  campaign: Campaign;
  onUpdate: (updated: Campaign) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>('overview');

  const metrics = useMemo(() => {
    const a = campaign.assets;
    return {
      total: a.length,
      published: a.filter((x) => x.status === 'Published').length,
      pending: a.filter((x) => x.status === 'Pending' || x.status === 'Scheduled').length,
      failed: a.filter((x) => x.status === 'Failed').length,
    };
  }, [campaign.assets]);

  const handleLaunch = () => {
    onUpdate({ ...campaign, status: 'Active', progress: Math.max(campaign.progress, 10) });
  };

  const handlePauseResume = () => {
    if (campaign.status === 'Active') {
      onUpdate({ ...campaign, status: 'Paused' });
    } else if (campaign.status === 'Paused') {
      onUpdate({ ...campaign, status: 'Active' });
    }
  };

  const handleRemoveAsset = (id: string) => {
    onUpdate({ ...campaign, assets: campaign.assets.filter((a) => a.id !== id) });
  };

  const handleAddAsset = (asset: Asset) => {
    if (campaign.assets.find((a) => a.id === asset.id)) return;
    onUpdate({ ...campaign, assets: [...campaign.assets, asset] });
  };

  const tabs: Array<{ key: DetailTab; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'assets', label: 'Assets' },
  ];

  return (
    <MotionFadeIn>
      <GlassCard variant="elevated" padding="md" hover={false} className="sticky top-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[var(--text)] truncate">{campaign.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge label={campaign.status} variant={statusVariant[campaign.status]} pulse={campaign.status === 'Active'} size="md" />
              <span className="text-xs text-[var(--text-muted)]">{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 rounded-[var(--radius-sm)] bg-[var(--surface)] p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-all',
                tab === t.key
                  ? 'bg-[var(--surface-elevated)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {tab === 'overview' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{campaign.description}</p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total Assets', value: metrics.total, color: 'var(--text)' },
                  { label: 'Published', value: metrics.published, color: 'var(--success)' },
                  { label: 'Pending', value: metrics.pending, color: 'var(--warning)' },
                  { label: 'Failed', value: metrics.failed, color: 'var(--danger)' },
                ].map((m) => (
                  <div key={m.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
                    <p className="text-lg font-semibold" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs text-[var(--text-muted)]">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Platforms */}
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Platforms</p>
                <div className="flex flex-wrap gap-1.5">
                  {campaign.platforms.map((p) => (
                    <Pill key={p} tone={platformTone[p]}>{p}</Pill>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {campaign.status === 'Ready' && (
                  <button
                    onClick={handleLaunch}
                    className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-[var(--primary)]/20"
                  >
                    <Rocket size={14} />
                    Launch Campaign
                  </button>
                )}
                {(campaign.status === 'Active' || campaign.status === 'Paused') && (
                  <button
                    onClick={handlePauseResume}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-2 text-xs font-medium transition-colors',
                      campaign.status === 'Active'
                        ? 'border-[var(--warning)] bg-[var(--warning-muted)] text-[var(--warning)] hover:bg-[var(--warning)]/20'
                        : 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)] hover:bg-[var(--success)]/20'
                    )}
                  >
                    {campaign.status === 'Active' ? <Pause size={14} /> : <Play size={14} />}
                    {campaign.status === 'Active' ? 'Pause' : 'Resume'}
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'timeline' && <Timeline milestones={campaign.milestones} />}

          {tab === 'assets' && (
            <AssetList
              assets={campaign.assets}
              onRemove={handleRemoveAsset}
              onAdd={handleAddAsset}
            />
          )}
        </div>

        {/* Launch Controls */}
        <LaunchControls onAction={() => {}} />
      </GlassCard>
    </MotionFadeIn>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LaunchpadWireframePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [campaigns, statusFilter, search]);

  const selectedCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedId) ?? null;
  }, [campaigns, selectedId]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'Active').length,
    assets: campaigns.reduce((sum, c) => sum + c.assets.length, 0),
    launchRate: campaigns.length
      ? Math.round((campaigns.filter((c) => c.status === 'Active' || c.status === 'Completed').length / campaigns.length) * 100)
      : 0,
  }), [campaigns]);

  const handleCreateCampaign = useCallback((c: Campaign) => {
    setCampaigns((prev) => [...prev, c]);
  }, []);

  const handleUpdateCampaign = useCallback((updated: Campaign) => {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  return (
    <PageWrapper>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Launchpad</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Manage campaigns, schedule content, and launch across platforms.</p>
      </div>

      {/* Stats Row */}
      <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MotionStaggerItem>
          <StatCard label="Total Campaigns" value={stats.total} icon={BarChart3} tone="primary" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Active" value={stats.active} icon={Zap} tone="success" subtitle="Running now" subtitleTone="positive" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Assets Staged" value={stats.assets} icon={Target} tone="accent" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Launch Rate" value={stats.launchRate} icon={Rocket} tone="warning" suffix="%" />
        </MotionStaggerItem>
      </MotionStagger>

      {/* Filter Bar */}
      <MotionFadeIn>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          {/* Status Pills */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-medium transition-all',
                  statusFilter === opt.value
                    ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-56 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]"
              />
            </div>

            {/* New Campaign Button */}
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-[var(--primary)]/20 whitespace-nowrap"
            >
              <Plus size={14} />
              New Campaign
            </button>
          </div>
        </div>
      </MotionFadeIn>

      {/* Main Content: Grid + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Grid */}
        <div className={cn(selectedCampaign ? 'lg:col-span-7' : 'lg:col-span-12')}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="No campaigns found"
              description={search || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Create your first campaign to get started.'}
              action={
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} />
                  New Campaign
                </button>
              }
            />
          ) : (
            <MotionStagger className={cn(
              'grid gap-4',
              selectedCampaign ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            )}>
              {filtered.map((campaign) => (
                <MotionStaggerItem key={campaign.id}>
                  <CampaignCard
                    campaign={campaign}
                    selected={selectedId === campaign.id}
                    onClick={() => setSelectedId(selectedId === campaign.id ? null : campaign.id)}
                  />
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCampaign && (
          <div className="lg:col-span-5">
            <CampaignDetailPanel
              key={selectedCampaign.id}
              campaign={selectedCampaign}
              onUpdate={handleUpdateCampaign}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      <NewCampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateCampaign}
      />
    </PageWrapper>
  );
}
