'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobCard } from './JobCard'
import { JobTree } from './JobTree'
import { PlanSummary } from './PlanSummary'
import type { Database } from '@/lib/supabase/types'

type Mission = Database['public']['Tables']['missions']['Row']
type Job = Database['public']['Tables']['jobs']['Row']

interface MissionDetailPageProps {
  mission: Mission
  initialJobs: Job[]
}

type PlanSummaryState = {
  objective: string
  rationale: string
  estimatedMinutes: number
}

const STATUS_VARIANT: Record<
  Mission['status'],
  'muted' | 'default' | 'warning' | 'success' | 'danger' | 'info'
> = {
  pending: 'muted',
  planning: 'info',
  running: 'warning',
  paused: 'muted',
  completed: 'success',
  failed: 'danger',
}

const PRIORITY_VARIANT: Record<
  Mission['priority'],
  'muted' | 'default' | 'warning' | 'danger'
> = {
  low: 'muted',
  normal: 'default',
  high: 'warning',
  urgent: 'danger',
}

const STATUS_LABEL: Record<Mission['status'], string> = {
  pending: 'Pending',
  planning: 'Planning',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
}

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 px-4 py-3 rounded-[var(--radius-lg)]',
        'bg-[var(--surface)] border border-[var(--border)]',
      )}
    >
      <span className={cn('text-2xl font-bold tabular-nums', colorClass)}>
        {value}
      </span>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  )
}

export function MissionDetailPage({
  mission,
  initialJobs,
}: MissionDetailPageProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [isPlanning, setIsPlanning] = useState(false)
  const [planSummary, setPlanSummary] = useState<PlanSummaryState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalJobs = jobs.length
  const completedJobs = jobs.filter((j) => j.status === 'completed').length
  const runningJobs = jobs.filter((j) => j.status === 'running').length
  const failedJobs = jobs.filter((j) => j.status === 'failed').length

  async function handlePlanMission() {
    setIsPlanning(true)
    setError(null)
    try {
      const res = await fetch(`/api/missions/${mission.id}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: mission.workspace_id }),
      })
      const data: {
        error?: string
        plan?: {
          objective: string
          rationale: string
          estimatedDurationMinutes: number
        }
      } = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Planning failed')

      const jobsRes = await fetch(
        `/api/jobs?workspace_id=${mission.workspace_id}&mission_id=${mission.id}`,
      )
      const jobsData: { jobs?: Job[] } = await jobsRes.json()
      setJobs(jobsData.jobs ?? [])

      if (data.plan) {
        setPlanSummary({
          objective: data.plan.objective,
          rationale: data.plan.rationale,
          estimatedMinutes: data.plan.estimatedDurationMinutes,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsPlanning(false)
    }
  }

  return (
    <div className="animate-fade-in p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={cn(
              'inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]',
              'hover:text-[var(--text-secondary)] transition-colors duration-150',
            )}
          >
            ← Command Center
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--text)] leading-tight truncate">
              {mission.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANT[mission.status]}>
                {STATUS_LABEL[mission.status]}
              </Badge>
              <Badge variant={PRIORITY_VARIANT[mission.priority]}>
                {mission.priority.charAt(0).toUpperCase() +
                  mission.priority.slice(1)}{' '}
                Priority
              </Badge>
              <span className="text-xs text-[var(--text-disabled)]">
                {mission.id.slice(0, 8)}
              </span>
            </div>
            {mission.instruction && (
              <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
                {mission.instruction}
              </p>
            )}
          </div>

          <Button
            variant="success"
            size="sm"
            onClick={handlePlanMission}
            disabled={isPlanning}
            className="shrink-0"
          >
            {isPlanning ? (
              <>
                <span
                  className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                Planning...
              </>
            ) : (
              <>◆ Plan Mission</>
            )}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className={cn(
            'px-4 py-3 rounded-[var(--radius)] text-sm',
            'bg-[var(--danger-muted)] border border-[rgba(239,68,68,0.25)] text-[var(--danger)]',
          )}
        >
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Jobs" value={totalJobs} colorClass="text-[var(--text)]" />
        <StatCard
          label="Completed"
          value={completedJobs}
          colorClass="text-[var(--success)]"
        />
        <StatCard
          label="Running"
          value={runningJobs}
          colorClass="text-[var(--warning)]"
        />
        <StatCard label="Failed" value={failedJobs} colorClass="text-[var(--danger)]" />
      </div>

      {/* Plan Summary */}
      {planSummary && (
        <PlanSummary
          objective={planSummary.objective}
          rationale={planSummary.rationale}
          estimatedMinutes={planSummary.estimatedMinutes}
          jobCount={jobs.length}
        />
      )}

      {/* Jobs */}
      {jobs.length === 0 ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center py-20 rounded-[var(--radius-xl)]',
            'bg-[var(--surface)] border border-[var(--border)] border-dashed',
            'text-center space-y-4',
          )}
        >
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center',
              'bg-[var(--surface-elevated)] border border-[var(--border)]',
              'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
            )}
          >
            <span className="text-xl text-[var(--success)]">◆</span>
          </div>
          <div>
            <p className="text-base font-medium text-[var(--text)]">
              Ready to Plan
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Run the planner to decompose this mission into jobs for each
              operator team.
            </p>
          </div>
          <Button
            variant="success"
            onClick={handlePlanMission}
            disabled={isPlanning}
          >
            {isPlanning ? 'Planning...' : '◆ Plan Mission'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Jobs — {jobs.length}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} allJobs={jobs} />
              ))}
            </div>
          </div>

          <JobTree jobs={jobs} />
        </div>
      )}
    </div>
  )
}
