'use client'

import { useState, useEffect, useCallback } from 'react'
import { Radar, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SignalFilters } from './SignalFilters'
import { SignalCard } from './SignalCard'
import { OpportunityBoard } from './OpportunityBoard'
import { MarketAnglesPanel } from './MarketAnglesPanel'
import { TopicScorer } from './TopicScorer'
import { TrendScanModal } from './TrendScanModal'
import { useRealtimeSignals } from '../hooks/use-realtime-signals'
import type { TrendSignal } from '../types'

interface GrowthEnginePageProps {
  workspaceId: string;
}

const LIMIT = 12

function StatCard({
  label,
  value,
  color,
  pulse,
}: {
  label: string;
  value: string | number;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-4 overflow-hidden">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
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

function SkeletonSignalCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-4 animate-pulse space-y-3">
      <div className="h-4 bg-[var(--border)] rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-2 bg-[var(--border)] rounded" />
        <div className="h-2 bg-[var(--border)] rounded" />
        <div className="h-2 bg-[var(--border)] rounded" />
      </div>
      <div className="h-3 bg-[var(--border)] rounded w-1/2" />
    </div>
  )
}

export function GrowthEnginePage({ workspaceId }: GrowthEnginePageProps) {
  // Filter state
  const [momentum, setMomentum] = useState('all')
  const [category, setCategory] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [minScore, setMinScore] = useState(0)
  const [page, setPage] = useState(1)

  // UI state
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null)

  // Data state
  const [signals, setSignals] = useState<TrendSignal[]>([])
  const [total, setTotal] = useState(0)
  const [opportunities, setOpportunities] = useState<TrendSignal[]>([])
  const [allSignals, setAllSignals] = useState<TrendSignal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOppLoading, setIsOppLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [momentum, category, platform, minScore])

  // Load signals (filtered grid)
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
          sort: 'opportunity',
        })
        if (momentum !== 'all') params.set('momentum', momentum)
        if (category !== 'all') params.set('category', category)
        if (platform !== 'all') params.set('platform', platform)
        if (minScore > 0) params.set('min_score', String(minScore))

        const res = await fetch(`/api/trend-signals?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error()
        const json = await res.json() as { data?: TrendSignal[]; count?: number }
        setSignals(json.data ?? [])
        setTotal(json.count ?? 0)
      } catch {
        // silently handle abort
      } finally {
        setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [workspaceId, momentum, category, platform, minScore, page, tick])

  // Load opportunities + all signals for stats/angles
  useEffect(() => {
    if (!workspaceId) return
    const controller = new AbortController()

    async function load() {
      setIsOppLoading(true)
      try {
        const [oppRes, allRes] = await Promise.all([
          fetch(`/api/trend-signals?workspace_id=${workspaceId}&limit=10&sort=opportunity`, { signal: controller.signal }),
          fetch(`/api/trend-signals?workspace_id=${workspaceId}&limit=100&sort=opportunity`, { signal: controller.signal }),
        ])
        if (oppRes.ok) {
          const json = await oppRes.json() as { data?: TrendSignal[] }
          setOpportunities(json.data ?? [])
        }
        if (allRes.ok) {
          const json = await allRes.json() as { data?: TrendSignal[] }
          setAllSignals(json.data ?? [])
        }
      } catch {
        // silently handle abort
      } finally {
        setIsOppLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [workspaceId, tick])

  // Realtime: prepend new signals
  useRealtimeSignals({
    workspaceId,
    onInsert: (signal) => {
      setSignals((prev) => [signal, ...prev].slice(0, LIMIT))
      setAllSignals((prev) => [signal, ...prev])
    },
    onUpdate: (signal) => {
      setSignals((prev) => prev.map((s) => s.id === signal.id ? signal : s))
      setAllSignals((prev) => prev.map((s) => s.id === signal.id ? signal : s))
    },
    onDelete: (id) => {
      setSignals((prev) => prev.filter((s) => s.id !== id))
      setAllSignals((prev) => prev.filter((s) => s.id !== id))
    },
  })

  // Stats
  const hotCount = allSignals.filter((s) => s.momentum === 'explosive' || s.momentum === 'rising').length
  const topOpp = Math.max(0, ...allSignals.map((s) => s.opportunity_score))
  const avgFit = allSignals.length > 0
    ? Math.round((allSignals.reduce((sum, s) => sum + s.audience_fit, 0) / allSignals.length) * 100)
    : 0

  const activeFilterCount = [
    momentum !== 'all',
    category !== 'all',
    platform !== 'all',
    minScore > 0,
  ].filter(Boolean).length

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Actions row */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={refresh}
          className="p-2 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] transition-colors"
          title="Refresh signals"
        >
          <RefreshCw size={14} />
        </button>
        <Button
          onClick={() => setScanModalOpen(true)}
          variant="accent"
          size="sm"
          className="gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          <Radar size={14} />
          Launch Scan
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Signals" value={allSignals.length} color="#6366f1" />
        <StatCard label="Rising / Explosive" value={hotCount} color="#10b981" pulse={hotCount > 0} />
        <StatCard label="Top Opportunity" value={topOpp || '—'} color="#f59e0b" />
        <StatCard label="Avg Audience Fit" value={allSignals.length > 0 ? `${avgFit}%` : '—'} color="#3b82f6" />
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Left: Filters + Signal Grid */}
        <div className="lg:col-span-2 space-y-4">
          <SignalFilters
            momentum={momentum}
            category={category}
            platform={platform}
            minScore={minScore}
            onMomentumChange={(v) => setMomentum(v)}
            onCategoryChange={(v) => setCategory(v)}
            onPlatformChange={(v) => setPlatform(v)}
            onMinScoreChange={(v) => setMinScore(v)}
            activeCount={activeFilterCount}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonSignalCard key={i} />)}
            </div>
          ) : signals.length === 0 ? (
            <div
              className={cn(
                'relative rounded-[var(--radius-xl)] border border-[var(--border)]',
                'bg-[var(--surface-solid)] p-12 text-center overflow-hidden'
              )}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 70%)' }}
                aria-hidden="true"
              />
              <div className="relative flex flex-col items-center gap-3">
                <Radar size={32} className="text-[var(--text-muted)] opacity-40" />
                <p className="text-sm text-[var(--text-muted)]">
                  {activeFilterCount > 0
                    ? 'No signals match your filters'
                    : 'Run your first scan to populate the signal board'}
                </p>
                {activeFilterCount === 0 && (
                  <Button
                    onClick={() => setScanModalOpen(true)}
                    variant="accent"
                    size="sm"
                    className="mt-2"
                  >
                    Launch Scan
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {signals.map((signal) => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    selected={selectedSignal === signal.id}
                    onClick={() => setSelectedSignal((prev) => prev === signal.id ? null : signal.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
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
                    Page {page} of {totalPages} · {total} signal{total !== 1 ? 's' : ''}
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
        </div>

        {/* Right: Opportunity Board + Market Angles */}
        <div className="space-y-4">
          <OpportunityBoard
            signals={opportunities}
            isLoading={isOppLoading}
            onSignalClick={(s) => setSelectedSignal((prev) => prev === s.id ? null : s.id)}
          />
          <MarketAnglesPanel signals={allSignals} isLoading={isOppLoading} />
        </div>
      </div>

      {/* Bottom: Topic Scorer */}
      <TopicScorer workspaceId={workspaceId} onScanQueued={refresh} />

      {/* Scan Modal */}
      <TrendScanModal
        workspaceId={workspaceId}
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScanComplete={refresh}
      />
    </div>
  )
}
