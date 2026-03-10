import { cn } from '@/lib/utils'

interface PlanSummaryProps {
  objective: string
  rationale: string
  estimatedMinutes: number
  jobCount: number
}

export function PlanSummary({
  objective,
  rationale,
  estimatedMinutes,
  jobCount,
}: PlanSummaryProps) {
  return (
    <div
      className={cn(
        'relative pl-5 pr-5 py-5 rounded-[var(--radius-lg)]',
        'bg-[var(--surface)] border border-[var(--border)]',
        'border-l-4 border-l-[var(--success)]',
        'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-sm text-[var(--success)]"
            aria-hidden="true"
          >
            ◆
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--success)]">
            AI Plan
          </span>
        </div>
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full',
            'text-xs font-medium',
            'bg-[var(--success-muted)] text-[var(--success)]',
            'border border-[rgba(16,185,129,0.2)]',
          )}
        >
          ~{estimatedMinutes} min
        </span>
      </div>

      {/* Objective */}
      <p className="text-base font-semibold text-[var(--text)] leading-snug mb-2">
        {objective}
      </p>

      {/* Rationale */}
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
        {rationale}
      </p>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <p className="text-xs text-[var(--text-disabled)]">
          {jobCount} job{jobCount !== 1 ? 's' : ''} decomposed &middot; Est.{' '}
          {estimatedMinutes} min
        </p>
      </div>
    </div>
  )
}
