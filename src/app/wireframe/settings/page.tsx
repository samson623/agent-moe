'use client';

import { useState } from 'react';
import {
  PageWrapper,
  SectionCard,
  StatusBadge,
  Pill,
  SliderInput,
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
  Settings,
  Shield,
  Brain,
  Bell,
  AlertTriangle,
  Trash2,
  RotateCcw,
  X,
  Plus,
} from 'lucide-react';

// ── Toggle Switch ──────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-[var(--primary)]' : 'bg-[var(--surface-elevated)] border border-[var(--border)]',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

// ── Labeled Row ────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0 mr-4">
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Page Component ─────────────────────────────────────────────────────

export default function SettingsPage() {
  // Brand Rules
  const [brandName, setBrandName] = useState('Agent MOE');
  const [brandVoice, setBrandVoice] = useState(
    'Confident, knowledgeable, and slightly bold. We speak like a trusted advisor who has insider access to the best strategies. Avoid corporate jargon. Keep it conversational but authoritative.',
  );
  const [blockedPhrases, setBlockedPhrases] = useState([
    'game-changer',
    'synergy',
    'circle back',
    'low-hanging fruit',
  ]);
  const [newPhrase, setNewPhrase] = useState('');
  const toneOptions = ['Professional', 'Casual', 'Bold', 'Educational'] as const;
  const [selectedTone, setSelectedTone] = useState<string>('Bold');

  // Approval Thresholds
  const [confidence, setConfidence] = useState(85);
  const [manualReview, setManualReview] = useState(true);
  const [flagRisky, setFlagRisky] = useState(true);
  const [maxAutoApprovals, setMaxAutoApprovals] = useState(50);

  // AI Configuration
  const [costThreshold, setCostThreshold] = useState(25);
  const routerModes = ['Auto', 'Force Claude', 'Force GPT-5 Nano'] as const;
  const [routerMode, setRouterMode] = useState<string>('Auto');

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [missionComplete, setMissionComplete] = useState(true);
  const [approvalNeeded, setApprovalNeeded] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);

  // Danger Zone
  const [confirmClear, setConfirmClear] = useState(false);

  function addPhrase() {
    const trimmed = newPhrase.trim();
    if (trimmed && !blockedPhrases.includes(trimmed)) {
      setBlockedPhrases((prev) => [...prev, trimmed]);
      setNewPhrase('');
    }
  }

  function removePhrase(phrase: string) {
    setBlockedPhrases((prev) => prev.filter((p) => p !== phrase));
  }

  function handleResetBrand() {
    setBrandName('Agent MOE');
    setBrandVoice(
      'Confident, knowledgeable, and slightly bold. We speak like a trusted advisor who has insider access to the best strategies. Avoid corporate jargon. Keep it conversational but authoritative.',
    );
    setBlockedPhrases(['game-changer', 'synergy', 'circle back', 'low-hanging fruit']);
    setSelectedTone('Bold');
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Configure your Agent MOE workspace
        </p>
      </div>

      <MotionStagger className="space-y-6">
        {/* ── Brand Rules ──────────────────────────────────────────── */}
        <MotionStaggerItem>
          <SectionCard
            title="Brand Rules"
            subtitle="Define your brand identity and content guidelines"
            action={<Shield className="h-4 w-4 text-[var(--primary)]" />}
          >
            <div className="space-y-5">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Brand Voice */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Brand Voice
                </label>
                <textarea
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  rows={3}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              {/* Blocked Phrases */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Blocked Phrases
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {blockedPhrases.map((phrase) => (
                    <Pill key={phrase} tone="danger">
                      {phrase}
                      <button
                        onClick={() => removePhrase(phrase)}
                        className="ml-1 hover:text-[var(--text)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Pill>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPhrase}
                    onChange={(e) => setNewPhrase(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPhrase()}
                    placeholder="Add blocked phrase..."
                    className="h-8 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <button
                    onClick={addPhrase}
                    className="h-8 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              </div>

              {/* Tone Selector */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Tone
                </label>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setSelectedTone(tone)}
                      className={cn(
                        'rounded-[var(--radius-pill)] border px-4 py-1.5 text-xs font-medium transition-colors',
                        selectedTone === tone
                          ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                      )}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </MotionStaggerItem>

        {/* ── Approval Thresholds ──────────────────────────────────── */}
        <MotionStaggerItem>
          <SectionCard
            title="Approval Thresholds"
            subtitle="Control when content requires manual review"
            action={<Settings className="h-4 w-4 text-[var(--accent)]" />}
          >
            <div className="space-y-1">
              <div className="mb-4">
                <SliderInput
                  label="Auto-approve confidence"
                  value={confidence}
                  min={0}
                  max={100}
                  step={5}
                  onChange={setConfidence}
                  formatValue={(v) => `${v}%`}
                />
              </div>
              <SettingRow
                label="Require manual review"
                description="All content must be reviewed by a human before publishing"
              >
                <Toggle checked={manualReview} onChange={setManualReview} />
              </SettingRow>
              <SettingRow
                label="Flag risky claims"
                description="Highlight content that contains unverified claims or statistics"
              >
                <Toggle checked={flagRisky} onChange={setFlagRisky} />
              </SettingRow>
              <SettingRow
                label="Max auto-approvals per day"
                description="Limit the number of auto-approved items daily"
              >
                <input
                  type="number"
                  value={maxAutoApprovals}
                  onChange={(e) => setMaxAutoApprovals(Number(e.target.value))}
                  min={0}
                  max={500}
                  className="h-8 w-20 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-2 text-center text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </SettingRow>
            </div>
          </SectionCard>
        </MotionStaggerItem>

        {/* ── AI Configuration ─────────────────────────────────────── */}
        <MotionStaggerItem>
          <SectionCard
            title="AI Configuration"
            subtitle="Model settings and cost controls"
            action={<Brain className="h-4 w-4 text-[var(--primary)]" />}
          >
            <div className="space-y-1">
              <SettingRow label="Heavy Model" description="Used for content generation, missions, research">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text)]">Claude (Opus)</span>
                  <StatusBadge label="Connected" variant="success" pulse size="sm" />
                </div>
              </SettingRow>
              <SettingRow label="Light Model" description="Used for scoring, classification, CTA generation">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text)]">GPT-5 Nano</span>
                  <StatusBadge label="Connected" variant="success" pulse size="sm" />
                </div>
              </SettingRow>
              <div className="py-3 border-b border-[var(--border)]">
                <SliderInput
                  label="Daily cost threshold"
                  value={costThreshold}
                  min={0}
                  max={100}
                  step={5}
                  onChange={setCostThreshold}
                  formatValue={(v) => `$${v}`}
                />
              </div>
              <div className="py-3">
                <p className="text-sm font-medium text-[var(--text)] mb-2">Model Router Mode</p>
                <div className="flex flex-wrap gap-2">
                  {routerModes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setRouterMode(mode)}
                      className={cn(
                        'rounded-[var(--radius-pill)] border px-4 py-1.5 text-xs font-medium transition-colors',
                        routerMode === mode
                          ? 'border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </MotionStaggerItem>

        {/* ── Notifications ────────────────────────────────────────── */}
        <MotionStaggerItem>
          <SectionCard
            title="Notifications"
            subtitle="Choose what alerts you receive"
            action={<Bell className="h-4 w-4 text-[var(--accent)]" />}
          >
            <div className="space-y-1">
              <SettingRow label="Email notifications" description="Receive notifications via email">
                <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
              </SettingRow>
              <SettingRow label="Mission complete alerts" description="Get notified when a mission finishes">
                <Toggle checked={missionComplete} onChange={setMissionComplete} />
              </SettingRow>
              <SettingRow label="Approval needed alerts" description="Alert when content needs human review">
                <Toggle checked={approvalNeeded} onChange={setApprovalNeeded} />
              </SettingRow>
              <SettingRow label="Daily summary" description="Receive a daily digest of all activity">
                <Toggle checked={dailySummary} onChange={setDailySummary} />
              </SettingRow>
            </div>
          </SectionCard>
        </MotionStaggerItem>

        {/* ── Danger Zone ──────────────────────────────────────────── */}
        <MotionStaggerItem>
          <SectionCard
            title="Danger Zone"
            subtitle="Irreversible actions — proceed with caution"
            variant="default"
            action={<AlertTriangle className="h-4 w-4 text-[var(--danger)]" />}
            className="border-[var(--danger)]/30"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--danger)] bg-[var(--danger-muted)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition-opacity hover:opacity-80"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </button>
              <button
                onClick={handleResetBrand}
                className="flex items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--warning)] bg-[var(--warning-muted)] px-4 py-2 text-sm font-medium text-[var(--warning)] transition-opacity hover:opacity-80"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Brand Rules
              </button>
            </div>
          </SectionCard>
        </MotionStaggerItem>
      </MotionStagger>

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            key="confirm-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmClear(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-muted)] mb-4">
                  <Trash2 className="h-6 w-6 text-[var(--danger)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text)]">Clear All Data?</h2>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  This will permanently delete all missions, content, analytics, and settings.
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6 w-full">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 rounded-[var(--radius)] bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Delete Everything
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
