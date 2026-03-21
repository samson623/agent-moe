'use client'

import { useState } from 'react'
import {
  X,
  ChevronRight,
  Play,
  Pause,
  Zap,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Pill } from '@/components/nebula'
import { useDetail } from '../hooks/use-detail'
import { RunHistoryPanel } from './RunHistoryPanel'

interface MissionDetailPanelProps {
  missionId: string
  onClose: () => void
  onDeleted: () => void
}

type DetailTab = 'overview' | 'runs'

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'runs', label: 'Run History' },
]

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function MissionDetailPanel({ missionId, onClose, onDeleted }: MissionDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const { mission, loading, error, toggle, runNow, remove } = useDetail(missionId)

  async function handleDelete() {
    if (!mission) return
    if (!confirm(`Delete mission "${mission.name}"? This cannot be undone.`)) return
    try {
      await remove()
      onDeleted()
    } catch {
      // error shown inline
    }
  }

  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)]">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
          {loading ? (
            <div className="h-4 w-40 bg-[var(--surface-elevated)] rounded animate-pulse" />
          ) : mission ? (
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--text)] truncate max-w-[200px]">
                {mission.name}
              </h3>
              <Pill tone={mission.is_active ? 'success' : 'muted'}>
                {mission.is_active ? 'Active' : 'Paused'}
              </Pill>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {mission && (
            <>
              <button
                type="button"
                onClick={() => void runNow()}
                className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-elevated)] transition-colors"
                aria-label="Run now"
                title="Run now"
              >
                <Zap size={13} />
              </button>
              <button
                type="button"
                onClick={() => void toggle()}
                className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] transition-colors"
                aria-label={mission.is_active ? 'Pause' : 'Activate'}
                title={mission.is_active ? 'Pause' : 'Activate'}
              >
                {mission.is_active ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-elevated)] transition-colors"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-[var(--border-subtle)] px-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-2.5 text-xs font-medium transition-colors duration-100',
              'border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-[var(--text)] border-[var(--primary)]'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="animate-pulse space-y-3 p-5">
            <div className="h-4 w-3/4 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-5/6 bg-[var(--surface-elevated)] rounded" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2.5 text-[var(--danger)] p-5">
            <AlertCircle size={15} className="shrink-0" />
            <p className="text-xs">{error}</p>
          </div>
        ) : !mission ? null : (
          <>
            {activeTab === 'overview' && <OverviewContent mission={mission} />}
            {activeTab === 'runs' && <RunHistoryPanel missionId={mission.id} />}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview tab content
// ---------------------------------------------------------------------------

function OverviewContent({ mission }: { mission: import('../types').ScheduledMission }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Schedule', value: mission.schedule_type },
    { label: 'Cron', value: mission.cron_expression ?? '—' },
    { label: 'Timezone', value: mission.timezone },
    { label: 'Model', value: mission.execution_mode },
    { label: 'Permission', value: mission.permission_level },
    { label: 'Operator Team', value: mission.operator_team ?? '—' },
    { label: 'Runs', value: String(mission.run_count) },
    { label: 'Failures', value: `${mission.consecutive_failures} / ${mission.max_consecutive_failures}` },
    { label: 'Next Run', value: formatDate(mission.next_run_at) },
    { label: 'Last Run', value: formatDate(mission.last_run_at) },
    { label: 'Created', value: formatDate(mission.created_at) },
  ]

  return (
    <div className="p-5 space-y-4">
      {/* Instruction */}
      <div>
        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Instruction</p>
        <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
          {mission.instruction}
        </p>
      </div>

      {/* Tags */}
      {mission.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mission.tags.map((tag) => (
            <Pill key={tag} tone="default">{tag}</Pill>
          ))}
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-[10px] text-[var(--text-muted)]">{row.label}</p>
            <p className="text-xs text-[var(--text)] font-medium">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
