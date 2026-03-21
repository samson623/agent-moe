'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  motion,
  AnimatePresence,
  overlayVariants,
  modalVariants,
} from '@/components/nebula/motion'
import { useCreate } from '../hooks/use-create'
import { MISSION_TEMPLATES, type MissionTemplate } from '../templates'
import type { ScheduleType, ExecutionMode, PermissionLevel } from '../types'

interface CreateMissionModalProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  onCreated: () => void
}

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'once', label: 'One-time' },
  { value: 'custom_cron', label: 'Custom Cron' },
]

const MODE_OPTIONS: { value: ExecutionMode; label: string; desc: string }[] = [
  { value: 'auto', label: 'Auto', desc: 'Route automatically' },
  { value: 'light', label: 'GPT-5 Nano', desc: 'Fast & cheap' },
  { value: 'heavy', label: 'Claude', desc: 'Free via Max' },
]

const PERMISSION_OPTIONS: { value: PermissionLevel; label: string; desc: string }[] = [
  { value: 'autonomous', label: 'Autonomous', desc: 'Runs without approval' },
  { value: 'draft', label: 'Draft', desc: 'Requires approval' },
]

export function CreateMissionModal({ open, onClose, workspaceId, onCreated }: CreateMissionModalProps) {
  const { create, creating, error } = useCreate()

  const [name, setName] = useState('')
  const [instruction, setInstruction] = useState('')
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily')
  const [cronExpression, setCronExpression] = useState('')
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('auto')
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('autonomous')

  function reset() {
    setName('')
    setInstruction('')
    setScheduleType('daily')
    setCronExpression('')
    setExecutionMode('auto')
    setPermissionLevel('autonomous')
  }

  function applyTemplate(t: MissionTemplate) {
    setName(t.name)
    setInstruction(t.instruction)
    setScheduleType(t.schedule_type)
    setCronExpression(t.cron_expression ?? '')
    setExecutionMode(t.execution_mode)
    setPermissionLevel(t.permission_level)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // If the name matches a template, include its tags
    const matchedTemplate = MISSION_TEMPLATES.find((t) => t.name === name)
    const result = await create({
      workspace_id: workspaceId,
      name,
      instruction,
      schedule_type: scheduleType,
      ...(scheduleType === 'custom_cron' ? { cron_expression: cronExpression } : {}),
      execution_mode: executionMode,
      permission_level: permissionLevel,
      ...(matchedTemplate?.tags?.length ? { tags: matchedTemplate.tags } : {}),
    })

    if (result) {
      reset()
      onCreated()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-lg mx-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-sm font-semibold text-[var(--text)]">New Scheduled Mission</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Templates */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Start from a template</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {MISSION_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={cn(
                        'px-3 py-2 rounded-[var(--radius)] border text-left transition-colors',
                        name === t.name
                          ? 'border-[var(--primary)] bg-[var(--primary-muted)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]',
                      )}
                    >
                      <p className="text-xs font-semibold text-[var(--text)]">{t.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)]" />

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={200}
                  placeholder="e.g. Morning AI Briefing"
                  className="w-full px-3 py-2 text-sm rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Instruction */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Instruction</label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  required
                  maxLength={10000}
                  rows={4}
                  placeholder="What should Agent MOE do each time this runs?"
                  className="w-full px-3 py-2 text-sm rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              {/* Schedule type */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Schedule</label>
                <div className="flex flex-wrap gap-1.5">
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setScheduleType(opt.value)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-pill)] border transition-colors',
                        scheduleType === opt.value
                          ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cron expression (only if custom) */}
              {scheduleType === 'custom_cron' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Cron Expression</label>
                  <input
                    type="text"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    placeholder="0 7 * * *"
                    className="w-full px-3 py-2 text-sm font-mono rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
              )}

              {/* Execution mode */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Model</label>
                <div className="grid grid-cols-3 gap-2">
                  {MODE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExecutionMode(opt.value)}
                      className={cn(
                        'px-3 py-2 rounded-[var(--radius)] border text-left transition-colors',
                        executionMode === opt.value
                          ? 'border-[var(--primary)] bg-[var(--primary-muted)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]',
                      )}
                    >
                      <p className="text-xs font-semibold text-[var(--text)]">{opt.label}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission level */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Permission</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPermissionLevel(opt.value)}
                      className={cn(
                        'px-3 py-2 rounded-[var(--radius)] border text-left transition-colors',
                        permissionLevel === opt.value
                          ? 'border-[var(--primary)] bg-[var(--primary-muted)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]',
                      )}
                    >
                      <p className="text-xs font-semibold text-[var(--text)]">{opt.label}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-[var(--danger)]">{error}</p>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating || !name || !instruction}>
                  {creating ? 'Creating...' : 'Create Mission'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
