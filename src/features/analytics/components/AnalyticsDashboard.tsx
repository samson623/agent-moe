'use client'

import { useState } from 'react'
import { BarChart2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeRange } from '@/features/analytics/types'
import {
  useAnalyticsStats,
  useAnalyticsEvents,
  useMissionPerformance,
  useContentPerformance,
  useOperatorStats,
  useFeedbackInsights,
} from '@/features/analytics/hooks'

import { TimeRangeSelector } from './TimeRangeSelector'
import { StatsOverview } from './StatsOverview'
import { OperatorLeaderboard } from './OperatorLeaderboard'
import { FeedbackInsightsPanel } from './FeedbackInsightsPanel'
import { EventFeed } from './EventFeed'
import { MissionPerformancePanel } from './MissionPerformancePanel'
import { ContentPerformancePanel } from './ContentPerformancePanel'

type Tab = 'overview' | 'missions' | 'content'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'missions', label: 'Mission Intel' },
  { id: 'content', label: 'Content Studio' },
]

interface AnalyticsDashboardProps {
  workspaceId: string
}

export function AnalyticsDashboard({ workspaceId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [eventsOffset, setEventsOffset] = useState(0)

  // Hooks
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useAnalyticsStats(
    workspaceId,
    timeRange,
  )
  const { events, isLoading: eventsLoading, refresh: refreshEvents } = useAnalyticsEvents(
    workspaceId,
    { limit: eventsOffset + 20, offset: 0 },
  )
  const { data: missionData, isLoading: missionsLoading } = useMissionPerformance(
    workspaceId,
    timeRange,
  )
  const { data: contentData, isLoading: contentLoading } = useContentPerformance(
    workspaceId,
    timeRange,
  )
  const { data: operatorData, isLoading: operatorsLoading } = useOperatorStats(
    workspaceId,
    timeRange,
  )
  const {
    insights,
    isLoading: insightsLoading,
    generate: generateInsights,
  } = useFeedbackInsights(workspaceId)

  function handleLoadMoreEvents() {
    setEventsOffset((prev) => prev + 20)
  }

  function handleRefresh() {
    refreshStats()
    refreshEvents()
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-0">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-lg)] shrink-0"
            style={{
              backgroundColor: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
            aria-hidden="true"
          >
            <BarChart2 size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text)] leading-none">Analytics</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              System-wide performance across all operators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-[var(--radius)] transition-colors duration-150',
              'border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)]',
              'text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
            aria-label="Refresh analytics"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Stats overview — full width */}
      <StatsOverview stats={stats?.system ?? null} isLoading={statsLoading} />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[var(--border)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors duration-150',
                'border-b-2 -mb-px',
                isActive
                  ? 'border-[var(--primary)] text-[var(--text)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5">
          {/* Leaderboard + Insights side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <OperatorLeaderboard data={operatorData} isLoading={operatorsLoading} />
            </div>
            <div className="lg:col-span-1">
              <FeedbackInsightsPanel
                insights={insights}
                isLoading={insightsLoading}
                onGenerate={generateInsights}
                workspaceId={workspaceId}
              />
            </div>
          </div>

          {/* Event feed — full width */}
          <EventFeed
            events={events}
            isLoading={eventsLoading}
            onLoadMore={events.length >= eventsOffset + 20 ? handleLoadMoreEvents : undefined}
          />
        </div>
      )}

      {activeTab === 'missions' && (
        <MissionPerformancePanel data={missionData} isLoading={missionsLoading} />
      )}

      {activeTab === 'content' && (
        <ContentPerformancePanel data={contentData} isLoading={contentLoading} />
      )}
    </div>
  )
}
