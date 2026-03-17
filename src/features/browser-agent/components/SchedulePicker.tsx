'use client'

import { cn } from '@/lib/utils'
import type { ScheduleType } from '../types'

export type ExecutionMode = 'immediate' | 'scheduled_once' | 'recurring'

interface SchedulePickerProps {
  mode: ExecutionMode
  onModeChange: (mode: ExecutionMode) => void
  // Once
  scheduledAt: string
  onScheduledAtChange: (v: string) => void
  // Recurring
  recurringType: 'daily' | 'weekly' | 'custom_cron'
  onRecurringTypeChange: (v: 'daily' | 'weekly' | 'custom_cron') => void
  scheduleTime: string
  onScheduleTimeChange: (v: string) => void
  scheduleDayOfWeek: number
  onScheduleDayOfWeekChange: (v: number) => void
  customCron: string
  onCustomCronChange: (v: string) => void
  scheduleName: string
  onScheduleNameChange: (v: string) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MODE_OPTIONS: Array<{ value: ExecutionMode; label: string }> = [
  { value: 'immediate', label: 'Run Now' },
  { value: 'scheduled_once', label: 'Schedule Once' },
  { value: 'recurring', label: 'Recurring' },
]

const RECURRING_OPTIONS: Array<{ value: 'daily' | 'weekly' | 'custom_cron'; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom_cron', label: 'Custom Cron' },
]

export function SchedulePicker(props: SchedulePickerProps) {
  const showScheduleFields = props.mode !== 'immediate'

  return (
    <div className="space-y-3">
      {/* Execution mode selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--text)]">Execution</label>
        <div className="flex gap-1">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => props.onModeChange(opt.value)}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium border transition-all',
                props.mode === opt.value
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[rgba(99,102,241,0.08)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule name (required for scheduled modes) */}
      {showScheduleFields && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text)]">
            Schedule Name <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="text"
            value={props.scheduleName}
            onChange={(e) => props.onScheduleNameChange(e.target.value)}
            placeholder="e.g., Daily competitor check"
            className={cn(
              'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]',
              'text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
              'px-3 py-2 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors'
            )}
          />
        </div>
      )}

      {/* Schedule Once — datetime picker */}
      {props.mode === 'scheduled_once' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text)]">Run At</label>
          <input
            type="datetime-local"
            value={props.scheduledAt}
            onChange={(e) => props.onScheduledAtChange(e.target.value)}
            className={cn(
              'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]',
              'text-sm text-[var(--text)]',
              'px-3 py-2 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors'
            )}
          />
        </div>
      )}

      {/* Recurring — type selector + time/day/cron */}
      {props.mode === 'recurring' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text)]">Frequency</label>
            <div className="flex gap-1">
              {RECURRING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => props.onRecurringTypeChange(opt.value)}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium border transition-all',
                    props.recurringType === opt.value
                      ? 'border-[var(--primary)] text-[var(--primary)] bg-[rgba(139,92,246,0.08)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time picker (for daily/weekly) */}
          {props.recurringType !== 'custom_cron' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text)]">Time</label>
              <input
                type="time"
                value={props.scheduleTime}
                onChange={(e) => props.onScheduleTimeChange(e.target.value)}
                className={cn(
                  'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]',
                  'text-sm text-[var(--text)]',
                  'px-3 py-2 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors'
                )}
              />
            </div>
          )}

          {/* Day of week picker (for weekly) */}
          {props.recurringType === 'weekly' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text)]">Day</label>
              <div className="flex gap-1">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => props.onScheduleDayOfWeekChange(i)}
                    className={cn(
                      'flex-1 py-1.5 rounded-[var(--radius)] text-xs font-medium border transition-all',
                      props.scheduleDayOfWeek === i
                        ? 'border-[var(--primary)] text-[var(--primary)] bg-[rgba(139,92,246,0.08)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom cron input */}
          {props.recurringType === 'custom_cron' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text)]">Cron Expression</label>
              <input
                type="text"
                value={props.customCron}
                onChange={(e) => props.onCustomCronChange(e.target.value)}
                placeholder="*/30 * * * *"
                className={cn(
                  'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]',
                  'text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] font-mono',
                  'px-3 py-2 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors'
                )}
              />
              <p className="text-xs text-[var(--text-muted)]">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Build the cron expression and schedule type from picker state.
 */
export function buildScheduleFromPicker(opts: {
  mode: ExecutionMode
  recurringType: 'daily' | 'weekly' | 'custom_cron'
  scheduleTime: string
  scheduleDayOfWeek: number
  customCron: string
  scheduledAt: string
}): { schedule_type: ScheduleType; cron_expression?: string; scheduled_at?: string } {
  if (opts.mode === 'scheduled_once') {
    return {
      schedule_type: 'once',
      scheduled_at: new Date(opts.scheduledAt).toISOString(),
    }
  }

  const [hours, minutes] = opts.scheduleTime.split(':').map(Number)

  if (opts.recurringType === 'daily') {
    return {
      schedule_type: 'daily',
      cron_expression: `${minutes} ${hours} * * *`,
    }
  }

  if (opts.recurringType === 'weekly') {
    return {
      schedule_type: 'weekly',
      cron_expression: `${minutes} ${hours} * * ${opts.scheduleDayOfWeek}`,
    }
  }

  return {
    schedule_type: 'custom_cron',
    cron_expression: opts.customCron,
  }
}
