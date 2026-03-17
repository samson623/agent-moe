import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'

type Job = Database['public']['Tables']['jobs']['Row']

interface JobTreeProps {
  jobs: Job[]
}

// ─── Team chip colors ────────────────────────────────────────────────────────

type ChipStyle = { textClass: string; bgClass: string; borderClass: string }

const TEAM_CHIP: Record<Job['operator_team'], ChipStyle> = {
  content_strike: {
    textClass: 'text-[var(--success)]',
    bgClass: 'bg-[var(--success-muted)]',
    borderClass: 'border-[rgba(16,185,129,0.2)]',
  },
  growth_operator: {
    textClass: 'text-[var(--primary)]',
    bgClass: 'bg-[var(--primary-muted)]',
    borderClass: 'border-[rgba(59,130,246,0.2)]',
  },
  revenue_closer: {
    textClass: 'text-[#a78bfa]',
    bgClass: 'bg-[var(--accent-muted)]',
    borderClass: 'border-[rgba(124,58,237,0.2)]',
  },
  brand_guardian: {
    textClass: 'text-[var(--warning)]',
    bgClass: 'bg-[var(--warning-muted)]',
    borderClass: 'border-[rgba(245,158,11,0.2)]',
  },
  browser_agent: {
    textClass: 'text-[#38bdf8]',
    bgClass: 'bg-[rgba(56,189,248,0.08)]',
    borderClass: 'border-[rgba(56,189,248,0.2)]',
  },
}

// ─── Depth calculation ────────────────────────────────────────────────────────

function getDepthMap(jobs: Job[]): Map<string, number> {
  const depthMap = new Map<string, number>()

  function getDepth(jobId: string): number {
    if (depthMap.has(jobId)) return depthMap.get(jobId)!
    const job = jobs.find((j) => j.id === jobId)
    if (!job || job.depends_on.length === 0) {
      depthMap.set(jobId, 0)
      return 0
    }
    const depth = 1 + Math.max(...job.depends_on.map(getDepth))
    depthMap.set(jobId, depth)
    return depth
  }

  jobs.forEach((j) => getDepth(j.id))
  return depthMap
}

// ─── Component ───────────────────────────────────────────────────────────────

export function JobTree({ jobs }: JobTreeProps) {
  if (jobs.length === 0) {
    return (
      <div
        className={cn(
          'px-5 py-8 rounded-[var(--radius-lg)]',
          'bg-[var(--surface)] border border-[var(--border)]',
          'text-center',
        )}
      >
        <p className="text-sm text-[var(--text-disabled)]">No jobs yet</p>
      </div>
    )
  }

  const depthMap = getDepthMap(jobs)

  // Group jobs by depth level
  const maxDepth = Math.max(...Array.from(depthMap.values()))
  const levels: Job[][] = Array.from({ length: maxDepth + 1 }, () => [])

  jobs.forEach((job) => {
    const depth = depthMap.get(job.id) ?? 0
    const level = levels[depth]
    if (level) level.push(job)
  })

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border)]',
        'bg-[var(--surface)]',
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          Execution Order
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Jobs run in dependency order
        </p>
      </div>

      {/* Tree rows */}
      <div className="px-5 py-4 space-y-3">
        {levels.map((levelJobs, depth) => {
          if (levelJobs.length === 0) return null

          return (
            <div key={depth}>
              {/* Arrow separator (not before the first level) */}
              {depth > 0 && (
                <div className="flex justify-center py-1">
                  <span
                    className="text-xs text-[var(--text-disabled)]"
                    aria-hidden="true"
                  >
                    ↓
                  </span>
                </div>
              )}

              {/* Level label */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    'text-xs font-medium uppercase tracking-widest',
                    'text-[var(--text-disabled)]',
                  )}
                >
                  Level {depth}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-4 h-4 rounded-full',
                    'text-[9px] font-bold',
                    'bg-[var(--surface-elevated)] text-[var(--text-disabled)]',
                    'border border-[var(--border-subtle)]',
                  )}
                >
                  {levelJobs.length}
                </span>
              </div>

              {/* Job chips for this level */}
              <div className="flex flex-wrap gap-2">
                {levelJobs.map((job) => {
                  const chip = TEAM_CHIP[job.operator_team]
                  const title =
                    job.title.length > 20
                      ? `${job.title.slice(0, 20)}…`
                      : job.title

                  return (
                    <span
                      key={job.id}
                      title={job.title}
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full',
                        'text-xs font-medium border',
                        chip.textClass,
                        chip.bgClass,
                        chip.borderClass,
                      )}
                    >
                      {title}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
