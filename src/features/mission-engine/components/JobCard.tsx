import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Job } from '@/lib/supabase/types'

interface JobCardProps {
  job: Job
  allJobs: Job[]
  onExecute?: (jobId: string) => void
}

// ─── Team config ────────────────────────────────────────────────────────────

type TeamConfig = {
  label: string
  dotClass: string
  textClass: string
  bgClass: string
  borderClass: string
}

const TEAM_CONFIG: Record<Job['operator_team'], TeamConfig> = {
  content_strike: {
    label: 'Content Strike',
    dotClass: 'bg-[var(--success)]',
    textClass: 'text-[var(--success)]',
    bgClass: 'bg-[var(--success-muted)]',
    borderClass: 'border-[rgba(16,185,129,0.2)]',
  },
  growth_operator: {
    label: 'Growth',
    dotClass: 'bg-[var(--primary)]',
    textClass: 'text-[var(--primary)]',
    bgClass: 'bg-[var(--primary-muted)]',
    borderClass: 'border-[rgba(59,130,246,0.2)]',
  },
  revenue_closer: {
    label: 'Revenue',
    dotClass: 'bg-[#a78bfa]',
    textClass: 'text-[#a78bfa]',
    bgClass: 'bg-[var(--accent-muted)]',
    borderClass: 'border-[rgba(124,58,237,0.2)]',
  },
  brand_guardian: {
    label: 'Brand Guardian',
    dotClass: 'bg-[var(--warning)]',
    textClass: 'text-[var(--warning)]',
    bgClass: 'bg-[var(--warning-muted)]',
    borderClass: 'border-[rgba(245,158,11,0.2)]',
  },
  browser_agent: {
    label: 'Browser Agent',
    dotClass: 'bg-[#38bdf8]',
    textClass: 'text-[#38bdf8]',
    bgClass: 'bg-[rgba(56,189,248,0.08)]',
    borderClass: 'border-[rgba(56,189,248,0.2)]',
  },
}

// ─── Status config ───────────────────────────────────────────────────────────

type StatusConfig = {
  badgeVariant: 'muted' | 'warning' | 'success' | 'danger' | 'outline'
  label: string
  dotClass: string
  pulse: boolean
}

const STATUS_CONFIG: Record<Job['status'], StatusConfig> = {
  pending: {
    badgeVariant: 'muted',
    label: 'Pending',
    dotClass: 'bg-[var(--text-disabled)]',
    pulse: false,
  },
  running: {
    badgeVariant: 'warning',
    label: 'Running...',
    dotClass: 'bg-[var(--warning)]',
    pulse: true,
  },
  completed: {
    badgeVariant: 'success',
    label: 'Completed',
    dotClass: 'bg-[var(--success)]',
    pulse: false,
  },
  failed: {
    badgeVariant: 'danger',
    label: 'Failed',
    dotClass: 'bg-[var(--danger)]',
    pulse: false,
  },
  cancelled: {
    badgeVariant: 'outline',
    label: 'Cancelled',
    dotClass: 'bg-[var(--text-disabled)]',
    pulse: false,
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

function allDepsCompleted(job: Job, allJobs: Job[]): boolean {
  return job.depends_on.every((depId) => {
    const dep = allJobs.find((j) => j.id === depId)
    return dep?.status === 'completed'
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function JobCard({ job, allJobs, onExecute }: JobCardProps) {
  const team = TEAM_CONFIG[job.operator_team]
  const statusCfg = STATUS_CONFIG[job.status]

  const depJobs = job.depends_on
    .map((id) => allJobs.find((j) => j.id === id))
    .filter((j): j is Job => j !== undefined)

  const canExecute =
    job.status === 'pending' && allDepsCompleted(job, allJobs)

  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 space-y-3',
        'transition-all duration-150',
        job.status === 'running' &&
          'shadow-[0_0_16px_rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.25)]',
        job.status === 'completed' &&
          'shadow-[0_0_12px_rgba(16,185,129,0.08)]',
        job.status === 'failed' &&
          'border-[rgba(239,68,68,0.25)]',
        job.status === 'cancelled' && 'opacity-50',
      )}
    >
      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'text-sm font-medium text-[var(--text)] leading-tight',
            job.status === 'cancelled' && 'line-through text-[var(--text-muted)]',
          )}
        >
          {job.title}
        </p>
        <Badge variant={statusCfg.badgeVariant} className="shrink-0 mt-0.5">
          <span
            className={cn(
              'inline-block w-1.5 h-1.5 rounded-full shrink-0',
              statusCfg.dotClass,
              statusCfg.pulse && 'animate-pulse-glow',
            )}
            aria-hidden="true"
          />
          {statusCfg.label}
        </Badge>
      </div>

      {/* Team chip + model pill */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
            'text-[10px] font-medium border',
            team.textClass,
            team.bgClass,
            team.borderClass,
          )}
        >
          <span
            className={cn('inline-block w-1.5 h-1.5 rounded-full', team.dotClass)}
            aria-hidden="true"
          />
          {team.label}
        </span>

        {job.model_used && (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full',
              'text-[10px] font-bold tracking-wider uppercase',
              'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
              'border border-[var(--border-subtle)]',
            )}
          >
            {job.model_used === 'claude' ? 'CLAUDE' : 'NANO'}
          </span>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
          {job.description}
        </p>
      )}

      {/* Dependencies */}
      {depJobs.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-[var(--text-disabled)] uppercase tracking-wider">
            Depends on {depJobs.length} job{depJobs.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-1">
            {depJobs.map((dep) => (
              <span
                key={dep.id}
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded',
                  'text-[10px] text-[var(--text-muted)]',
                  'bg-[var(--surface-elevated)] border border-[var(--border-subtle)]',
                )}
              >
                <span
                  className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full shrink-0',
                    STATUS_CONFIG[dep.status].dotClass,
                  )}
                  aria-hidden="true"
                />
                {dep.title.length > 24
                  ? `${dep.title.slice(0, 24)}…`
                  : dep.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Duration */}
      {job.status === 'completed' && job.duration_ms != null && (
        <p className="text-[10px] text-[var(--text-disabled)]">
          Completed in {formatDuration(job.duration_ms!)}
        </p>
      )}

      {/* Error message */}
      {job.status === 'failed' && job.error_message && (
        <p className="text-xs text-[var(--danger)] leading-snug line-clamp-2">
          {job.error_message.length > 100
            ? `${job.error_message.slice(0, 100)}…`
            : job.error_message}
        </p>
      )}

      {/* Execute button */}
      {canExecute && onExecute && (
        <div className="pt-1">
          <Button
            variant="success"
            size="xs"
            onClick={() => onExecute(job.id)}
            className="w-full"
          >
            Run
          </Button>
        </div>
      )}
    </div>
  )
}
