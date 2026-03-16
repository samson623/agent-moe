'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, Plus, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BrowserTaskCard } from './BrowserTaskCard'
import { BrowserTaskFilters } from './BrowserTaskFilters'
import { CreateBrowserTaskModal } from './CreateBrowserTaskModal'
import { useBrowserTaskStats } from '../hooks/use-browser-task-stats'
import { useRealtimeBrowserTasks } from '../hooks/use-realtime-browser-tasks'
import type { BrowserTask, BrowserTaskType, BrowserTaskStatus } from '../types'
import { useRouter } from 'next/navigation'
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'

interface BrowserAgentPageProps {
  workspaceId: string
}

const LIMIT = 12

function StatCard({
  label,
  value,
  color,
  pulse,
}: {
  label: string
  value: string | number
  color: string
  pulse?: boolean
}) {
  return (
    <div className="relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-4 overflow-hidden">
      <p className="text-xs md:text-sm text-[var(--text-muted)] mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold tabular-nums" style={{ color }}>
          {value}
        </p>
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
          </span>
        )}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-4 animate-pulse space-y-3">
      <div className="h-4 bg-[var(--border)] rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-2 bg-[var(--border)] rounded" />
        <div className="h-2 bg-[var(--border)] rounded" />
      </div>
      <div className="h-3 bg-[var(--border)] rounded w-1/2" />
    </div>
  )
}

export function BrowserAgentPage({ workspaceId }: BrowserAgentPageProps) {
  const router = useRouter()

  // Filter state
  const [status, setStatus] = useState<BrowserTaskStatus | 'all'>('all')
  const [taskType, setTaskType] = useState<BrowserTaskType | 'all'>('all')
  const [urlSearch, setUrlSearch] = useState('')
  const [page, setPage] = useState(1)

  // UI state
  const [modalOpen, setModalOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [tasks, setTasks] = useState<BrowserTask[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const { stats } = useBrowserTaskStats(workspaceId)

  // Load tasks
  useEffect(() => {
    if (!workspaceId) return
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          workspace_id: workspaceId,
          limit: String(LIMIT),
          offset: String((page - 1) * LIMIT),
        })
        if (status !== 'all') params.set('status', status)
        if (taskType !== 'all') params.set('task_type', taskType)

        const res = await fetch(`/api/browser-tasks?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error()
        const json = await res.json() as { data?: BrowserTask[]; count?: number }

        let filtered = json.data ?? []
        if (urlSearch) {
          filtered = filtered.filter((t) => t.url.toLowerCase().includes(urlSearch.toLowerCase()))
        }
        setTasks(filtered)
        setTotal(json.count ?? 0)
      } catch { /* silently handle */ }
      finally { setIsLoading(false) }
    }

    void load()
    const interval = setInterval(() => { void load() }, 5000)
    return () => { controller.abort(); clearInterval(interval) }
  }, [workspaceId, page, status, taskType, urlSearch, tick])

  // Realtime
  useRealtimeBrowserTasks({
    workspaceId,
    onInsert: (task) => setTasks((prev) => [task, ...prev].slice(0, LIMIT)),
    onUpdate: (task) => setTasks((prev) => prev.map((t) => t.id === task.id ? task : t)),
    onDelete: (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
  })

  const activeFilterCount = [
    status !== 'all',
    taskType !== 'all',
    urlSearch.length > 0,
  ].filter(Boolean).length

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Actions */}
      <MotionFadeIn>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <Button
            onClick={() => setModalOpen(true)}
            variant="accent"
            size="sm"
            className="gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            <Plus size={14} />
              New Task
            </Button>
        </div>
      </MotionFadeIn>

      {/* Stats */}
      <MotionStagger className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MotionStaggerItem><StatCard label="Total Tasks"    value={stats?.total ?? 0}          color="#6366f1" /></MotionStaggerItem>
        <MotionStaggerItem><StatCard label="Running"        value={stats?.running ?? 0}         color="#3b82f6" pulse={(stats?.running ?? 0) > 0} /></MotionStaggerItem>
        <MotionStaggerItem><StatCard label="Completed Today" value={stats?.completed_today ?? 0} color="#10b981" /></MotionStaggerItem>
        <MotionStaggerItem><StatCard label="Failed"         value={stats?.failed ?? 0}          color="#ef4444" /></MotionStaggerItem>
      </MotionStagger>

      {/* Filters */}
      <MotionFadeIn delay={0.05}>
      <BrowserTaskFilters
        status={status}
        taskType={taskType}
        urlSearch={urlSearch}
        onStatusChange={(v) => { setStatus(v); setPage(1) }}
        onTaskTypeChange={(v) => { setTaskType(v); setPage(1) }}
        onUrlSearchChange={(v) => { setUrlSearch(v); setPage(1) }}
        activeCount={activeFilterCount}
      />
      </MotionFadeIn>

      {/* Task grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div
          className={cn(
            'relative rounded-[var(--radius-xl)] border border-[var(--border)]',
            'bg-[var(--surface-solid)] p-12 text-center overflow-hidden'
          )}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center gap-3">
            <Globe size={32} className="text-[var(--text-muted)] opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">
              {activeFilterCount > 0
                ? 'No tasks match your filters'
                : 'No browser tasks yet. Create your first task.'}
            </p>
            {activeFilterCount === 0 && (
              <Button
                onClick={() => setModalOpen(true)}
                variant="accent"
                size="sm"
                className="mt-2"
              >
                <Plus size={13} className="mr-1.5" />
                New Task
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <MotionStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks.map((task) => (
              <MotionStaggerItem key={task.id}>
                <BrowserTaskCard
                  task={task}
                  onClick={() => router.push(`/browser/${task.id}`)}
                  onActionComplete={refresh}
                />
              </MotionStaggerItem>
            ))}
          </MotionStagger>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-[var(--text-muted)]">
                Page {page} of {totalPages} · {total} task{total !== 1 ? 's' : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <CreateBrowserTaskModal
        workspaceId={workspaceId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={refresh}
      />
    </div>
  )
}
