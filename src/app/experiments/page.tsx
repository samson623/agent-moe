import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FlaskConical, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { PageWrapper, SectionHeader, GlassCard, StatusBadge, EmptyState } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import { getExperimentBriefs } from '@/lib/supabase/queries/experiments'
import type { ExperimentBrief } from '@/features/experiment/types'

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

function ExperimentCard({ brief }: { brief: ExperimentBrief }) {
  const progress = brief.max_iterations > 0
    ? Math.round((brief.current_iteration / brief.max_iterations) * 100)
    : 0

  const statusVariant = brief.is_complete ? 'success' : brief.is_active ? 'primary' : 'default'
  const statusLabel = brief.is_complete ? 'Complete' : brief.is_active ? 'Active' : 'Paused'

  return (
    <Link href={`/experiments/${brief.id}`}>
      <GlassCard className="p-5 hover:border-[var(--primary-muted)] transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <FlaskConical size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
            <span className="text-[14px] font-semibold text-[var(--text)] leading-tight">{brief.name}</span>
          </div>
          <StatusBadge variant={statusVariant} label={statusLabel} />
        </div>

        <p className="text-[12px] text-[var(--text-muted)] mb-4 line-clamp-2">{brief.goal}</p>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Iterations</span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {brief.current_iteration} / {brief.max_iterations}
            </span>
          </div>
          <div className="h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{brief.metric_type.replace('_', ' ')} · {brief.metric_direction}</span>
          {brief.best_metric_value !== null && (
            <span className="text-[var(--primary)] font-medium">
              Best: {brief.best_metric_value.toFixed(3)}
            </span>
          )}
        </div>

        <div className="mt-2 text-[11px] text-[var(--text-muted)]">
          Last run: {formatRelative(brief.last_run_at)}
        </div>
      </GlassCard>
    </Link>
  )
}

export default async function ExperimentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: workspace } = await adminClient
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!workspace) redirect('/login')

  const { data: experiments } = await getExperimentBriefs(adminClient, workspace.id)

  const active = experiments.filter((e) => e.is_active && !e.is_complete)
  const complete = experiments.filter((e) => e.is_complete)
  const paused = experiments.filter((e) => !e.is_active && !e.is_complete)

  return (
    <PageWrapper>
      <SectionHeader
        title="Experiments"
        description="Autonomous overnight iterate/evaluate loops"
        action={
          <Link
            href="/experiments/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            New Experiment
          </Link>
        }
      />

      {experiments.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No experiments yet"
          description="Create an experiment to start an autonomous improvement loop overnight."
          action={
            <Link
              href="/experiments/new"
              className="px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              Create your first experiment
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-[var(--primary)]" />
                <span className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Active ({active.length})
                </span>
              </div>
              <MotionStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((e) => (
                  <MotionStaggerItem key={e.id}>
                    <ExperimentCard brief={e} />
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            </section>
          )}

          {paused.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={14} className="text-[var(--text-muted)]" />
                <span className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Paused ({paused.length})
                </span>
              </div>
              <MotionStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {paused.map((e) => (
                  <MotionStaggerItem key={e.id}>
                    <ExperimentCard brief={e} />
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            </section>
          )}

          {complete.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} className="text-[var(--accent)]" />
                <span className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Complete ({complete.length})
                </span>
              </div>
              <MotionStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {complete.map((e) => (
                  <MotionStaggerItem key={e.id}>
                    <ExperimentCard brief={e} />
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            </section>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
