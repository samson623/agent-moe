'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import { JobCard } from './JobCard'
import { JobTree } from './JobTree'
import type { Database } from '@/lib/supabase/types'

type Mission = Database['public']['Tables']['missions']['Row']
type Job = Database['public']['Tables']['jobs']['Row']

interface ActivityLogEntry {
  id: number
  action: string
  message: string
  occurred_at: string
  entity_type: string
  entity_id: string
  actor: string
  meta: Record<string, unknown> | null
}

interface MissionDetailPageProps {
  mission: Mission
  initialJobs: Job[]
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

// ─── Activity log icon/color per action ──────────────────────────────────────

function getActivityStyle(action: string) {
  if (action.includes('created')) return { dot: 'bg-[var(--primary)]', icon: '+' }
  if (action.includes('planned')) return { dot: 'bg-[var(--info)]', icon: '◆' }
  if (action.includes('started')) return { dot: 'bg-[var(--warning)]', icon: '▶' }
  if (action.includes('completed')) return { dot: 'bg-[var(--success)]', icon: '✓' }
  if (action.includes('failed')) return { dot: 'bg-[var(--danger)]', icon: '✗' }
  if (action.includes('running')) return { dot: 'bg-[var(--warning)]', icon: '▶' }
  if (action.includes('paused')) return { dot: 'bg-[var(--text-muted)]', icon: '‖' }
  return { dot: 'bg-[var(--text-disabled)]', icon: '·' }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MissionDetailPage({
  mission: initialMission,
  initialJobs,
}: MissionDetailPageProps) {
  const [missionStatus, setMissionStatus] = useState(initialMission.status)
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const isActive = missionStatus === 'pending' || missionStatus === 'planning' || missionStatus === 'running'

  const fetchUpdates = useCallback(async () => {
    try {
      // Fetch jobs, mission status, and activity in parallel
      const [jobsRes, missionRes, activityRes] = await Promise.all([
        fetch(`/api/jobs?workspace_id=${initialMission.workspace_id}&mission_id=${initialMission.id}`),
        fetch(`/api/missions/${initialMission.id}`),
        fetch(`/api/missions/${initialMission.id}/activity?workspace_id=${initialMission.workspace_id}`),
      ])

      const [jobsData, missionData, activityData] = await Promise.all([
        jobsRes.json(),
        missionRes.json(),
        activityRes.json(),
      ])

      if (jobsData.jobs) setJobs(jobsData.jobs)
      if (missionData.mission?.status) setMissionStatus(missionData.mission.status)
      if (activityData.logs) setActivityLog(activityData.logs)
    } catch {
      // Silently ignore poll errors
    }
  }, [initialMission.id, initialMission.workspace_id])

  // Poll while mission is active
  useEffect(() => {
    // Initial fetch
    fetchUpdates()

    if (isActive) {
      pollRef.current = setInterval(fetchUpdates, 2000)
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isActive, fetchUpdates])

  // Auto-scroll activity log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activityLog.length])

  const totalJobs = jobs.length
  const completedJobs = jobs.filter((j) => j.status === 'completed').length
  const runningJobs = jobs.filter((j) => j.status === 'running').length
  const failedJobs = jobs.filter((j) => j.status === 'failed').length

  async function handleExecuteJob(jobId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/jobs/${jobId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: initialMission.workspace_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Execution failed')
      await fetchUpdates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setError(null)
    setRetrying(true)
    try {
      const res = await fetch(`/api/missions/${initialMission.id}/retry`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Retry failed')
      setMissionStatus('running')
      // Start polling again
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(fetchUpdates, 2000)
      await fetchUpdates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <MotionFadeIn className="p-6 space-y-6">
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
            &larr; Command Center
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--text)] leading-tight truncate">
              {initialMission.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANT[missionStatus]}>
                {isActive && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1"
                    aria-hidden="true"
                  />
                )}
                {STATUS_LABEL[missionStatus]}
              </Badge>
              <Badge variant={PRIORITY_VARIANT[initialMission.priority]}>
                {initialMission.priority.charAt(0).toUpperCase() +
                  initialMission.priority.slice(1)}{' '}
                Priority
              </Badge>
              <span className="text-xs text-[var(--text-disabled)]">
                {initialMission.id.slice(0, 8)}
              </span>
            </div>
            {initialMission.instruction && (
              <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
                {initialMission.instruction}
              </p>
            )}
          </div>
          {(missionStatus === 'paused' || missionStatus === 'failed') && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={retrying}
              className="shrink-0"
            >
              {retrying ? 'Retrying…' : '↺ Retry Mission'}
            </Button>
          )}
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
      {totalJobs > 0 && (
        <MotionStagger className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MotionStaggerItem><StatCard label="Total Jobs" value={totalJobs} colorClass="text-[var(--text)]" /></MotionStaggerItem>
          <MotionStaggerItem><StatCard label="Completed" value={completedJobs} colorClass="text-[var(--success)]" /></MotionStaggerItem>
          <MotionStaggerItem><StatCard label="Running" value={runningJobs} colorClass="text-[var(--warning)]" /></MotionStaggerItem>
          <MotionStaggerItem><StatCard label="Failed" value={failedJobs} colorClass="text-[var(--danger)]" /></MotionStaggerItem>
        </MotionStagger>
      )}

      {/* Live Activity Feed */}
      <div
        className={cn(
          'rounded-[var(--radius-xl)] border border-[var(--border)]',
          'bg-[var(--surface)]',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Live Activity
          </h2>
          {isActive && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto px-4 py-2 space-y-0">
          {activityLog.length === 0 && isActive && (
            <div className="flex items-center gap-3 py-4 text-sm text-[var(--text-muted)]">
              <span
                className="inline-block w-4 h-4 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin shrink-0"
                aria-hidden="true"
              />
              Waiting for activity...
            </div>
          )}
          {activityLog.length === 0 && !isActive && (
            <p className="py-4 text-sm text-[var(--text-disabled)]">No activity recorded.</p>
          )}
          {activityLog.map((entry) => {
            const style = getActivityStyle(entry.action)
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 py-1.5 group"
              >
                <span className="text-xs text-[var(--text-disabled)] tabular-nums pt-0.5 shrink-0 w-16">
                  {formatTime(entry.occurred_at)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0 mt-0.5',
                    style.dot,
                    'text-white',
                  )}
                >
                  {style.icon}
                </span>
                <span className="text-sm text-[var(--text)] leading-snug">
                  {entry.message}
                </span>
              </div>
            )
          })}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Jobs */}
      {jobs.length === 0 ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center py-16 rounded-[var(--radius-xl)]',
            'bg-[var(--surface)] border border-[var(--border)] border-dashed',
            'text-center space-y-3',
          )}
        >
          <span
            className="inline-block w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm text-[var(--text-muted)]">
            Decomposing mission into jobs...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Jobs &mdash; {completedJobs}/{totalJobs} complete
            </h2>
            <MotionStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <MotionStaggerItem key={job.id}><JobCard job={job} allJobs={jobs} onExecute={handleExecuteJob} /></MotionStaggerItem>
              ))}
            </MotionStagger>
          </div>

          <JobTree jobs={jobs} />
        </div>
      )}
    </MotionFadeIn>
  )
}
