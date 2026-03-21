'use client';

import { useState, useMemo } from 'react';
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
  overlayVariants,
  modalVariants,
} from '@/components/nebula';
import { cn } from '@/lib/utils';
import {
  Video,
  Clapperboard,
  CheckCircle2,
  Sparkles,
  Search,
  Plus,
  X,
  Clock,
  Layers,
  Lightbulb,
  Image as ImageIcon,
  Type,
  MousePointerClick,
  GripVertical,
  Star,
  RefreshCw,
  ArrowLeft,
  Film,
  ExternalLink,
  MessageCircle,
  Share2,
  UserPlus,
} from 'lucide-react';

// --------------- Types ---------------

type PackageStatus = 'Draft' | 'In Production' | 'Completed' | 'Published';
type Platform = 'TikTok' | 'Instagram Reels' | 'YouTube Shorts';
type Duration = '15s' | '30s' | '45s' | '60s';
type Style = 'Educational' | 'Entertainment' | 'Promotional';
type DetailTab = 'Hook' | 'Scenes' | 'Thumbnail' | 'CTA';

interface Hook {
  text: string;
  style: 'Question' | 'Bold Statement' | 'Statistic';
  charCount: number;
  bestPerforming?: boolean;
}

interface Scene {
  number: number;
  description: string;
  duration: string;
  visualDirection: string;
  textOverlay: string;
}

interface ThumbnailConcept {
  description: string;
  textOverlay: string;
  colors: string[];
  tags: string[];
}

interface CTAVariant {
  text: string;
  placement: 'End Screen' | 'Mid-Roll' | 'Overlay';
  actionType: 'Follow' | 'Visit Link' | 'Comment' | 'Share';
  platformNote: string;
}

interface VideoPackage {
  id: string;
  title: string;
  platform: Platform;
  duration: Duration;
  status: PackageStatus;
  style: Style;
  sceneCount: number;
  hookCount: number;
  timestamp: string;
  gradient: string;
  hooks: Hook[];
  scenes: Scene[];
  thumbnail: ThumbnailConcept;
  ctas: CTAVariant[];
}

// --------------- Mock Data ---------------

const GRADIENTS: string[] = [
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
];

const MOCK_PACKAGES: VideoPackage[] = [
  {
    id: '1',
    title: 'How AI Automates Your Business',
    platform: 'TikTok',
    duration: '30s',
    status: 'Completed',
    style: 'Educational',
    sceneCount: 5,
    hookCount: 3,
    timestamp: '2 hours ago',
    gradient: GRADIENTS[0]!,
    hooks: [
      { text: 'What if your business ran itself while you slept?', style: 'Question', charCount: 51, bestPerforming: true },
      { text: 'AI is replacing 80% of manual business tasks.', style: 'Bold Statement', charCount: 46 },
      { text: '73% of businesses using AI automation see 2x revenue in 6 months.', style: 'Statistic', charCount: 65 },
    ],
    scenes: [
      { number: 1, description: 'Person overwhelmed at desk with papers', duration: '5s', visualDirection: 'Wide shot, warm lighting, slight chaos', textOverlay: 'You right now...' },
      { number: 2, description: 'AI dashboard lighting up with automation flows', duration: '7s', visualDirection: 'Screen recording style, smooth zoom', textOverlay: 'Meet Agent MOE' },
      { number: 3, description: 'Split screen: manual vs automated workflow', duration: '6s', visualDirection: 'Side by side comparison, clean lines', textOverlay: 'Manual vs AI' },
      { number: 4, description: 'Revenue chart going up while person relaxes', duration: '7s', visualDirection: 'Upward camera movement, green tones', textOverlay: 'Revenue on autopilot' },
      { number: 5, description: 'CTA screen with product showcase', duration: '5s', visualDirection: 'Center frame, bold typography', textOverlay: 'Start free today' },
    ],
    thumbnail: {
      description: 'Split face: stressed human left, calm AI interface right, with glowing divider',
      textOverlay: 'AI vs YOU',
      colors: ['#8b5cf6', '#ec4899', '#1e1b4b', '#fbbf24'],
      tags: ['Contrast', 'Bold Text', 'Face Close-up', 'Neon Glow'],
    },
    ctas: [
      { text: 'Follow for more AI business tips', placement: 'End Screen', actionType: 'Follow', platformNote: 'TikTok: appears as follow button overlay' },
      { text: 'Link in bio for free trial', placement: 'Mid-Roll', actionType: 'Visit Link', platformNote: 'TikTok: text overlay with arrow pointing down' },
      { text: 'Drop a fire emoji if this blew your mind', placement: 'Overlay', actionType: 'Comment', platformNote: 'TikTok: pinned comment + caption CTA' },
    ],
  },
  {
    id: '2',
    title: '5 Revenue Hacks Nobody Talks About',
    platform: 'Instagram Reels',
    duration: '45s',
    status: 'In Production',
    style: 'Educational',
    sceneCount: 6,
    hookCount: 3,
    timestamp: '5 hours ago',
    gradient: GRADIENTS[1]!,
    hooks: [
      { text: 'Stop leaving money on the table. Here are 5 hacks.', style: 'Bold Statement', charCount: 52, bestPerforming: true },
      { text: 'Are you making these 5 revenue mistakes?', style: 'Question', charCount: 41 },
      { text: 'Businesses using these 5 tactics earn 3x more per lead.', style: 'Statistic', charCount: 55 },
    ],
    scenes: [
      { number: 1, description: 'Hook text on dark moody background', duration: '4s', visualDirection: 'Cinematic letterbox, bold serif', textOverlay: 'Revenue hack #1' },
      { number: 2, description: 'Pricing page optimization example', duration: '8s', visualDirection: 'Screen mockup, highlight changes', textOverlay: 'Fix your pricing page' },
      { number: 3, description: 'Email sequence funnel diagram', duration: '8s', visualDirection: 'Animated flow chart, step by step', textOverlay: 'Automated follow-ups' },
      { number: 4, description: 'Social proof wall of testimonials', duration: '7s', visualDirection: 'Grid layout, zoom into highlights', textOverlay: 'Social proof sells' },
      { number: 5, description: 'Upsell flow visualization', duration: '8s', visualDirection: 'Ascending staircase metaphor', textOverlay: 'Strategic upsells' },
      { number: 6, description: 'Results dashboard with metrics', duration: '10s', visualDirection: 'Smooth reveal, celebration confetti', textOverlay: 'Your results await' },
    ],
    thumbnail: {
      description: 'Hand reaching for gold coins with "5" in large 3D text, dark luxury background',
      textOverlay: '5 HACKS',
      colors: ['#fbbf24', '#1e1b4b', '#f59e0b', '#ffffff'],
      tags: ['Luxury', 'Numbers', 'Gold Tones', 'Minimalist'],
    },
    ctas: [
      { text: 'Save this for later', placement: 'End Screen', actionType: 'Share', platformNote: 'IG Reels: bookmark prompt in caption' },
      { text: 'Get the full playbook - link in bio', placement: 'End Screen', actionType: 'Visit Link', platformNote: 'IG Reels: swipe up or link in bio mention' },
      { text: 'Which hack was new to you? Comment below', placement: 'Overlay', actionType: 'Comment', platformNote: 'IG Reels: question sticker + caption CTA' },
    ],
  },
  {
    id: '3',
    title: 'Day in the Life of an AI Operator',
    platform: 'YouTube Shorts',
    duration: '60s',
    status: 'Draft',
    style: 'Entertainment',
    sceneCount: 4,
    hookCount: 3,
    timestamp: '1 day ago',
    gradient: GRADIENTS[2]!,
    hooks: [
      { text: 'POV: Your AI operator just made you $500 while you ate breakfast.', style: 'Bold Statement', charCount: 65 },
      { text: 'What does an AI operator actually DO all day?', style: 'Question', charCount: 46, bestPerforming: true },
      { text: 'This AI completed 47 tasks before 9 AM.', style: 'Statistic', charCount: 41 },
    ],
    scenes: [
      { number: 1, description: 'Morning alarm, phone notification flood', duration: '10s', visualDirection: 'POV camera, warm morning light', textOverlay: '6:00 AM' },
      { number: 2, description: 'AI dashboard showing overnight activity', duration: '20s', visualDirection: 'Screen recording walkthrough', textOverlay: 'While you slept...' },
      { number: 3, description: 'Person casually checking results at coffee shop', duration: '15s', visualDirection: 'Lifestyle b-roll, relaxed vibe', textOverlay: 'This is the future' },
      { number: 4, description: 'Results summary with earnings highlight', duration: '15s', visualDirection: 'Clean data visualization, upbeat', textOverlay: 'Your daily report' },
    ],
    thumbnail: {
      description: 'Person in pajamas checking phone with green profit numbers floating around',
      textOverlay: 'AI DID THIS',
      colors: ['#f59e0b', '#ef4444', '#0f172a', '#22c55e'],
      tags: ['Lifestyle', 'POV', 'Casual', 'Green Numbers'],
    },
    ctas: [
      { text: 'Subscribe for daily AI tips', placement: 'End Screen', actionType: 'Follow', platformNote: 'YT Shorts: subscribe button end card' },
      { text: 'Try it free - link in description', placement: 'End Screen', actionType: 'Visit Link', platformNote: 'YT Shorts: pinned comment with link' },
      { text: 'Share this with someone who needs more sleep', placement: 'Overlay', actionType: 'Share', platformNote: 'YT Shorts: share button prompt' },
    ],
  },
  {
    id: '4',
    title: 'Agent MOE Product Launch Teaser',
    platform: 'TikTok',
    duration: '15s',
    status: 'Published',
    style: 'Promotional',
    sceneCount: 4,
    hookCount: 3,
    timestamp: '3 days ago',
    gradient: GRADIENTS[3]!,
    hooks: [
      { text: 'Something big is coming...', style: 'Bold Statement', charCount: 26, bestPerforming: true },
      { text: 'What if I told you AI could run your entire business?', style: 'Question', charCount: 53 },
      { text: 'Beta users are seeing 340% ROI in week one.', style: 'Statistic', charCount: 45 },
    ],
    scenes: [
      { number: 1, description: 'Dark screen with pulsing glow', duration: '3s', visualDirection: 'Minimal, mysterious, bass drop sync', textOverlay: 'Coming soon...' },
      { number: 2, description: 'Quick cuts of AI features', duration: '5s', visualDirection: 'Fast montage, neon accents', textOverlay: '' },
      { number: 3, description: 'Logo reveal with particle effect', duration: '4s', visualDirection: 'Center frame explosion, brand colors', textOverlay: 'Agent MOE' },
      { number: 4, description: 'Launch date announcement', duration: '3s', visualDirection: 'Clean, bold date typography', textOverlay: 'March 2026' },
    ],
    thumbnail: {
      description: 'Glowing MOE logo on dark background with light rays emanating outward',
      textOverlay: 'LAUNCHING SOON',
      colors: ['#10b981', '#06b6d4', '#0f172a', '#ffffff'],
      tags: ['Teaser', 'Minimal', 'Glow Effect', 'Brand Colors'],
    },
    ctas: [
      { text: 'Follow to get notified on launch day', placement: 'End Screen', actionType: 'Follow', platformNote: 'TikTok: follow button with countdown' },
      { text: 'Join the waitlist - link in bio', placement: 'Overlay', actionType: 'Visit Link', platformNote: 'TikTok: bio link mention in caption' },
      { text: 'Tag someone who needs this', placement: 'Overlay', actionType: 'Share', platformNote: 'TikTok: caption CTA for tagging' },
    ],
  },
  {
    id: '5',
    title: 'Content Calendar Automation Tutorial',
    platform: 'Instagram Reels',
    duration: '45s',
    status: 'In Production',
    style: 'Educational',
    sceneCount: 5,
    hookCount: 3,
    timestamp: '4 days ago',
    gradient: GRADIENTS[4]!,
    hooks: [
      { text: 'I never plan content manually anymore. Here\'s why.', style: 'Bold Statement', charCount: 51 },
      { text: 'Still spending hours on your content calendar?', style: 'Question', charCount: 47, bestPerforming: true },
      { text: 'AI-planned content gets 2.5x more engagement.', style: 'Statistic', charCount: 47 },
    ],
    scenes: [
      { number: 1, description: 'Overwhelmed creator staring at blank calendar', duration: '6s', visualDirection: 'Overhead shot, messy desk aesthetic', textOverlay: 'Content planning sucks' },
      { number: 2, description: 'AI filling in calendar automatically', duration: '10s', visualDirection: 'Time-lapse screen recording, satisfying', textOverlay: 'Unless AI does it' },
      { number: 3, description: 'Generated posts appearing in preview', duration: '10s', visualDirection: 'Carousel scroll, clean UI focus', textOverlay: '30 days in 30 seconds' },
      { number: 4, description: 'Analytics showing improved engagement', duration: '10s', visualDirection: 'Charts animating upward, green highlights', textOverlay: 'The results speak' },
      { number: 5, description: 'Creator relaxing while content publishes', duration: '9s', visualDirection: 'Split screen: AI working / human relaxing', textOverlay: 'Automate everything' },
    ],
    thumbnail: {
      description: 'Calendar grid with AI robot arm filling in content slots, purple neon border',
      textOverlay: 'AUTO CONTENT',
      colors: ['#f43f5e', '#8b5cf6', '#0f172a', '#e2e8f0'],
      tags: ['Tutorial', 'Before/After', 'Clean UI', 'Neon Border'],
    },
    ctas: [
      { text: 'Save this tutorial for later', placement: 'End Screen', actionType: 'Share', platformNote: 'IG Reels: save/bookmark prompt' },
      { text: 'Free template - link in bio', placement: 'Mid-Roll', actionType: 'Visit Link', platformNote: 'IG Reels: text overlay with bio arrow' },
      { text: 'Follow for more AI creator tips', placement: 'End Screen', actionType: 'Follow', platformNote: 'IG Reels: follow button end screen' },
    ],
  },
  {
    id: '6',
    title: 'Why Your Competitors Are Using AI',
    platform: 'YouTube Shorts',
    duration: '30s',
    status: 'In Production',
    style: 'Educational',
    sceneCount: 4,
    hookCount: 3,
    timestamp: '5 days ago',
    gradient: GRADIENTS[5]!,
    hooks: [
      { text: 'Your competitors are using AI and you\'re not. Here\'s what that means.', style: 'Bold Statement', charCount: 70 },
      { text: 'Why is everyone suddenly talking about AI operators?', style: 'Question', charCount: 52, bestPerforming: true },
      { text: '91% of top-performing businesses now use AI automation.', style: 'Statistic', charCount: 55 },
    ],
    scenes: [
      { number: 1, description: 'Competitor success montage', duration: '6s', visualDirection: 'Quick cuts of thriving businesses', textOverlay: 'They know something' },
      { number: 2, description: 'Behind the scenes: AI doing the work', duration: '8s', visualDirection: 'Matrix-style reveal, green on black', textOverlay: 'The secret? AI.' },
      { number: 3, description: 'Side-by-side growth comparison', duration: '8s', visualDirection: 'Split screen chart race', textOverlay: 'AI vs No AI' },
      { number: 4, description: 'Call to action with urgency', duration: '8s', visualDirection: 'Bold red accents, countdown feel', textOverlay: 'Don\'t get left behind' },
    ],
    thumbnail: {
      description: 'Chess pieces - AI king standing, human king fallen, dramatic lighting',
      textOverlay: 'GAME OVER?',
      colors: ['#3b82f6', '#8b5cf6', '#0f172a', '#ef4444'],
      tags: ['Competition', 'Drama', 'Chess Metaphor', 'Bold Question'],
    },
    ctas: [
      { text: 'Subscribe before your competitors do', placement: 'End Screen', actionType: 'Follow', platformNote: 'YT Shorts: subscribe button with urgency' },
      { text: 'Full breakdown - link in description', placement: 'End Screen', actionType: 'Visit Link', platformNote: 'YT Shorts: pinned comment link' },
      { text: 'Comment what industry you\'re in', placement: 'Overlay', actionType: 'Comment', platformNote: 'YT Shorts: engagement prompt in caption' },
    ],
  },
];

// --------------- Status Helpers ---------------

const statusVariant: Record<PackageStatus, 'default' | 'warning' | 'primary' | 'success' | 'accent'> = {
  Draft: 'default',
  'In Production': 'warning',
  Completed: 'success',
  Published: 'primary',
};

const platformTone: Record<Platform, 'danger' | 'accent' | 'primary'> = {
  TikTok: 'danger',
  'Instagram Reels': 'accent',
  'YouTube Shorts': 'primary',
};

const ctaIcon: Record<string, React.ElementType> = {
  Follow: UserPlus,
  'Visit Link': ExternalLink,
  Comment: MessageCircle,
  Share: Share2,
};

// --------------- Component ---------------

export default function VideoStudioWireframe() {
  // State
  const [statusFilter, setStatusFilter] = useState<'All' | PackageStatus>('All');
  const [platformFilter, setPlatformFilter] = useState<'All' | Platform>('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('Hook');
  const [packages, setPackages] = useState<VideoPackage[]>(MOCK_PACKAGES);

  // Form state
  const [formTopic, setFormTopic] = useState('');
  const [formPlatform, setFormPlatform] = useState<Platform>('TikTok');
  const [formDuration, setFormDuration] = useState<Duration>('30s');
  const [formStyle, setFormStyle] = useState<Style>('Educational');

  // Derived
  const filtered = useMemo(() => {
    return packages.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (platformFilter !== 'All' && p.platform !== platformFilter) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [packages, statusFilter, platformFilter, search]);

  const selected = selectedId ? packages.find((p) => p.id === selectedId) ?? null : null;

  const stats = useMemo(() => {
    const total = packages.length;
    const inProd = packages.filter((p) => p.status === 'In Production').length;
    const completed = packages.filter((p) => p.status === 'Completed' || p.status === 'Published').length;
    const hooks = packages.reduce((s, p) => s + p.hookCount, 0);
    return { total, inProd, completed, hooks };
  }, [packages]);

  // Handlers
  function handleGenerate() {
    if (!formTopic.trim()) return;
    const newPkg: VideoPackage = {
      id: Date.now().toString(),
      title: formTopic.trim(),
      platform: formPlatform,
      duration: formDuration,
      status: 'Draft',
      style: formStyle,
      sceneCount: 4,
      hookCount: 3,
      timestamp: 'Just now',
      gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]!,
      hooks: [
        { text: 'Generated hook for: ' + formTopic.trim(), style: 'Question', charCount: formTopic.trim().length + 20 },
        { text: 'Bold take on ' + formTopic.trim(), style: 'Bold Statement', charCount: formTopic.trim().length + 14 },
        { text: '95% of people don\'t know this about ' + formTopic.trim(), style: 'Statistic', charCount: formTopic.trim().length + 36, bestPerforming: true },
      ],
      scenes: [
        { number: 1, description: 'Opening hook scene', duration: '5s', visualDirection: 'Dynamic intro, bold text', textOverlay: 'Wait for it...' },
        { number: 2, description: 'Main content delivery', duration: '10s', visualDirection: 'Clean, focused, well-lit', textOverlay: 'Here\'s the truth' },
        { number: 3, description: 'Supporting evidence', duration: '8s', visualDirection: 'Data visualization, smooth transitions', textOverlay: 'The proof' },
        { number: 4, description: 'Conclusion and CTA', duration: '7s', visualDirection: 'Center frame, brand colors', textOverlay: 'Take action now' },
      ],
      thumbnail: {
        description: 'AI-generated concept for ' + formTopic.trim(),
        textOverlay: formTopic.trim().split(' ').slice(0, 3).join(' ').toUpperCase(),
        colors: ['#8b5cf6', '#f59e0b', '#0f172a', '#ffffff'],
        tags: ['AI Generated', formStyle, formPlatform],
      },
      ctas: [
        { text: 'Follow for more', placement: 'End Screen', actionType: 'Follow', platformNote: formPlatform + ': standard follow CTA' },
        { text: 'Learn more - link in bio', placement: 'Overlay', actionType: 'Visit Link', platformNote: formPlatform + ': bio link prompt' },
        { text: 'What do you think? Comment below', placement: 'Overlay', actionType: 'Comment', platformNote: formPlatform + ': engagement prompt' },
      ],
    };
    setPackages((prev) => [newPkg, ...prev]);
    setFormTopic('');
    setFormPlatform('TikTok');
    setFormDuration('30s');
    setFormStyle('Educational');
    setShowModal(false);
  }

  // --------------- Render: Detail View ---------------

  if (selected) {
    return (
      <PageWrapper>
        <MotionFadeIn>
          {/* Back button */}
          <button
            onClick={() => { setSelectedId(null); setDetailTab('Hook'); }}
            className="mb-4 flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to packages
          </button>

          {/* Header */}
          <GlassCard padding="md" className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-24 shrink-0 rounded-[var(--radius-sm)]"
                  style={{ background: selected.gradient }}
                />
                <div>
                  <h1 className="text-lg font-semibold text-[var(--text)]">{selected.title}</h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Pill tone={platformTone[selected.platform]}>{selected.platform}</Pill>
                    <Pill tone="muted">{selected.duration}</Pill>
                    <Pill tone="muted">{selected.style}</Pill>
                    <StatusBadge label={selected.status} variant={statusVariant[selected.status]} pulse={selected.status === 'In Production'} />
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{selected.timestamp}</span>
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)] p-1 w-fit">
            {(['Hook', 'Scenes', 'Thumbnail', 'CTA'] as DetailTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={cn(
                  'rounded-[var(--radius-sm)] px-4 py-1.5 text-sm font-medium transition-all',
                  detailTab === tab
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {detailTab === 'Hook' && (
              <motion.div key="hook" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <SectionCard title="Hook Variants" subtitle={`${selected.hooks.length} variants generated`}>
                  <MotionStagger className="grid gap-4 md:grid-cols-3">
                    {selected.hooks.map((hook, i) => (
                      <MotionStaggerItem key={i}>
                        <GlassCard padding="md" variant={hook.bestPerforming ? 'glow' : 'default'}>
                          {hook.bestPerforming && (
                            <div className="mb-3 flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-[var(--accent)]" fill="var(--accent)" />
                              <span className="text-xs font-semibold text-[var(--accent)]">Best Performing</span>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed text-[var(--text)]">&ldquo;{hook.text}&rdquo;</p>
                          <div className="mt-3 flex items-center justify-between">
                            <Pill tone={hook.style === 'Question' ? 'primary' : hook.style === 'Bold Statement' ? 'accent' : 'success'}>
                              {hook.style}
                            </Pill>
                            <span className="text-xs text-[var(--text-muted)]">{hook.charCount} chars</span>
                          </div>
                        </GlassCard>
                      </MotionStaggerItem>
                    ))}
                  </MotionStagger>
                </SectionCard>
              </motion.div>
            )}

            {detailTab === 'Scenes' && (
              <motion.div key="scenes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <SectionCard title="Scene Breakdown" subtitle={`${selected.scenes.length} scenes, ${selected.duration} total`}>
                  <MotionStagger className="space-y-3">
                    {selected.scenes.map((scene) => (
                      <MotionStaggerItem key={scene.number}>
                        <GlassCard padding="md">
                          <div className="flex gap-4">
                            {/* Grip handle */}
                            <div className="flex flex-col items-center gap-2 pt-1">
                              <GripVertical className="h-4 w-4 text-[var(--text-disabled)] cursor-grab" />
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-muted)] text-sm font-bold text-[var(--primary)]">
                                {scene.number}
                              </div>
                            </div>

                            {/* Image placeholder */}
                            <div
                              className="hidden sm:flex h-20 w-32 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--border)]"
                              style={{ background: 'var(--surface-elevated)' }}
                            >
                              <ImageIcon className="h-6 w-6 text-[var(--text-disabled)]" />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text)]">{scene.description}</p>
                              <p className="mt-1 text-xs text-[var(--text-muted)]">{scene.visualDirection}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Pill tone="muted">
                                  <Clock className="h-3 w-3" />
                                  {scene.duration}
                                </Pill>
                                {scene.textOverlay && (
                                  <Pill tone="primary">
                                    <Type className="h-3 w-3" />
                                    {scene.textOverlay}
                                  </Pill>
                                )}
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      </MotionStaggerItem>
                    ))}
                  </MotionStagger>
                </SectionCard>
              </motion.div>
            )}

            {detailTab === 'Thumbnail' && (
              <motion.div key="thumbnail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <SectionCard
                  title="Thumbnail Concept"
                  subtitle="AI-generated thumbnail direction"
                  action={
                    <button className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </button>
                  }
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Preview */}
                    <div
                      className="flex aspect-video items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)]"
                      style={{ background: selected.gradient }}
                    >
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-10 w-10 text-white/60" />
                        <p className="mt-2 text-lg font-bold text-white">{selected.thumbnail.textOverlay}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Concept</h4>
                        <p className="text-sm text-[var(--text)]">{selected.thumbnail.description}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Text Overlay</h4>
                        <p className="text-sm font-semibold text-[var(--text)]">{selected.thumbnail.textOverlay}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Color Palette</h4>
                        <div className="flex gap-2">
                          {selected.thumbnail.colors.map((color) => (
                            <div key={color} className="flex flex-col items-center gap-1">
                              <div
                                className="h-10 w-10 rounded-[var(--radius-sm)] border border-[var(--border)]"
                                style={{ background: color }}
                              />
                              <span className="text-[10px] font-mono text-[var(--text-muted)]">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Mood / Style</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.thumbnail.tags.map((tag) => (
                            <Pill key={tag} tone="muted">{tag}</Pill>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {detailTab === 'CTA' && (
              <motion.div key="cta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <SectionCard title="Call-to-Action Variants" subtitle="Platform-optimized CTAs">
                  <MotionStagger className="grid gap-4 md:grid-cols-3">
                    {selected.ctas.map((cta, i) => {
                      const CtaIcon = ctaIcon[cta.actionType] ?? MousePointerClick;
                      return (
                        <MotionStaggerItem key={i}>
                          <GlassCard padding="md">
                            <div className="mb-3 flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-muted)]">
                                <CtaIcon className="h-4 w-4 text-[var(--primary)]" />
                              </div>
                              <Pill tone={
                                cta.actionType === 'Follow' ? 'primary' :
                                cta.actionType === 'Visit Link' ? 'success' :
                                cta.actionType === 'Comment' ? 'accent' : 'warning'
                              }>
                                {cta.actionType}
                              </Pill>
                            </div>
                            <p className="text-sm font-medium text-[var(--text)]">&ldquo;{cta.text}&rdquo;</p>
                            <div className="mt-3 flex items-center gap-2">
                              <Pill tone="muted">{cta.placement}</Pill>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-muted)]">{cta.platformNote}</p>
                          </GlassCard>
                        </MotionStaggerItem>
                      );
                    })}
                  </MotionStagger>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </MotionFadeIn>
      </PageWrapper>
    );
  }

  // --------------- Render: Main View ---------------

  return (
    <PageWrapper>
      {/* Page Title */}
      <MotionFadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Video Studio</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Generate, edit, and publish short-form video packages</p>
        </div>
      </MotionFadeIn>

      {/* Stats Row */}
      <MotionStagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionStaggerItem>
          <StatCard label="Video Packages" value={stats.total} icon={Video} tone="primary" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="In Production" value={stats.inProd} icon={Clapperboard} tone="warning" subtitle="Active renders" subtitleTone="neutral" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="success" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Hooks Generated" value={stats.hooks} icon={Sparkles} tone="accent" />
        </MotionStaggerItem>
      </MotionStagger>

      {/* Filter Bar */}
      <MotionFadeIn delay={0.1}>
        <GlassCard padding="md" hover={false} className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Status pills */}
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Draft', 'In Production', 'Completed', 'Published'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-all',
                      statusFilter === s
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Platform select */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as typeof platformFilter)}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--primary)]"
              >
                <option value="All">All Platforms</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-disabled)]" />
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] py-1.5 pl-8 pr-3 text-xs text-[var(--text)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--primary)] sm:w-52"
                />
              </div>
            </div>

            {/* Right: generate button */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--primary)] to-[#a78bfa] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:shadow-xl hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Generate Video Package
            </button>
          </div>
        </GlassCard>
      </MotionFadeIn>

      {/* Package Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No packages found"
          description="Adjust your filters or generate a new video package."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
            >
              Generate Package
            </button>
          }
        />
      ) : (
        <MotionStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pkg) => (
            <MotionStaggerItem key={pkg.id}>
              <GlassCard
                padding="none"
                className="cursor-pointer overflow-hidden"
                as="button"
              >
                <div onClick={() => { setSelectedId(pkg.id); setDetailTab('Hook'); }} className="text-left w-full">
                  {/* Thumbnail gradient */}
                  <div
                    className="flex h-36 items-center justify-center"
                    style={{ background: pkg.gradient }}
                  >
                    <Video className="h-10 w-10 text-white/40" />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-1">{pkg.title}</h3>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Pill tone={platformTone[pkg.platform]}>{pkg.platform}</Pill>
                      <Pill tone="muted">{pkg.duration}</Pill>
                      <StatusBadge
                        label={pkg.status}
                        variant={statusVariant[pkg.status]}
                        pulse={pkg.status === 'In Production'}
                        size="sm"
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {pkg.sceneCount} scenes
                      </span>
                      <span className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        {pkg.hookCount} hooks
                      </span>
                      <span className="ml-auto">{pkg.timestamp}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      )}

      {/* Generate Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              variants={overlayVariants}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <motion.div
              variants={modalVariants}
              className="relative w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text)]">Generate Video Package</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Topic */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Topic</label>
                  <textarea
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    rows={3}
                    placeholder="Describe your video topic..."
                    className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--primary)] resize-none"
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Platform</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as Platform)}
                    className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                  </select>
                </div>

                {/* Duration + Style */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Duration</label>
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value as Duration)}
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    >
                      <option value="15s">15 seconds</option>
                      <option value="30s">30 seconds</option>
                      <option value="45s">45 seconds</option>
                      <option value="60s">60 seconds</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Style</label>
                    <select
                      value={formStyle}
                      onChange={(e) => setFormStyle(e.target.value as Style)}
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    >
                      <option value="Educational">Educational</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Promotional">Promotional</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!formTopic.trim()}
                  className={cn(
                    'rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--primary)] to-[#a78bfa] px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all',
                    formTopic.trim()
                      ? 'hover:shadow-xl hover:brightness-110'
                      : 'opacity-50 cursor-not-allowed',
                  )}
                >
                  Generate Package
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
