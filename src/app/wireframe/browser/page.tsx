'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  GlassCard,
  StatCard,
  SectionCard,
  StatusBadge,
  Pill,
  PageWrapper,
  EmptyState,
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
  Globe,
  Play,
  CheckCircle2,
  TrendingUp,
  Search,
  Plus,
  Monitor,
  Camera,
  MousePointerClick,
  FormInput,
  Navigation,
  Database,
  Send,
  Eye,
  Loader2,
  XCircle,
  Clock,
  RotateCcw,
  Trash2,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

// ---------- Types ----------

type TaskType =
  | 'scrape'
  | 'screenshot'
  | 'click'
  | 'fill_form'
  | 'navigate'
  | 'extract_data'
  | 'submit_form'
  | 'monitor';

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface LogEntry {
  time: string;
  message: string;
  status: 'success' | 'progress' | 'error';
}

interface BrowserTask {
  id: string;
  title: string;
  url: string;
  type: TaskType;
  status: TaskStatus;
  instructions: string;
  timeout: number;
  createdAt: string;
  duration?: string;
  logs: LogEntry[];
  result?: string;
}

// ---------- Constants ----------

const TASK_TYPE_META: Record<TaskType, { label: string; icon: React.ElementType; tone: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'default' | 'muted' }> = {
  scrape: { label: 'Scrape', icon: Database, tone: 'primary' },
  screenshot: { label: 'Screenshot', icon: Camera, tone: 'accent' },
  click: { label: 'Click', icon: MousePointerClick, tone: 'success' },
  fill_form: { label: 'Fill Form', icon: FormInput, tone: 'warning' },
  navigate: { label: 'Navigate', icon: Navigation, tone: 'primary' },
  extract_data: { label: 'Extract Data', icon: Database, tone: 'accent' },
  submit_form: { label: 'Submit', icon: Send, tone: 'success' },
  monitor: { label: 'Monitor', icon: Eye, tone: 'warning' },
};

const STATUS_META: Record<TaskStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'info'; pulse?: boolean }> = {
  pending: { label: 'Pending', variant: 'default' },
  running: { label: 'Running', variant: 'primary', pulse: true },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'warning' },
};

const ALL_STATUSES: TaskStatus[] = ['pending', 'running', 'completed', 'failed', 'cancelled'];
const ALL_TYPES: TaskType[] = ['scrape', 'screenshot', 'click', 'fill_form', 'navigate', 'extract_data', 'submit_form', 'monitor'];

// ---------- Mock Data ----------

const MOCK_TASKS: BrowserTask[] = [
  {
    id: '1',
    title: 'Scrape competitor pricing',
    url: 'https://competitor.com/pricing',
    type: 'scrape',
    status: 'completed',
    instructions: 'Extract all pricing tier information including features and prices.',
    timeout: 60,
    createdAt: '2 min ago',
    duration: '12.4s',
    logs: [
      { time: '14:32:01', message: 'Navigating to URL...', status: 'success' },
      { time: '14:32:03', message: 'Page loaded (2.1s)', status: 'success' },
      { time: '14:32:04', message: 'Extracting pricing data...', status: 'success' },
      { time: '14:32:08', message: 'Found 3 pricing tiers', status: 'success' },
      { time: '14:32:11', message: 'Parsing features list...', status: 'success' },
      { time: '14:32:13', message: 'Task complete - 3 tiers extracted', status: 'success' },
    ],
    result: JSON.stringify({ tiers: [{ name: 'Starter', price: '$29/mo', features: ['5 users', '10GB storage'] }, { name: 'Pro', price: '$79/mo', features: ['25 users', '100GB storage', 'API access'] }, { name: 'Enterprise', price: '$199/mo', features: ['Unlimited users', '1TB storage', 'API access', 'SSO'] }] }, null, 2),
  },
  {
    id: '2',
    title: 'Monitor landing page uptime',
    url: 'https://app.agentmoe.com',
    type: 'monitor',
    status: 'running',
    instructions: 'Check if the landing page returns 200 status and loads within 3 seconds.',
    timeout: 300,
    createdAt: '5 min ago',
    logs: [
      { time: '14:30:00', message: 'Navigating to URL...', status: 'success' },
      { time: '14:30:02', message: 'Page loaded (1.8s)', status: 'success' },
      { time: '14:30:03', message: 'Running health checks...', status: 'progress' },
      { time: '14:30:04', message: 'Step 3/5: Checking response codes...', status: 'progress' },
    ],
  },
  {
    id: '3',
    title: 'Screenshot homepage redesign',
    url: 'https://staging.agentmoe.com',
    type: 'screenshot',
    status: 'completed',
    instructions: 'Take a full-page screenshot of the new homepage design.',
    timeout: 30,
    createdAt: '15 min ago',
    duration: '4.2s',
    logs: [
      { time: '14:17:01', message: 'Navigating to URL...', status: 'success' },
      { time: '14:17:03', message: 'Page loaded (1.5s)', status: 'success' },
      { time: '14:17:04', message: 'Waiting for animations...', status: 'success' },
      { time: '14:17:05', message: 'Capturing screenshot...', status: 'success' },
      { time: '14:17:05', message: 'Screenshot saved (1920x4200)', status: 'success' },
      { time: '14:17:05', message: 'Task complete', status: 'success' },
    ],
  },
  {
    id: '4',
    title: 'Extract blog article data',
    url: 'https://blog.example.com/articles',
    type: 'extract_data',
    status: 'completed',
    instructions: 'Extract titles, dates, and author names from the latest 10 blog posts.',
    timeout: 90,
    createdAt: '30 min ago',
    duration: '18.7s',
    logs: [
      { time: '14:02:01', message: 'Navigating to URL...', status: 'success' },
      { time: '14:02:04', message: 'Page loaded (2.8s)', status: 'success' },
      { time: '14:02:05', message: 'Scanning article elements...', status: 'success' },
      { time: '14:02:10', message: 'Found 23 elements', status: 'success' },
      { time: '14:02:15', message: 'Extracting structured data...', status: 'success' },
      { time: '14:02:19', message: 'Task complete - 10 articles extracted', status: 'success' },
    ],
    result: JSON.stringify([{ title: 'AI in 2026: Trends', date: '2026-03-15', author: 'Jane Doe' }, { title: 'Building with Agents', date: '2026-03-12', author: 'Sam Lee' }, { title: 'Browser Automation Deep Dive', date: '2026-03-10', author: 'Alex Kim' }], null, 2),
  },
  {
    id: '5',
    title: 'Fill contact form',
    url: 'https://partner.io/contact',
    type: 'fill_form',
    status: 'failed',
    instructions: 'Fill the contact form with partnership inquiry details.',
    timeout: 45,
    createdAt: '1 hr ago',
    duration: '8.1s',
    logs: [
      { time: '13:32:01', message: 'Navigating to URL...', status: 'success' },
      { time: '13:32:03', message: 'Page loaded (1.9s)', status: 'success' },
      { time: '13:32:04', message: 'Locating form fields...', status: 'success' },
      { time: '13:32:05', message: 'Filling name field...', status: 'success' },
      { time: '13:32:06', message: 'CAPTCHA detected - cannot proceed', status: 'error' },
      { time: '13:32:09', message: 'Task failed: CAPTCHA blocked submission', status: 'error' },
    ],
  },
  {
    id: '6',
    title: 'Click CTA on landing page',
    url: 'https://promo.example.com/spring-sale',
    type: 'click',
    status: 'completed',
    instructions: 'Click the primary CTA button and verify the redirect URL.',
    timeout: 30,
    createdAt: '2 hr ago',
    duration: '3.5s',
    logs: [
      { time: '12:30:01', message: 'Navigating to URL...', status: 'success' },
      { time: '12:30:02', message: 'Page loaded (1.2s)', status: 'success' },
      { time: '12:30:03', message: 'Found CTA button: "Get Started"', status: 'success' },
      { time: '12:30:03', message: 'Clicking element...', status: 'success' },
      { time: '12:30:04', message: 'Redirected to /signup', status: 'success' },
      { time: '12:30:04', message: 'Task complete', status: 'success' },
    ],
    result: 'Redirect verified: https://promo.example.com/signup?ref=spring-sale',
  },
  {
    id: '7',
    title: 'Submit feedback survey',
    url: 'https://forms.example.com/feedback',
    type: 'submit_form',
    status: 'cancelled',
    instructions: 'Submit the Q1 feedback survey with pre-filled responses.',
    timeout: 60,
    createdAt: '3 hr ago',
    logs: [
      { time: '11:15:01', message: 'Navigating to URL...', status: 'success' },
      { time: '11:15:03', message: 'Page loaded (1.6s)', status: 'success' },
      { time: '11:15:04', message: 'Task cancelled by user', status: 'error' },
    ],
  },
  {
    id: '8',
    title: 'Navigate product demo flow',
    url: 'https://demo.saas-tool.com/onboarding',
    type: 'navigate',
    status: 'running',
    instructions: 'Walk through the 5-step onboarding flow and capture each screen.',
    timeout: 120,
    createdAt: '1 min ago',
    logs: [
      { time: '14:33:01', message: 'Navigating to URL...', status: 'success' },
      { time: '14:33:03', message: 'Page loaded (2.0s)', status: 'success' },
      { time: '14:33:05', message: 'Step 1/5: Welcome screen captured', status: 'success' },
      { time: '14:33:08', message: 'Step 2/5: Navigating to profile setup...', status: 'progress' },
    ],
  },
];

// ---------- Component ----------

export default function BrowserAgentWireframe() {
  // State
  const [tasks, setTasks] = useState<BrowserTask[]>(MOCK_TASKS);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCaptchaWarning, setShowCaptchaWarning] = useState(false);

  // Create modal form state
  const [newType, setNewType] = useState<TaskType>('scrape');
  const [newUrl, setNewUrl] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newTimeout, setNewTimeout] = useState(60);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.url.toLowerCase().includes(q) ||
          t.type.includes(q)
        );
      }
      return true;
    });
  }, [tasks, statusFilter, typeFilter, searchQuery]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const running = tasks.filter((t) => t.status === 'running').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, running, completed, rate };
  }, [tasks]);

  // Log reveal animation for selected task
  const [visibleLogs, setVisibleLogs] = useState<number>(0);
  useEffect(() => {
    if (!selectedTask) {
      setVisibleLogs(0);
      return;
    }
    setVisibleLogs(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLogs(i);
      if (i >= selectedTask.logs.length) clearInterval(interval);
    }, 180);
    return () => clearInterval(interval);
  }, [selectedTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create task handler
  function handleCreateTask() {
    if (!newUrl.trim()) return;
    const id = String(Date.now());
    const task: BrowserTask = {
      id,
      title: `${TASK_TYPE_META[newType].label}: ${new URL(newUrl.startsWith('http') ? newUrl : `https://${newUrl}`).hostname}`,
      url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
      type: newType,
      status: 'pending',
      instructions: newInstructions || 'No instructions provided.',
      timeout: newTimeout,
      createdAt: 'Just now',
      logs: [],
    };
    setTasks((prev) => [task, ...prev]);
    setShowCreateModal(false);
    setNewUrl('');
    setNewInstructions('');
    setNewTimeout(60);
    setNewType('scrape');
  }

  // Delete task
  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);
  }

  // Re-run task (mock: sets to running)
  function handleRerun(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'running' as TaskStatus,
              duration: undefined,
              createdAt: 'Just now',
              logs: [{ time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), message: 'Re-running task...', status: 'progress' as const }],
            }
          : t,
      ),
    );
  }

  // Cancel task
  function handleCancel(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: 'cancelled' as TaskStatus, logs: [...t.logs, { time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), message: 'Task cancelled by user', status: 'error' as const }] }
          : t,
      ),
    );
  }

  return (
    <PageWrapper>
      {/* ---- Header ---- */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-muted)]">
          <Globe className="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Browser Agent</h1>
          <p className="text-xs text-[var(--text-muted)]">Autonomous browser tasks powered by Claude</p>
        </div>
      </div>

      {/* ---- 1. Stats Row ---- */}
      <MotionStagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionStaggerItem>
          <StatCard label="Total Tasks" value={stats.total} icon={Globe} tone="default" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard
            label="Running"
            value={stats.running}
            icon={Play}
            tone="primary"
            subtitle="Active now"
            subtitleTone="positive"
          />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="success" />
        </MotionStaggerItem>
        <MotionStaggerItem>
          <StatCard label="Success Rate" value={stats.rate} icon={TrendingUp} tone="accent" suffix="%" />
        </MotionStaggerItem>
      </MotionStagger>

      {/* ---- 2. Filter Bar ---- */}
      <MotionFadeIn delay={0.1}>
        <GlassCard padding="md" hover={false} className="mb-6">
          {/* Status pills */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-[var(--text-muted)]">Status</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === 'all'
                  ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
              )}
            >
              All
            </button>
            {ALL_STATUSES.map((s) => {
              const meta = STATUS_META[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium transition-colors',
                    statusFilter === s
                      ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Type pills */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-[var(--text-muted)]">Type</span>
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium transition-colors',
                typeFilter === 'all'
                  ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
              )}
            >
              All
            </button>
            {ALL_TYPES.map((t) => {
              const meta = TASK_TYPE_META[t];
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium transition-colors',
                    typeFilter === t
                      ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Search + Create */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-disabled)]" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex shrink-0 items-center gap-2 rounded-[var(--radius)] bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:opacity-90 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          </div>
        </GlassCard>
      </MotionFadeIn>

      {/* ---- Main 2-column layout ---- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* ---- 4. Task List (left) ---- */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No tasks found"
              description="Adjust your filters or create a new browser task."
              action={
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-[var(--radius)] bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Create Task
                </button>
              }
            />
          ) : (
            <MotionStagger className="space-y-3">
              {filteredTasks.map((task) => {
                const typeMeta = TASK_TYPE_META[task.type];
                const statusMeta = STATUS_META[task.status];
                const TypeIcon = typeMeta.icon;
                const isSelected = selectedTaskId === task.id;
                const isRunning = task.status === 'running';

                return (
                  <MotionStaggerItem key={task.id}>
                    <GlassCard
                      padding="md"
                      hover
                      className={cn(
                        'cursor-pointer transition-all',
                        isSelected && 'ring-2 ring-[var(--primary)] border-[var(--primary)]',
                        isRunning && 'animate-pulse-border',
                      )}
                      as="button"
                    >
                      <div
                        className="w-full text-left"
                        onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={cn(
                                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                typeMeta.tone === 'primary' && 'bg-[var(--primary-muted)] text-[var(--primary)]',
                                typeMeta.tone === 'accent' && 'bg-[var(--accent-muted)] text-[var(--accent)]',
                                typeMeta.tone === 'success' && 'bg-[var(--success-muted)] text-[var(--success)]',
                                typeMeta.tone === 'warning' && 'bg-[var(--warning-muted)] text-[var(--warning)]',
                              )}
                            >
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--text)] truncate">
                                {task.title}
                              </p>
                              <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">
                                {task.url}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <StatusBadge
                              label={statusMeta.label}
                              variant={statusMeta.variant}
                              pulse={statusMeta.pulse}
                              size="sm"
                            />
                            <span className="text-[10px] text-[var(--text-disabled)]">
                              {task.createdAt}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Pill tone={typeMeta.tone}>{typeMeta.label}</Pill>
                          {task.duration && (
                            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                              <Clock className="h-3 w-3" />
                              {task.duration}
                            </span>
                          )}
                          {isRunning && (
                            <Loader2 className="ml-auto h-4 w-4 animate-spin text-[var(--primary)]" />
                          )}
                          {isSelected && (
                            <ChevronRight className="ml-auto h-4 w-4 text-[var(--primary)]" />
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </MotionStaggerItem>
                );
              })}
            </MotionStagger>
          )}
        </div>

        {/* ---- 5. Detail / Live View (right) ---- */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <motion.div
                key={selectedTask.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Live Browser View (for running tasks) */}
                {selectedTask.status === 'running' && (
                  <GlassCard padding="none" hover={false}>
                    {/* URL bar */}
                    <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                      </div>
                      <div className="flex-1 rounded-md bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)] font-mono truncate">
                        {selectedTask.url}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                        <StatusBadge label="Live" variant="danger" size="sm" />
                      </div>
                    </div>

                    {/* Browser viewport placeholder */}
                    <div className="relative aspect-video bg-[#0a0b10]">
                      {/* Gradient placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--surface)] via-[#0d0f18] to-[var(--surface-elevated)]">
                        <div className="text-center">
                          <Monitor className="mx-auto h-12 w-12 text-[var(--text-disabled)]" />
                          <p className="mt-2 text-sm text-[var(--text-muted)]">Live browser session</p>
                        </div>
                      </div>

                      {/* Step overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="rounded-lg bg-black/70 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
                          <span className="text-xs font-medium text-white">
                            {selectedTask.logs[selectedTask.logs.length - 1]?.message ?? 'Processing...'}
                          </span>
                          <div className="ml-auto flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"
                                style={{ opacity: 0.3 + i * 0.3, animationDelay: `${i * 0.2}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CAPTCHA warning banner (toggleable) */}
                      <AnimatePresence>
                        {showCaptchaWarning && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-4 left-4 right-4"
                          >
                            <div className="flex items-center gap-2 rounded-lg border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] backdrop-blur-sm px-4 py-2">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--warning)]" />
                              <span className="text-xs font-medium text-[var(--warning)]">
                                CAPTCHA Detected -- agent paused, waiting for manual intervention
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Toggle CAPTCHA demo */}
                    <div className="flex items-center justify-end px-4 py-2 border-t border-[var(--border)]">
                      <button
                        onClick={() => setShowCaptchaWarning(!showCaptchaWarning)}
                        className="text-[10px] text-[var(--text-disabled)] hover:text-[var(--text-muted)] transition-colors"
                      >
                        {showCaptchaWarning ? 'Hide' : 'Show'} CAPTCHA demo
                      </button>
                    </div>
                  </GlassCard>
                )}

                {/* Task Info */}
                <SectionCard title="Task Details" subtitle={`ID: ${selectedTask.id}`}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={STATUS_META[selectedTask.status].label}
                        variant={STATUS_META[selectedTask.status].variant}
                        pulse={STATUS_META[selectedTask.status].pulse}
                      />
                      <Pill tone={TASK_TYPE_META[selectedTask.type].tone}>
                        {TASK_TYPE_META[selectedTask.type].label}
                      </Pill>
                      {selectedTask.duration && (
                        <Pill tone="muted">
                          <Clock className="h-3 w-3" />
                          {selectedTask.duration}
                        </Pill>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-disabled)] mb-1">
                        URL
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] font-mono break-all">
                        {selectedTask.url}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-disabled)] mb-1">
                        Instructions
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {selectedTask.instructions}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-disabled)] mb-1">
                        Timeout
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{selectedTask.timeout}s</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                      <button
                        onClick={() => handleRerun(selectedTask.id)}
                        className="flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Re-run
                      </button>
                      {selectedTask.status === 'running' && (
                        <button
                          onClick={() => handleCancel(selectedTask.id)}
                          className="flex items-center gap-1.5 rounded-[var(--radius)] border border-[rgba(251,191,36,0.3)] bg-[var(--warning-muted)] px-3 py-1.5 text-xs font-medium text-[var(--warning)] transition-colors hover:opacity-80"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(selectedTask.id)}
                        className="flex items-center gap-1.5 rounded-[var(--radius)] border border-[rgba(248,113,113,0.3)] bg-[var(--danger-muted)] px-3 py-1.5 text-xs font-medium text-[var(--danger)] transition-colors hover:opacity-80"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </SectionCard>

                {/* Execution Log */}
                {selectedTask.logs.length > 0 && (
                  <SectionCard title="Execution Log" subtitle={`${selectedTask.logs.length} entries`}>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {selectedTask.logs.map((log, i) => {
                        if (i >= visibleLogs) return null;
                        const LogIcon =
                          log.status === 'success'
                            ? CheckCircle2
                            : log.status === 'progress'
                              ? Loader2
                              : XCircle;
                        const iconColor =
                          log.status === 'success'
                            ? 'text-[var(--success)]'
                            : log.status === 'progress'
                              ? 'text-[var(--primary)] animate-spin'
                              : 'text-[var(--danger)]';

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-start gap-2 rounded-md bg-[var(--surface)] px-3 py-2"
                          >
                            <LogIcon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', iconColor)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-[var(--text-secondary)]">{log.message}</p>
                            </div>
                            <span className="shrink-0 text-[10px] font-mono text-[var(--text-disabled)]">
                              {log.time}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}

                {/* Task Result */}
                {selectedTask.result && (
                  <SectionCard title="Result">
                    {selectedTask.type === 'screenshot' ? (
                      <div className="aspect-video rounded-lg bg-gradient-to-br from-[var(--primary-muted)] via-[var(--surface)] to-[var(--accent-muted)] flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="mx-auto h-8 w-8 text-[var(--text-disabled)]" />
                          <p className="mt-1.5 text-xs text-[var(--text-muted)]">Screenshot</p>
                        </div>
                      </div>
                    ) : (
                      <pre className="max-h-56 overflow-auto rounded-lg bg-[#0a0b10] p-3 text-xs text-[var(--text-secondary)] font-mono leading-relaxed scrollbar-thin">
                        {selectedTask.result}
                      </pre>
                    )}
                  </SectionCard>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  icon={Monitor}
                  title="Select a task"
                  description="Click on a task from the list to view its details, execution log, and results."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ---- 3. Create Task Modal ---- */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setShowCreateModal(false)}
            />
            {/* Modal */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <GlassCard padding="lg" hover={false} variant="elevated">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-[var(--text)]">Create Browser Task</h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Task Type */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                        Task Type
                      </label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as TaskType)}
                        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      >
                        {ALL_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {TASK_TYPE_META[t].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* URL */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                        URL
                      </label>
                      <input
                        type="url"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                        Instructions
                      </label>
                      <textarea
                        value={newInstructions}
                        onChange={(e) => setNewInstructions(e.target.value)}
                        placeholder="Describe what the browser agent should do..."
                        rows={3}
                        className="w-full resize-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>

                    {/* Timeout slider */}
                    <SliderInput
                      label="Timeout"
                      value={newTimeout}
                      min={10}
                      max={300}
                      step={10}
                      onChange={setNewTimeout}
                      formatValue={(v) => `${v}s`}
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateTask}
                        disabled={!newUrl.trim()}
                        className="flex-1 rounded-[var(--radius)] bg-[image:var(--gradient-primary)] py-2 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pulse border animation for running tasks */}
      <style jsx global>{`
        @keyframes pulse-border {
          0%, 100% { border-color: var(--border); }
          50% { border-color: var(--primary); }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </PageWrapper>
  );
}
