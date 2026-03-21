'use client'

import { useState, useCallback } from 'react'
import { Clock, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageWrapper, SectionHeader, EmptyState } from '@/components/nebula'
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import { useMissions } from '../hooks/use-missions'
import { useStats } from '../hooks/use-stats'
import { SchedulerStats } from './SchedulerStats'
import { MissionFilters, type ActiveFilter } from './MissionFilters'
import { MissionCard } from './MissionCard'
import { MissionDetailPanel } from './MissionDetailPanel'
import { CreateMissionModal } from './CreateMissionModal'

interface SchedulerPageProps {
  workspaceId: string
}

export function SchedulerPage({ workspaceId }: SchedulerPageProps) {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const isActiveFilter =
    activeFilter === 'all' ? undefined : activeFilter === 'active'

  const { missions, loading, error, refresh } = useMissions(workspaceId, {
    is_active: isActiveFilter,
  })
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats(workspaceId)

  const handleCreated = useCallback(() => {
    refresh()
    refreshStats()
  }, [refresh, refreshStats])

  const handleToggle = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/scheduler/${id}/toggle`, { method: 'POST' })
        refresh()
        refreshStats()
      } catch {
        // silent — card will still show stale state until next refresh
      }
    },
    [refresh, refreshStats],
  )

  const handleDeleted = useCallback(() => {
    setSelectedId(null)
    refresh()
    refreshStats()
  }, [refresh, refreshStats])

  return (
    <PageWrapper>
      {/* Header */}
      <MotionFadeIn>
        <SectionHeader
          title="Scheduler"
          description="Autonomous scheduled missions — runs every minute via Task Scheduler"
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              New Mission
            </Button>
          }
        />
      </MotionFadeIn>

      {/* Stats */}
      <div className="mt-6">
        <SchedulerStats stats={stats} loading={statsLoading} />
      </div>

      {/* Filters */}
      <div className="mt-6">
        <MissionFilters current={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* Content: list + detail */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Mission list */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-28 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2.5 text-[var(--danger)] py-8">
              <AlertCircle size={15} className="shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          ) : missions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No scheduled missions"
              description={
                activeFilter !== 'all'
                  ? 'No missions match this filter.'
                  : 'Create your first scheduled mission to automate tasks.'
              }
              action={
                activeFilter === 'all' ? (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus size={14} className="mr-1.5" />
                    Create Mission
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <MotionStagger className="space-y-3">
              {missions.map((m) => (
                <MotionStaggerItem key={m.id}>
                  <MissionCard
                    mission={m}
                    selected={selectedId === m.id}
                    onSelect={() => setSelectedId(m.id)}
                    onToggle={() => void handleToggle(m.id)}
                  />
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          )}
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div className="hidden lg:block sticky top-[72px] self-start">
            <MissionDetailPanel
              missionId={selectedId}
              onClose={() => setSelectedId(null)}
              onDeleted={handleDeleted}
            />
          </div>
        )}
      </div>

      {/* Create modal */}
      <CreateMissionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaceId={workspaceId}
        onCreated={handleCreated}
      />
    </PageWrapper>
  )
}
