'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe, Camera, MousePointer, FileText, Search, Monitor, Send, Navigation,
  ArrowLeft, RefreshCw, Play, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MotionFadeIn } from '@/components/nebula/motion'
import { useBrowserTaskDetail } from '../hooks/use-browser-task-detail'
import { useExecuteBrowserTask } from '../hooks/use-execute-browser-task'
import { useRealtimeBrowserTasks } from '../hooks/use-realtime-browser-tasks'
import { BrowserTaskLog } from './BrowserTaskLog'
import { BrowserTaskResult } from './BrowserTaskResult'
import type { BrowserTask, BrowserTaskType, BrowserTaskStatus } from '../types'
import { LiveBrowserView } from './LiveBrowserView'

const TASK_ICONS: Record<BrowserTaskType, React.ElementType> = {
  scrape:       Globe,
  screenshot:   Camera,
  click:        MousePointer,
  fill_form:    FileText,
  navigate:     Navigation,
  monitor:      Monitor,
  extract_data: Search,
  submit_form:  Send,
}

const STATUS_COLORS: Record<BrowserTaskStatus, string> = {
  pending:   '#f59e0b',
  running:   '#3b82f6',
  completed: '#10b981',
  failed:    '#ef4444',
  cancelled: '#6b7280',
  timeout:   '#f97316',
}

type DetailTab = 'live' | 'result' | 'config' | 'activity'

interface BrowserTaskDetailPageProps {
  taskId: string
}

export function BrowserTaskDetailPage({ taskId }: BrowserTaskDetailPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<DetailTab>('result')

  const { task, isLoading, error, refresh } = useBrowserTaskDetail(taskId)
  const { execute, cancel, isExecuting, isCancelling } = useExecuteBrowserTask()

  // Realtime updates for this task
  const handleUpdate = useCallback((updated: BrowserTask) => {
    if (updated.id === taskId) refresh()
  }, [taskId, refresh])

  useRealtimeBrowserTasks({
    workspaceId: task?.workspace_id ?? '',
    onUpdate: handleUpdate,
  })

  // Auto-switch to live tab when task starts running with live view
  const prevStatusRef = useRef(task?.status)
  useEffect(() => {
    if (task?.status === 'running' && prevStatusRef.current !== 'running' && task.config.enable_live_view) {
      setActiveTab('live')
    }
    prevStatusRef.current = task?.status
  }, [task?.status, task?.config.enable_live_view])

  if (isLoading && !task) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-[var(--border)] rounded w-1/3" />
        <div className="h-32 bg-[var(--border)] rounded" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">{error ?? 'Task not found.'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/browser')}>
          Back to Browser Agent
        </Button>
      </div>
    )
  }

  const Icon = TASK_ICONS[task.task_type]
  const statusColor = STATUS_COLORS[task.status]
  const isRunning = task.status === 'running'
  const hasLiveView = Boolean(task.config.enable_live_view)
  const showLiveTab = isRunning && hasLiveView

  return (
    <MotionFadeIn className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/browser')}
            className="p-2 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] transition-colors"
          >
            <ArrowLeft size={14} />
          </button>

          <div
            className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)]"
            style={{ background: `${statusColor}18`, border: `1px solid ${statusColor}30` }}
          >
            <Icon size={18} style={{ color: statusColor }} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--text)] capitalize">
                {task.task_type.replace('_', ' ')}
              </h2>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}30` }}
              >
                {task.status}
                {isRunning && <span className="ml-1 animate-pulse">●</span>}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">{task.url}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {task.status === 'pending' && (
            <Button size="sm" onClick={() => { void execute(task.id).then(refresh) }} disabled={isExecuting}>
              <Play size={12} className="mr-1.5" />
              {isExecuting ? 'Starting…' : 'Execute'}
            </Button>
          )}
          {isRunning && (
            <Button variant="outline" size="sm" onClick={() => { void cancel(task.id).then(refresh) }} disabled={isCancelling}>
              <X size={12} className="mr-1.5" />
              {isCancelling ? 'Cancelling…' : 'Cancel'}
            </Button>
          )}
          {(task.status === 'failed' || task.status === 'timeout') && (
            <Button size="sm" onClick={() => { void execute(task.id).then(refresh) }} disabled={isExecuting}>
              <RefreshCw size={12} className="mr-1.5" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-[var(--border)]">
            {([...(showLiveTab ? ['live' as DetailTab] : []), 'result', 'config', 'activity'] as DetailTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-xs font-medium capitalize transition-all border-b-2 -mb-px',
                  activeTab === tab
                    ? tab === 'live'
                      ? 'border-[#10b981] text-[#10b981]'
                      : 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
              >
                {tab === 'live' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Live View
                  </span>
                ) : (
                  tab
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className={cn(
            'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]',
            activeTab === 'live' ? 'p-0 overflow-hidden' : 'p-4'
          )}>
            {activeTab === 'live' && showLiveTab && (
              <LiveBrowserView taskId={task.id} enabled={isRunning} />
            )}
            {activeTab === 'result'   && <BrowserTaskResult task={task} />}
            {activeTab === 'activity' && <BrowserTaskLog task={task} />}
            {activeTab === 'config' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Instructions</p>
                  <p className="text-sm text-[var(--text)] leading-relaxed">{task.instructions}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Task Config</p>
                  <pre className="text-xs md:text-sm text-[var(--text)] bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius)] p-3 overflow-auto font-mono">
                    {JSON.stringify(task.config, null, 2)}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {task.mission_id && (
                    <div>
                      <p className="text-[var(--text-muted)]">Mission ID</p>
                      <p className="text-[var(--text)] font-mono text-xs">{task.mission_id}</p>
                    </div>
                  )}
                  {task.job_id && (
                    <div>
                      <p className="text-[var(--text-muted)]">Job ID</p>
                      <p className="text-[var(--text)] font-mono text-xs">{task.job_id}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[var(--text-muted)]">Priority</p>
                    <p className="text-[var(--text)]">{task.priority}/10</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Timeout</p>
                    <p className="text-[var(--text)]">{task.timeout_ms / 1000}s</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Max Retries</p>
                    <p className="text-[var(--text)]">{task.max_retries}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Retry Count</p>
                    <p className="text-[var(--text)]">{task.retry_count}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Status sidebar */}
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
            <p className="text-xs font-semibold text-[var(--text-muted)]">Timeline</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Created</span>
                <span className="text-[var(--text)]">{new Date(task.created_at).toLocaleString()}</span>
              </div>
              {task.started_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Started</span>
                  <span className="text-[var(--text)]">{new Date(task.started_at).toLocaleString()}</span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Completed</span>
                  <span className="text-[var(--text)]">{new Date(task.completed_at).toLocaleString()}</span>
                </div>
              )}
              {task.result?.execution_time_ms && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Exec time</span>
                  <span className="font-semibold" style={{ color: statusColor }}>
                    {(task.result.execution_time_ms / 1000).toFixed(2)}s
                  </span>
                </div>
              )}
            </div>
          </div>

          {task.result?.page_title && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Page Title</p>
              <p className="text-xs text-[var(--text)]">{task.result.page_title}</p>
            </div>
          )}
        </div>
      </div>
    </MotionFadeIn>
  )
}
