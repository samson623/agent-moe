'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FlaskConical, Loader2 } from 'lucide-react'
import { PageWrapper, GlassCard, SectionHeader } from '@/components/nebula'

const PLATFORMS = ['x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'universal']
const ASSET_TYPES = ['post', 'thread', 'script', 'caption', 'email', 'report']
const OPERATORS = ['content_strike', 'growth_operator', 'revenue_closer', 'brand_guardian']
const METRIC_TYPES = ['confidence_score', 'content_length', 'approval_rate']

const PRESETS = [
  {
    label: 'Best X Post',
    name: 'X Post Optimizer',
    goal: 'Write a high-confidence X (Twitter) post that educates about AI automation and drives profile clicks.',
    target_platform: 'x',
    target_asset_type: 'post',
    metric_type: 'confidence_score',
    metric_direction: 'maximize',
    max_iterations: 10,
  },
  {
    label: 'LinkedIn Thread',
    name: 'LinkedIn Thread Optimizer',
    goal: 'Create a LinkedIn thread about agent-based AI systems that generates professional engagement.',
    target_platform: 'linkedin',
    target_asset_type: 'thread',
    metric_type: 'confidence_score',
    metric_direction: 'maximize',
    max_iterations: 8,
  },
  {
    label: 'Long-Form Script',
    name: 'YouTube Script Optimizer',
    goal: 'Write a YouTube script that explains how Agent MOE automates a morning workflow. Hook in first 15 seconds.',
    target_platform: 'youtube',
    target_asset_type: 'script',
    metric_type: 'content_length',
    metric_direction: 'maximize',
    max_iterations: 5,
  },
]

type FormState = {
  name: string
  goal: string
  operator_team: string
  target_platform: string
  target_asset_type: string
  metric_type: string
  metric_direction: string
  keep_threshold: string
  max_iterations: string
  cron_expression: string
}

const DEFAULTS: FormState = {
  name: '',
  goal: '',
  operator_team: 'content_strike',
  target_platform: 'x',
  target_asset_type: 'post',
  metric_type: 'confidence_score',
  metric_direction: 'maximize',
  keep_threshold: '0',
  max_iterations: '10',
  cron_expression: '0 6 * * *',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"

export default function NewExperimentPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(DEFAULTS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      goal: preset.goal,
      target_platform: preset.target_platform,
      target_asset_type: preset.target_asset_type,
      metric_type: preset.metric_type,
      metric_direction: preset.metric_direction,
      max_iterations: String(preset.max_iterations),
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const wsRes = await fetch('/api/workspaces')
    const wsJson = await wsRes.json() as { workspace?: { id: string }; error?: string }
    const workspaceId = wsJson.workspace?.id

    if (!workspaceId) {
      setError('Could not find your workspace. Please refresh and try again.')
      setSubmitting(false)
      return
    }

    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        name: form.name,
        goal: form.goal,
        operator_team: form.operator_team,
        target_platform: form.target_platform,
        target_asset_type: form.target_asset_type,
        metric_type: form.metric_type,
        metric_direction: form.metric_direction,
        keep_threshold: parseFloat(form.keep_threshold) || 0,
        max_iterations: parseInt(form.max_iterations) || 10,
        cron_expression: form.cron_expression,
      }),
    })

    const json = await res.json() as { experiment?: { id: string }; error?: string }

    if (json.error || !json.experiment) {
      setError(json.error ?? 'Failed to create experiment')
      setSubmitting(false)
      return
    }

    router.push(`/experiments/${json.experiment.id}`)
  }

  return (
    <PageWrapper>
      <Link href="/experiments" className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] mb-4 transition-colors">
        <ArrowLeft size={13} />
        Experiments
      </Link>

      <SectionHeader
        title="New Experiment"
        description="Define a goal, pick a metric, and let Agent MOE iterate overnight"
      />

      {/* Presets */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Quick Start</p>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-full border border-[var(--border)] text-[12px] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit}>
        <GlassCard className="p-6 space-y-5">
          <Field label="Experiment Name" required>
            <input
              className={inputCls}
              placeholder="X Post Optimizer"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </Field>

          <Field label="Goal" required>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Describe what you're trying to optimize. Be specific about platform, tone, and success criteria."
              value={form.goal}
              onChange={(e) => set('goal', e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Platform">
              <select className={inputCls} value={form.target_platform} onChange={(e) => set('target_platform', e.target.value)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Asset Type">
              <select className={inputCls} value={form.target_asset_type} onChange={(e) => set('target_asset_type', e.target.value)}>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Metric">
              <select className={inputCls} value={form.metric_type} onChange={(e) => set('metric_type', e.target.value)}>
                {METRIC_TYPES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Direction">
              <select className={inputCls} value={form.metric_direction} onChange={(e) => set('metric_direction', e.target.value)}>
                <option value="maximize">maximize ↑</option>
                <option value="minimize">minimize ↓</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Max Iterations">
              <input
                type="number"
                min={1}
                max={100}
                className={inputCls}
                value={form.max_iterations}
                onChange={(e) => set('max_iterations', e.target.value)}
              />
            </Field>
            <Field label="Operator Team">
              <select className={inputCls} value={form.operator_team} onChange={(e) => set('operator_team', e.target.value)}>
                {OPERATORS.map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Cron Schedule (UTC)">
            <input
              className={inputCls}
              placeholder="0 6 * * *"
              value={form.cron_expression}
              onChange={(e) => set('cron_expression', e.target.value)}
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Default: 6 AM UTC = 2 AM EST (runs once daily)</p>
          </Field>

          {error && (
            <p className="text-[12px] text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/experiments"
              className="px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
              {submitting ? 'Creating…' : 'Create Experiment'}
            </button>
          </div>
        </GlassCard>
      </form>
    </PageWrapper>
  )
}
