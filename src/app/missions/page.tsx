import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PageWrapper } from '@/components/nebula'
import { SectionHeader } from '@/components/nebula'
import { StatusBadge } from '@/components/nebula'
import { GlassCard } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem, MotionFadeIn } from '@/components/nebula/motion'
import { MissionsEmptyState } from './empty-state'
import type { MissionStatus, MissionPriority } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'accent' | 'info'

const STATUS_VARIANT: Record<MissionStatus, StatusVariant> = {
  pending: 'default',
  planning: 'info',
  running: 'primary',
  paused: 'warning',
  completed: 'success',
  failed: 'danger',
}

const STATUS_LABEL: Record<MissionStatus, string> = {
  pending: 'Pending',
  planning: 'Planning',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
}

const STATUS_PULSE: Record<MissionStatus, boolean> = {
  pending: false,
  planning: true,
  running: true,
  paused: false,
  completed: false,
  failed: false,
}

const PRIORITY_VARIANT: Record<MissionPriority, StatusVariant> = {
  low: 'default',
  normal: 'default',
  high: 'warning',
  urgent: 'danger',
}

const PRIORITY_LABEL: Record<MissionPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function MissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = (await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null }

  type MissionRow = { id: string; title: string; status: string; priority: string; created_at: string }
  const missions: MissionRow[] = workspace
    ? ((await supabase
        .from('missions')
        .select('id, title, status, priority, created_at')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(20)) as { data: MissionRow[] | null }).data ?? []
    : []

  return (
    <PageWrapper className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <MotionFadeIn>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
          <SectionHeader
            title="Missions"
            description={`${missions.length} recent`}
            className="mb-0 flex-1"
          />
        </div>
      </MotionFadeIn>

      {/* Body */}
      {!workspace ? (
        <MissionsEmptyState variant="no-workspace" />
      ) : missions.length === 0 ? (
        <MissionsEmptyState variant="no-missions" />
      ) : (
        <MotionStagger className="flex flex-col gap-2">
          {missions.map((mission) => {
            const status = mission.status as MissionStatus
            const priority = mission.priority as MissionPriority

            return (
              <MotionStaggerItem key={mission.id}>
                <Link href={`/missions/${mission.id}`}>
                  <GlassCard
                    padding="none"
                    className="group flex items-center gap-4 px-5 py-4 cursor-pointer"
                  >
                    <span className="flex-1 min-w-0 text-sm font-medium text-[var(--text)] truncate">
                      {mission.title}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge
                        label={STATUS_LABEL[status]}
                        variant={STATUS_VARIANT[status]}
                        pulse={STATUS_PULSE[status]}
                      />
                      <StatusBadge
                        label={PRIORITY_LABEL[priority]}
                        variant={PRIORITY_VARIANT[priority]}
                      />
                    </div>

                    <span className="shrink-0 text-xs text-[var(--text-muted)] w-16 text-right tabular-nums">
                      {formatRelativeTime(mission.created_at)}
                    </span>

                    <ArrowRight
                      size={14}
                      className="shrink-0 text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors"
                      aria-hidden="true"
                    />
                  </GlassCard>
                </Link>
              </MotionStaggerItem>
            )
          })}
        </MotionStagger>
      )}
    </PageWrapper>
  )
}
