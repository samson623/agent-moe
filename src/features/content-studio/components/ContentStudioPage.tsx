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
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAssets } from '../hooks/use-assets'
import { useBulkActions } from '../hooks/use-bulk-actions'
import { AssetCard } from './AssetCard'
import { AssetFilters } from './AssetFilters'
import { BulkActionBar } from './BulkActionBar'

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
    <Card className="overflow-hidden">
      <Skeleton className="h-0.5 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
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
      </CardContent>
    </Card>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)]"
        >
          <Skeleton className="w-4 h-4 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
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
// Quick stat
// ---------------------------------------------------------------------------

function QuickStat({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-[var(--radius-lg)]',
        'border border-[var(--border)] bg-[var(--surface-solid)]',
      )}
    >
      <Icon size={14} className="text-[var(--primary)] shrink-0" />
      <div>
        <p className="text-base font-bold text-[var(--text)] leading-none tabular-nums">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border)]',
        'bg-[var(--surface-solid)] p-16 text-center overflow-hidden',
      )}
    >
      <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, var(--primary) 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-3">
        <Inbox size={36} className="text-[var(--text-disabled)]" />
        <h3 className="text-lg font-bold text-[var(--text)]">No assets yet</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
          Assets created by operator teams will appear here. Submit a mission to generate content.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function ContentStudioPage({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [activeType, setActiveType] = useState<string>('')

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
    router.push(`/content/${id}`)
  }

  // Derive quick stats from current data
  const statusCounts = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2">
        <Badge variant={isLive ? 'success' : 'warning'}>
          {isLive ? 'Live' : 'No Workspace'}
        </Badge>
        <Button variant="ghost" size="icon-sm" onClick={refresh} title="Refresh">
          <RefreshCw size={14} />
        </Button>
      </div>

      {/* ── Errors ──────────────────────────────────── */}
      {error && <ErrorAlert message={error} onRetry={refresh} />}
      {bulkError && <ErrorAlert message={bulkError} onRetry={() => {}} />}

      {/* ── Content type tabs ───────────────────────── */}
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

      {/* ── Filter bar ──────────────────────────────── */}
      <Card>
        <CardContent className="py-4 px-4">
          <AssetFilters
            filters={filters}
            onFiltersChange={setFilters}
            assetCount={totalCount}
          />
        </CardContent>
      </Card>

      {/* ── Quick stats row ─────────────────────────── */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <QuickStat label="Total Assets" value={totalCount} icon={Layers} />
          <QuickStat label="Drafts" value={statusCounts['draft'] ?? 0} icon={FileBarChart} />
          <QuickStat label="In Review" value={statusCounts['review'] ?? 0} icon={Clock} />
          <QuickStat label="Approved" value={statusCounts['approved'] ?? 0} icon={CheckCircle2} />
          <QuickStat label="Published" value={statusCounts['published'] ?? 0} icon={Activity} />
        </div>
      )}

      {/* ── Asset grid ──────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <AssetCardSkeleton key={i} />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isSelected={selectedIds.has(asset.id)}
              onSelect={toggleSelect}
              onClick={handleAssetClick}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────── */}
      {!loading && assets.length > 0 && (
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
  )
}
