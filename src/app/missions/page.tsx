import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
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

type StatusVariant = BadgeProps['variant']
type PriorityVariant = BadgeProps['variant']

const STATUS_VARIANT: Record<MissionStatus, StatusVariant> = {
  pending: 'outline',
  planning: 'info',
  running: 'default',
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

const PRIORITY_VARIANT: Record<MissionPriority, PriorityVariant> = {
  low: 'muted',
  normal: 'outline',
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
    <div className="p-7 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-[var(--text)] tracking-tight">
          Missions
        </h1>
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {missions.length} recent
        </span>
      </div>

      {/* Body */}
      {!workspace ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-[var(--text-muted)] text-sm">No workspace found.</p>
          <Link
            href="/settings"
            className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] underline underline-offset-2"
          >
            Set up a workspace in Settings
          </Link>
        </div>
      ) : missions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-[var(--text-muted)] text-sm">No missions yet.</p>
          <Link
            href="/"
            className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] underline underline-offset-2"
          >
            Create your first mission from the Command Center
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {missions.map((mission) => {
            const status = mission.status as MissionStatus
            const priority = mission.priority as MissionPriority

            return (
              <li key={mission.id}>
                <Link
                  href={`/missions/${mission.id}`}
                  className="group flex items-center gap-4 px-5 py-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all duration-150"
                >
                  <span className="flex-1 min-w-0 text-sm font-medium text-[var(--text)] truncate">
                    {mission.title}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={STATUS_VARIANT[status]}>
                      {STATUS_LABEL[status]}
                    </Badge>
                    <Badge variant={PRIORITY_VARIANT[priority]}>
                      {PRIORITY_LABEL[priority]}
                    </Badge>
                  </div>

                  <span className="shrink-0 text-xs text-[var(--text-muted)] w-16 text-right tabular-nums">
                    {formatRelativeTime(mission.created_at)}
                  </span>

                  <ArrowRight
                    size={14}
                    className="shrink-0 text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
