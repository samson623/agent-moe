'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  MessageSquare,
  Film,
  Quote,
  MousePointerClick,
  Image,
  Video,
  LayoutGrid,
  RefreshCw,
  AlertTriangle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  FileBarChart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GlassCard, StatCard, SectionHeader, StatusBadge, EmptyState, PageWrapper } from '@/components/nebula'
import { MotionStagger, MotionStaggerItem, MotionFadeIn } from '@/components/nebula/motion'
import type { Asset } from '@/lib/supabase/types'
import { useAssets } from '../hooks/use-assets'
import { useBulkActions } from '../hooks/use-bulk-actions'
import { AssetCard } from './AssetCard'
import { AssetFilters } from './AssetFilters'
import { BulkActionBar } from './BulkActionBar'
import { ContentPreviewPanel } from './ContentPreviewPanel'

// ---------------------------------------------------------------------------
// Content type tab config
// ---------------------------------------------------------------------------

interface ContentTab {
  value: string
  label: string
  icon: LucideIcon
  color: string
}

const CONTENT_TABS: ContentTab[] = [
  { value: '', label: 'All', icon: Layers, color: 'var(--text-secondary)' },
  { value: 'post', label: 'Posts', icon: FileText, color: '#3b82f6' },
  { value: 'thread', label: 'Threads', icon: MessageSquare, color: '#8b5cf6' },
  { value: 'script', label: 'Scripts', icon: Film, color: '#f59e0b' },
  { value: 'caption', label: 'Captions', icon: Quote, color: '#10b981' },
  { value: 'cta', label: 'CTAs', icon: MousePointerClick, color: '#ef4444' },
  { value: 'video_concept', label: 'Video Concepts', icon: Video, color: '#f97316' },
  { value: 'thumbnail_concept', label: 'Thumbnails', icon: Image, color: '#ec4899' },
  { value: 'carousel', label: 'Carousels', icon: LayoutGrid, color: '#06b6d4' },
]

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius)] bg-[var(--skeleton)]',
        className,
      )}
    />
  )
}

function AssetCardSkeleton() {
  return (
    <GlassCard hover={false} padding="none">
      <Skeleton className="h-0.5 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-5 h-5 rounded-[3px]" />
          <Skeleton className="w-7 h-7 rounded-[var(--radius-sm)]" />
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full ml-auto" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-8 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Error alert
// ---------------------------------------------------------------------------

function ErrorAlert({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/10 text-red-400">
      <AlertTriangle size={18} className="shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function ContentStudioPage({ workspaceId }: { workspaceId: string }) {
  const [activeType, setActiveType] = useState<string>('')
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)

  const {
    assets,
    loading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    totalCount,
    pageCount,
    refresh,
  } = useAssets(workspaceId)

  const {
    selectedIds,
    toggleSelect,
    clearSelection,
    executeBulkAction,
    loading: bulkLoading,
    error: bulkError,
  } = useBulkActions()

  const isLive = !!workspaceId

  const handleTypeChange = (typeValue: string) => {
    setActiveType(typeValue)
    setFilters({ ...filters, type: typeValue || undefined })
  }

  const handleAssetClick = (id: string) => {
    const asset = assets.find((a) => a.id === id)
    if (asset) {
      setPreviewAsset((prev) => (prev?.id === id ? null : asset))
    }
  }


  // Derive quick stats from current data
  const statusCounts = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* ── Header ──────────────────────────────────── */}
        <MotionFadeIn>
          <SectionHeader
            title="Content Studio"
            description="Manage and review all AI-generated content assets"
            action={
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={isLive ? 'Live' : 'No Workspace'}
                  variant={isLive ? 'success' : 'warning'}
                  pulse={isLive}
                />
                <Button variant="ghost" size="icon-sm" onClick={refresh} title="Refresh">
                  <RefreshCw size={14} />
                </Button>
              </div>
            }
          />
        </MotionFadeIn>

        {/* ── Errors ──────────────────────────────────── */}
        {error && <ErrorAlert message={error} onRetry={refresh} />}
        {bulkError && <ErrorAlert message={bulkError} onRetry={() => {}} />}

        {/* ── Content type tabs ───────────────────────── */}
        <MotionFadeIn delay={0.05}>
          <div className="flex items-center gap-2 flex-wrap">
            {CONTENT_TABS.map((tab) => {
              const isActive = activeType === tab.value
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.value || '__all'}
                  onClick={() => handleTypeChange(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'text-white shadow-[0_0_14px_rgba(59,130,246,0.3)]'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text)]',
                  )}
                  style={isActive ? { background: tab.value ? tab.color : 'var(--primary)' } : undefined}
                >
                  <TabIcon size={13} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </MotionFadeIn>

        {/* ── Filter bar ──────────────────────────────── */}
        <MotionFadeIn delay={0.1}>
          <GlassCard padding="sm">
            <AssetFilters
              filters={filters}
              onFiltersChange={setFilters}
              assetCount={totalCount}
            />
          </GlassCard>
        </MotionFadeIn>

        {/* ── Quick stats row ─────────────────────────── */}
        <MotionFadeIn delay={0.15}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="Total Assets" value={totalCount.toLocaleString()} icon={Layers} tone="primary" loading={loading} />
            <StatCard label="Drafts" value={(statusCounts['draft'] ?? 0).toLocaleString()} icon={FileBarChart} tone="default" loading={loading} />
            <StatCard label="In Review" value={(statusCounts['review'] ?? 0).toLocaleString()} icon={Clock} tone="warning" loading={loading} />
            <StatCard label="Approved" value={(statusCounts['approved'] ?? 0).toLocaleString()} icon={CheckCircle2} tone="success" loading={loading} />
            <StatCard label="Published" value={(statusCounts['published'] ?? 0).toLocaleString()} icon={Activity} tone="accent" loading={loading} />
          </div>
        </MotionFadeIn>

        {/* ── Asset grid + preview ─────────────────────── */}
        <div className={cn('grid gap-6', previewAsset ? 'xl:grid-cols-[1fr_380px]' : '')}>
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <AssetCardSkeleton key={i} />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No assets yet"
                description="Assets created by operator teams will appear here. Submit a mission to generate content."
              />
            ) : (
              <MotionStagger className={cn(
                'grid gap-5',
                previewAsset
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
              )}>
                {assets.map((asset) => (
                  <MotionStaggerItem key={asset.id}>
                    <AssetCard
                      asset={asset}
                      isSelected={selectedIds.has(asset.id)}
                      onSelect={toggleSelect}
                      onClick={handleAssetClick}
                    />
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            )}
          </div>

          {/* Preview panel */}
          {previewAsset && (
            <div className="hidden xl:block">
              <div className="sticky top-20">
                <ContentPreviewPanel
                  asset={previewAsset}
                  onClose={() => setPreviewAsset(null)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Pagination ──────────────────────────────── */}
        {!loading && assets.length > 0 && (
          <MotionFadeIn delay={0.1}>
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="gap-1"
              >
                <ChevronLeft size={14} />
                Previous
              </Button>
              <span className="text-sm text-[var(--text-muted)] tabular-nums">
                Page {page} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          </MotionFadeIn>
        )}

        {/* ── Bulk action bar ─────────────────────────── */}
        <BulkActionBar
          selectionCount={selectedIds.size}
          onAction={async (action) => {
            const ok = await executeBulkAction(action, workspaceId)
            if (ok) refresh()
          }}
          onClear={clearSelection}
          loading={bulkLoading}
        />
      </div>
    </PageWrapper>
  )
}
