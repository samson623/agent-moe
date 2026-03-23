'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, FlaskConical, CheckCircle2, XCircle, BookmarkCheck, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { PageWrapper, GlassCard, SectionHeader, StatusBadge, Pill } from '@/components/nebula'
import type { ExperimentBrief, ExperimentRun, ExperimentDecision } from '@/features/experiment/types'

function formatRelative(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

type DecisionCfg = { label: string; variant: 'success' | 'danger' | 'accent' | 'default' }
const DECISION_CONFIG: Record<ExperimentDecision, DecisionCfg> = {
  kept:      { label: '✅ kept',      variant: 'success' },
  discarded: { label: '❌ discarded', variant: 'danger'  },
  baseline:  { label: '🔖 baseline',  variant: 'accent'  },
  pending:   { label: '⏳ pending',   variant: 'default' },
}

function RunRow({ run }: { run: ExperimentRun }) {
  const cfg = DECISION_CONFIG[run.decision] ?? DECISION_CONFIG.pending

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-[var(--border-subtle)] last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-[var(--text-muted)] w-16 shrink-0">
          Iter {run.iteration}
        </span>
        <StatusBadge variant={cfg.variant} label={cfg.label} />
        {run.metric_value !== null && (
          <span className="ml-auto text-[12px] text-[var(--text-muted)]">
            {run.metric_value.toFixed(4)}
            {run.metric_delta !== null && (
              <span className={run.metric_delta >= 0 ? 'text-green-400' : 'text-red-400'}>
                {' '}({run.metric_delta >= 0 ? '+' : ''}{run.metric_delta.toFixed(4)})
              </span>
            )}
          </span>
        )}
      </div>
      {run.diff_summary && (
        <p className="text-[12px] text-[var(--text-muted)] pl-[72px] leading-relaxed">
          {run.diff_summary}
        </p>
      )}
      {run.decision_reason && (
        <p className="text-[11px] text-[var(--text-muted)] opacity-60 pl-[72px]">
          {run.decision_reason}
        </p>
      )}
    </div>
  )
}

export default function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [brief, setBrief] = useState<ExperimentBrief | null>(null)
  const [runs, setRuns] = useState<ExperimentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [briefRes, runsRes] = await Promise.all([
      fetch(`/api/experiments/${id}`),
      fetch(`/api/experiments/${id}/runs`),
    ])
    const briefJson = await briefRes.json() as { experiment?: ExperimentBrief; error?: string }
    const runsJson = await runsRes.json() as { runs?: ExperimentRun[] }

    if (briefJson.error) { setError(briefJson.error); setLoading(false); return }
    setBrief(briefJson.experiment ?? null)
    setRuns(runsJson.runs ?? [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [id])

  async function runNow() {
    setRunning(true)
    setError(null)
    const res = await fetch(`/api/experiments/${id}/run`, { method: 'POST' })
    const json = await res.json() as { run?: ExperimentRun; brief?: ExperimentBrief; error?: string }
    if (json.error) { setError(json.error); setRunning(false); return }
    if (json.brief) setBrief(json.brief)
    if (json.run) setRuns((prev) => [...prev, json.run!])
    setRunning(false)
  }

  async function toggleActive() {
    if (!brief) return
    setToggling(true)
    const res = await fetch(`/api/experiments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !brief.is_active }),
    })
    const json = await res.json() as { experiment?: ExperimentBrief; error?: string }
    if (json.experiment) setBrief(json.experiment)
    setToggling(false)
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[13px]">Loading experiment…</span>
        </div>
      </PageWrapper>
    )
  }

  if (error || !brief) {
    return (
      <PageWrapper>
        <p className="text-[13px] text-red-400">{error ?? 'Experiment not found'}</p>
        <Link href="/experiments" className="text-[12px] text-[var(--primary)] mt-2 inline-block">
          ← Back to experiments
        </Link>
      </PageWrapper>
    )
  }

  const progress = brief.max_iterations > 0
    ? Math.round((brief.current_iteration / brief.max_iterations) * 100)
    : 0

  const statusVariant = brief.is_complete ? 'success' : brief.is_active ? 'primary' : 'default'
  const statusLabel = brief.is_complete ? 'Complete' : brief.is_active ? 'Active' : 'Paused'

  return (
    <PageWrapper>
      <Link href="/experiments" className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] mb-4 transition-colors">
        <ArrowLeft size={13} />
        Experiments
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={18} className="text-[var(--primary)]" />
            <h1 className="text-[18px] font-bold text-[var(--text)]">{brief.name}</h1>
            <StatusBadge variant={statusVariant} label={statusLabel} />
          </div>
          <p className="text-[13px] text-[var(--text-muted)] max-w-xl">{brief.goal}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleActive}
            disabled={toggling || brief.is_complete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-40 transition-colors"
          >
            {brief.is_active ? <ToggleRight size={14} className="text-[var(--primary)]" /> : <ToggleLeft size={14} />}
            {brief.is_active ? 'Active' : 'Paused'}
          </button>
          <button
            onClick={runNow}
            disabled={running || brief.is_complete || !brief.is_active}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white text-[12px] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {running ? 'Running…' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Iterations', value: `${brief.current_iteration} / ${brief.max_iterations}` },
          { label: 'Best metric', value: brief.best_metric_value !== null ? brief.best_metric_value.toFixed(4) : '—' },
          { label: 'Metric', value: brief.metric_type.replace('_', ' ') },
          { label: 'Last run', value: formatRelative(brief.last_run_at) },
        ].map(({ label, value }) => (
          <GlassCard key={label} className="p-4">
            <p className="text-[11px] text-[var(--text-muted)] mb-1">{label}</p>
            <p className="text-[15px] font-semibold text-[var(--text)]">{value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Progress bar */}
      <GlassCard className="p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-[12px] text-[var(--text-muted)]">Progress</span>
          <span className="text-[12px] text-[var(--text-muted)]">{progress}%</span>
        </div>
        <div className="h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Pill tone="muted">{brief.cron_expression}</Pill>
          <Pill tone="muted">{brief.target_platform} · {brief.target_asset_type}</Pill>
          <Pill tone="muted">threshold: {brief.keep_threshold}</Pill>
        </div>
      </GlassCard>

      {/* Run history */}
      <GlassCard className="p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text)] mb-4">Iteration History</h3>
        {error && <p className="text-[12px] text-red-400 mb-3">{error}</p>}
        {runs.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)]">No iterations run yet. Click Run Now to start.</p>
        ) : (
          <div>
            {[...runs].reverse().map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </div>
        )}
      </GlassCard>
    </PageWrapper>
  )
}
