'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateBrowserTask } from '../hooks/use-create-browser-task'
import { useExecuteBrowserTask } from '../hooks/use-execute-browser-task'
import { useCreateBrowserTaskSchedule } from '../hooks/use-create-browser-task-schedule'
import type { BrowserTaskType } from '../types'
import { SchedulePicker, buildScheduleFromPicker } from './SchedulePicker'
import type { ExecutionMode } from './SchedulePicker'

interface CreateBrowserTaskModalProps {
  workspaceId: string
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

const TASK_TYPES: Array<{ value: BrowserTaskType; label: string; description: string }> = [
  { value: 'scrape',       label: 'Scrape',       description: 'Extract full page text, links, and HTML' },
  { value: 'screenshot',   label: 'Screenshot',   description: 'Capture a full-page screenshot' },
  { value: 'navigate',     label: 'Navigate',     description: 'Load a URL and capture page metadata' },
  { value: 'extract_data', label: 'Extract Data', description: 'Pull specific fields using selectors' },
  { value: 'click',        label: 'Click',        description: 'Click an element and capture result' },
  { value: 'fill_form',    label: 'Fill Form',    description: 'Fill form fields with data' },
  { value: 'submit_form',  label: 'Submit Form',  description: 'Fill and submit a form' },
  { value: 'monitor',      label: 'Monitor',      description: 'Check a page for changes or metrics' },
]

const TIMEOUT_OPTIONS = [
  { value: 15000,  label: '15s' },
  { value: 30000,  label: '30s' },
  { value: 60000,  label: '60s' },
  { value: 120000, label: '120s' },
]

export function CreateBrowserTaskModal({
  workspaceId,
  isOpen,
  onClose,
  onCreated,
}: CreateBrowserTaskModalProps) {
  const [url, setUrl] = useState('')
  const [taskType, setTaskType] = useState<BrowserTaskType>('scrape')
  const [instructions, setInstructions] = useState('')
  const [priority, setPriority] = useState(5)
  const [timeoutMs, setTimeoutMs] = useState(30000)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [enableLiveView, setEnableLiveView] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // Schedule picker state
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('immediate')
  const [scheduledAt, setScheduledAt] = useState('')
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'custom_cron'>('daily')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1)
  const [customCron, setCustomCron] = useState('')
  const [scheduleName, setScheduleName] = useState('')

  const { create, isCreating, error: createError } = useCreateBrowserTask()
  const { execute, isExecuting } = useExecuteBrowserTask()
  const { create: createSchedule, isCreating: isCreatingSchedule, error: scheduleError } = useCreateBrowserTaskSchedule()

  const isSubmitting = isCreating || isExecuting || isCreatingSchedule

  function reset() {
    setUrl('')
    setTaskType('scrape')
    setInstructions('')
    setPriority(5)
    setTimeoutMs(30000)
    setShowAdvanced(false)
    setEnableLiveView(false)
    setIsDone(false)
    setExecutionMode('immediate')
    setScheduledAt('')
    setRecurringType('daily')
    setScheduleTime('09:00')
    setScheduleDayOfWeek(1)
    setCustomCron('')
    setScheduleName('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!url || !instructions) return

    if (executionMode === 'immediate') {
      // Existing flow: create task + optionally execute
      const task = await create({
        workspace_id: workspaceId,
        task_type: taskType,
        url,
        instructions,
        priority,
        timeout_ms: timeoutMs,
        config: enableLiveView ? { enable_live_view: true } : undefined,
      })

      if (!task) return
      await execute(task.id)
    } else {
      // Schedule flow: create a schedule
      if (!scheduleName) return

      const scheduleConfig = buildScheduleFromPicker({
        mode: executionMode,
        recurringType,
        scheduleTime,
        scheduleDayOfWeek,
        customCron,
        scheduledAt,
      })

      const schedule = await createSchedule({
        workspace_id: workspaceId,
        name: scheduleName,
        schedule_type: scheduleConfig.schedule_type,
        cron_expression: scheduleConfig.cron_expression,
        scheduled_at: scheduleConfig.scheduled_at,
        task_type: taskType,
        url,
        instructions,
        priority,
        timeout_ms: timeoutMs,
      })

      if (!schedule) return
    }

    setIsDone(true)
    onCreated?.()
  }

  const displayError = createError || scheduleError

  const isFormValid = url && instructions && (
    executionMode === 'immediate' ||
    (scheduleName && (
      executionMode === 'scheduled_once' ? scheduledAt : true
    ) && (
      executionMode === 'recurring' && recurringType === 'custom_cron' ? customCron : true
    ))
  )

  const submitLabel = executionMode === 'immediate'
    ? 'Create & Execute'
    : executionMode === 'scheduled_once'
      ? 'Schedule Task'
      : 'Create Recurring Schedule'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Browser Task</DialogTitle>
          <DialogDescription>
            Configure and queue an automated browser task
          </DialogDescription>
        </DialogHeader>

        {isDone ? (
          <div className="text-center py-6 space-y-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {executionMode === 'immediate' ? 'Task created!' : 'Schedule created!'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {executionMode === 'immediate'
                  ? 'Task is queued for execution.'
                  : executionMode === 'scheduled_once'
                    ? 'Task will run at the scheduled time.'
                    : 'Tasks will run on the configured schedule.'}
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-1">
              <Button variant="outline" size="sm" onClick={() => { reset() }}>Create Another</Button>
              <Button size="sm" onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text)]">URL <span className="text-[var(--danger)]">*</span></label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={cn(
                  'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]',
                  'text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
                  'px-3 py-2 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors'
                )}
              />
            </div>

            {/* Task Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text)]">Task Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TASK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTaskType(t.value)}
                    className={cn(
                      'text-left px-3 py-2 rounded-[var(--radius)] border text-xs transition-all',
                      taskType === t.value
                        ? 'border-[var(--accent)] bg-[rgba(99,102,241,0.08)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]'
                    )}
                  >
                    <span className="font-semibold block">{t.label}</span>
                    <span className="text-xs opacity-70 leading-tight">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text)]">Instructions <span className="text-[var(--danger)]">*</span></label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Describe what you want the agent to do on this page..."
                rows={3}
                className={cn(
                  'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]',
                  'text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
                  'px-3 py-2 resize-none outline-none',
                  'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors'
                )}
              />
            </div>

            {/* Priority + Timeout row */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)]">
                  Priority: <span className="text-[var(--accent)]">{priority}</span>/10
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)]">Timeout</label>
                <div className="flex gap-1">
                  {TIMEOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTimeoutMs(opt.value)}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs border transition-all',
                        timeoutMs === opt.value
                          ? 'border-[var(--accent)] text-[var(--accent)] bg-[rgba(99,102,241,0.08)]'
                          : 'border-[var(--border)] text-[var(--text-muted)]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule Picker */}
            <SchedulePicker
              mode={executionMode}
              onModeChange={setExecutionMode}
              scheduledAt={scheduledAt}
              onScheduledAtChange={setScheduledAt}
              recurringType={recurringType}
              onRecurringTypeChange={setRecurringType}
              scheduleTime={scheduleTime}
              onScheduleTimeChange={setScheduleTime}
              scheduleDayOfWeek={scheduleDayOfWeek}
              onScheduleDayOfWeekChange={setScheduleDayOfWeek}
              customCron={customCron}
              onCustomCronChange={setCustomCron}
              scheduleName={scheduleName}
              onScheduleNameChange={setScheduleName}
            />

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {showAdvanced ? '▼' : '▶'} Advanced options
            </button>

            {showAdvanced && (
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 space-y-3">
                {/* Live View Toggle */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-medium text-[var(--text)]">Live Browser View</p>
                    <p className="text-xs text-[var(--text-muted)]">Watch the browser in real-time as it executes</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enableLiveView}
                    onClick={() => setEnableLiveView(!enableLiveView)}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors',
                      enableLiveView
                        ? 'bg-[var(--accent)] border-[var(--accent)]'
                        : 'bg-[var(--surface)] border-[var(--border)]'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                        enableLiveView ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                </label>

                <p className="text-xs text-[var(--text-muted)]">
                  Advanced config (selectors, form data) can be set via API or edited after creation.
                </p>
              </div>
            )}

            {displayError && (
              <p className="text-xs text-[var(--danger)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-[var(--radius)] px-3 py-2">
                {displayError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <><Loader2 size={12} className="animate-spin mr-1.5" />Creating...</>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
