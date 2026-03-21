'use client';

import { useState } from 'react';
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
  overlayVariants,
  modalVariants,
} from '@/components/nebula';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Briefcase,
  Camera,
  Play,
  Mail,
  BookOpen,
  Zap,
  Link2,
  Unplug,
  CheckCircle2,
  XCircle,
  Send,
  Search,
  RefreshCw,
  TestTube,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────

type ConnectorStatus = 'connected' | 'disconnected' | 'error';

interface Connector {
  id: string;
  name: string;
  icon: LucideIcon;
  status: ConnectorStatus;
  postsPublished: number;
  lastSync: string;
  actionLabel: string; // "Disconnect" | "Connect" | "Configure"
}

interface HistoryEntry {
  id: string;
  platform: string;
  platformTone: 'primary' | 'success' | 'accent' | 'warning' | 'danger' | 'muted' | 'default';
  title: string;
  status: 'success' | 'failed';
  timestamp: string;
  url: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────

const initialConnectors: Connector[] = [
  { id: 'twitter', name: 'X (Twitter)', icon: MessageCircle, status: 'connected', postsPublished: 145, lastSync: '2m ago', actionLabel: 'Disconnect' },
  { id: 'linkedin', name: 'LinkedIn', icon: Briefcase, status: 'connected', postsPublished: 67, lastSync: '5m ago', actionLabel: 'Disconnect' },
  { id: 'instagram', name: 'Instagram', icon: Camera, status: 'connected', postsPublished: 89, lastSync: '10m ago', actionLabel: 'Disconnect' },
  { id: 'youtube', name: 'YouTube', icon: Play, status: 'disconnected', postsPublished: 0, lastSync: '', actionLabel: 'Connect' },
  { id: 'email', name: 'Email (Resend)', icon: Mail, status: 'connected', postsPublished: 34, lastSync: '1h ago', actionLabel: 'Disconnect' },
  { id: 'notion', name: 'Notion', icon: BookOpen, status: 'connected', postsPublished: 23, lastSync: '3h ago', actionLabel: 'Disconnect' },
  { id: 'webhook', name: 'Webhook', icon: Zap, status: 'disconnected', postsPublished: 0, lastSync: '', actionLabel: 'Configure' },
];

const mockContent = [
  { id: '1', title: 'How Agent MOE Automates Your Marketing', type: 'Article' },
  { id: '2', title: '5 AI Trends for 2026', type: 'Thread' },
  { id: '3', title: 'Weekly Newsletter Issue #42', type: 'Email' },
  { id: '4', title: 'Product Launch Announcement', type: 'Post' },
  { id: '5', title: 'Behind the Scenes: Building MOE', type: 'Video' },
];

const historyEntries: HistoryEntry[] = [
  { id: '1', platform: 'X (Twitter)', platformTone: 'primary', title: 'How Agent MOE Automates Your Marketing', status: 'success', timestamp: '2 min ago', url: 'https://x.com/post/123' },
  { id: '2', platform: 'LinkedIn', platformTone: 'accent', title: '5 AI Trends for 2026', status: 'success', timestamp: '5 min ago', url: 'https://linkedin.com/post/456' },
  { id: '3', platform: 'Instagram', platformTone: 'warning', title: 'Product Launch Carousel', status: 'success', timestamp: '12 min ago', url: 'https://instagram.com/p/abc' },
  { id: '4', platform: 'Email (Resend)', platformTone: 'success', title: 'Weekly Newsletter Issue #42', status: 'success', timestamp: '1h ago', url: '#' },
  { id: '5', platform: 'X (Twitter)', platformTone: 'primary', title: 'Thread: Revenue Growth Tips', status: 'failed', timestamp: '2h ago', url: '#' },
  { id: '6', platform: 'Notion', platformTone: 'muted', title: 'Meeting Notes — Q1 Review', status: 'success', timestamp: '3h ago', url: 'https://notion.so/page/xyz' },
  { id: '7', platform: 'LinkedIn', platformTone: 'accent', title: 'Case Study: 3x Pipeline Growth', status: 'success', timestamp: '5h ago', url: 'https://linkedin.com/post/789' },
  { id: '8', platform: 'X (Twitter)', platformTone: 'primary', title: 'Behind the Scenes: Building MOE', status: 'failed', timestamp: '6h ago', url: '#' },
];

// ── Filter helpers ─────────────────────────────────────────────────────

type FilterStatus = 'all' | 'connected' | 'disconnected' | 'error';

const statusBadgeVariant = (s: ConnectorStatus) =>
  s === 'connected' ? 'success' : s === 'error' ? 'danger' : 'default';

// ── Page Component ─────────────────────────────────────────────────────

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  // Modal state
  const [connectModal, setConnectModal] = useState<Connector | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [publishModal, setPublishModal] = useState<Connector | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Derived
  const filtered = connectors.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const connectedCount = connectors.filter((c) => c.status === 'connected').length;
  const disconnectedCount = connectors.filter((c) => c.status === 'disconnected').length;

  // Actions
  function handleConnect(connector: Connector) {
    setConnectModal(connector);
  }

  function doAuthorize() {
    setConnectLoading(true);
    setTimeout(() => {
      setConnectors((prev) =>
        prev.map((c) =>
          c.id === connectModal!.id
            ? { ...c, status: 'connected' as ConnectorStatus, actionLabel: 'Disconnect', lastSync: 'just now' }
            : c,
        ),
      );
      setConnectLoading(false);
      setConnectModal(null);
    }, 1500);
  }

  function handleDisconnect(id: string) {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'disconnected' as ConnectorStatus, actionLabel: 'Connect', lastSync: '' }
          : c,
      ),
    );
  }

  function handlePublish(connector: Connector) {
    setPublishModal(connector);
    setSelectedContent(null);
    setPublishSuccess(false);
  }

  function doPublish() {
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishModal(null);
      setPublishSuccess(false);
    }, 2000);
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Connectors</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Manage platform integrations and publishing channels
        </p>
      </div>

      {/* Stats Row */}
      <MotionStagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionStaggerItem>
          <StatCard label="Connected" value={connectedCount} icon={Link2} tone="success" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Disconnected" value={disconnectedCount} icon={Unplug} tone="danger" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Published Today" value={12} icon={Send} tone="primary" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Total Published" value={234} icon={CheckCircle2} tone="accent" />
        </MotionStaggerItem>
      </MotionStagger>

      {/* Filter Bar */}
      <MotionFadeIn delay={0.1}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'connected', 'disconnected', 'error'] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium capitalize transition-colors',
                  filter === s
                    ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                    : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-disabled)]" />
            <input
              type="text"
              placeholder="Search connectors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] sm:w-64"
            />
          </div>
        </div>
      </MotionFadeIn>

      {/* Connector Grid */}
      <MotionStagger className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((connector) => {
          const Icon = connector.icon;
          const isConnected = connector.status === 'connected';
          return (
            <MotionStaggerItem key={connector.id}>
              <GlassCard padding="md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        isConnected
                          ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                          : 'bg-[var(--surface-elevated)] text-[var(--text-disabled)]',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{connector.name}</p>
                      <StatusBadge
                        label={connector.status}
                        variant={statusBadgeVariant(connector.status)}
                        pulse={isConnected}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {isConnected && (
                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{connector.postsPublished} published</span>
                    <span>Last sync: {connector.lastSync}</span>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleDisconnect(connector.id)}
                        className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--danger)] hover:text-[var(--danger)]"
                      >
                        Disconnect
                      </button>
                      <button className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]">
                        <TestTube className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handlePublish(connector)}
                        className="flex-1 rounded-[var(--radius)] bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                      >
                        Publish
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(connector)}
                      className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      {connector.actionLabel}
                    </button>
                  )}
                </div>
              </GlassCard>
            </MotionStaggerItem>
          );
        })}
      </MotionStagger>

      {/* Publishing History */}
      <MotionFadeIn delay={0.2}>
        <SectionCard title="Recent Publishing Activity" subtitle="Last 24 hours of publishing across all connectors">
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {historyEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Pill tone={entry.platformTone}>{entry.platform}</Pill>
                  <span className="truncate text-sm text-[var(--text)]">{entry.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {entry.status === 'success' ? (
                    <StatusBadge label="Success" variant="success" size="sm" />
                  ) : (
                    <StatusBadge label="Failed" variant="danger" size="sm" />
                  )}
                  <span className="text-xs text-[var(--text-muted)] w-16 text-right">{entry.timestamp}</span>
                  <a href={entry.url} className="text-[var(--text-disabled)] hover:text-[var(--primary)]">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </MotionFadeIn>

      {/* Connect Modal */}
      <AnimatePresence>
        {connectModal && (
          <motion.div
            key="connect-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !connectLoading && setConnectModal(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Connect {connectModal.name}
                </h2>
                <button
                  onClick={() => !connectLoading && setConnectModal(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Authorize Agent MOE to publish content to {connectModal.name}. This will redirect you
                to the platform&apos;s OAuth authorization page.
              </p>
              <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
                <connectModal.icon className="h-8 w-8 text-[var(--primary)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{connectModal.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">Read &amp; Write access</p>
                </div>
              </div>
              <button
                onClick={doAuthorize}
                disabled={connectLoading}
                className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {connectLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  'Authorize'
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish Modal */}
      <AnimatePresence>
        {publishModal && (
          <motion.div
            key="publish-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !publishSuccess && setPublishModal(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-xl"
            >
              {publishSuccess ? (
                <div className="flex flex-col items-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-[var(--success)] mb-3" />
                  <h2 className="text-lg font-semibold text-[var(--text)]">Published!</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Content sent to {publishModal.name}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      Publish to {publishModal.name}
                    </h2>
                    <button
                      onClick={() => setPublishModal(null)}
                      className="text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Select content to publish:
                  </p>
                  <div className="space-y-2 mb-6 max-h-56 overflow-y-auto">
                    {mockContent.map((content) => (
                      <button
                        key={content.id}
                        onClick={() => setSelectedContent(content.id)}
                        className={cn(
                          'w-full rounded-[var(--radius)] border px-4 py-3 text-left transition-colors',
                          selectedContent === content.id
                            ? 'border-[var(--primary)] bg-[var(--primary-muted)]'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]',
                        )}
                      >
                        <p className="text-sm font-medium text-[var(--text)]">{content.title}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{content.type}</p>
                      </button>
                    ))}
                  </div>
                  {selectedContent && (
                    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 mb-4">
                      <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Preview</p>
                      <p className="text-sm text-[var(--text)]">
                        {mockContent.find((c) => c.id === selectedContent)?.title}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={doPublish}
                    disabled={!selectedContent}
                    className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Publish
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
