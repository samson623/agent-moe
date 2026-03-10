'use client'

import { useMemo } from 'react'
import type { Job, JobStatus } from '@/lib/supabase/types'

export interface QueueStats {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
  progress: number
}

function countByStatus(jobs: Job[], status: JobStatus): number {
  return jobs.filter(j => j.status === status).length
}

export function useQueueStats(jobs: Job[]): QueueStats {
  return useMemo<QueueStats>(() => {
    const total = jobs.length
    const pending = countByStatus(jobs, 'pending')
    const running = countByStatus(jobs, 'running')
    const completed = countByStatus(jobs, 'completed')
    const failed = countByStatus(jobs, 'failed')
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, pending, running, completed, failed, progress }
  }, [jobs])
}
