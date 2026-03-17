'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Inbox,
  Plus,
  Youtube,
  Clock,
  Layers,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { useVideoPackages } from '../hooks/use-video-packages'
import type { VideoPackageFilters } from '../hooks/use-video-packages'
import { VideoPackageCard } from './VideoPackageCard'
import { VideoPackageFilters as VideoPackageFiltersBar } from './VideoPackageFilters'
import { GenerateVideoPackageModal } from './GenerateVideoPackageModal'
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import { VideoFactoryTab } from '@/features/video-factory/components/VideoFactoryTab'

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-[var(--radius)] bg-[var(--skeleton)]', className)} />
  )
}

function PackageCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-0.5 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Error + empty states
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

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
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
        <h3 className="text-lg font-bold text-[var(--text)]">No video packages yet</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
          Generate your first video package to get AI-crafted hooks, scenes, and thumbnails.
        </p>
        <Button onClick={onGenerate} variant="accent" size="sm" className="gap-2 mt-1">
          <Plus size={14} />
          Generate Package
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick stat card
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
// Main Component
// ---------------------------------------------------------------------------

interface VideoPackagePageProps {
  workspaceId: string
}

const PAGE_SIZE = 12

export function VideoPackagePage({ workspaceId }: VideoPackagePageProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'packages' | 'factory'>('packages')
  const [filters, setFilters] = useState<VideoPackageFilters>({})
  const [page, setPage] = useState(1)

  const { packages, total, loading, error, refetch } = useVideoPackages(
    workspaceId,
    filters,
    page,
  )

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Derive quick stats from loaded packages
  const youtubeCount = packages.filter((p) => p.platform.toLowerCase() === 'youtube').length
  const tiktokCount = packages.filter((p) => p.platform.toLowerCase() === 'tiktok').length
  const reviewCount = packages.filter((p) => p.status === 'review').length

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* ── Tab bar + Actions ─────────────────────────────── */}
      <MotionFadeIn>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 p-1 rounded-[var(--radius-lg)] bg-[var(--surface-solid)] border border-[var(--border)]">
            <button
              onClick={() => setActiveTab('packages')}
              className={cn(
                'px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-all',
                activeTab === 'packages'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              Packages
            </button>
            <button
              onClick={() => setActiveTab('factory')}
              className={cn(
                'px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-all',
                activeTab === 'factory'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              Factory
            </button>
          </div>
          {activeTab === 'packages' && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="gap-2"
            >
              <Plus size={14} />
              Generate Package
            </Button>
          )}
        </div>
      </MotionFadeIn>

      {/* ── Factory tab ──────────────────────────────────── */}
      {activeTab === 'factory' && (
        <VideoFactoryTab workspaceId={workspaceId} />
      )}

      {/* ── Error ───────────────────────────────────────── */}
      {activeTab === 'packages' && error && <ErrorAlert message={error} onRetry={refetch} />}

      {/* ── Quick stats ─────────────────────────────────── */}
      {activeTab === 'packages' && <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MotionStaggerItem><QuickStat label="Total Packages" value={total} icon={Layers} /></MotionStaggerItem>
        <MotionStaggerItem><QuickStat label="YouTube" value={youtubeCount} icon={Youtube} /></MotionStaggerItem>
        <MotionStaggerItem><QuickStat label="TikTok" value={tiktokCount} icon={Activity} /></MotionStaggerItem>
        <MotionStaggerItem><QuickStat label="Pending Review" value={reviewCount} icon={Clock} /></MotionStaggerItem>
      </MotionStagger>}

      {/* ── Filters ─────────────────────────────────────── */}
      {activeTab === 'packages' && <MotionFadeIn delay={0.05}>
        <Card>
          <CardContent className="py-4 px-4">
            <VideoPackageFiltersBar
              filters={filters}
              onChange={(f) => {
                setFilters(f)
                setPage(1)
              }}
            />
          </CardContent>
        </Card>
      </MotionFadeIn>}

      {/* ── Grid ────────────────────────────────────────── */}
      {activeTab === 'packages' && (loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <PackageCardSkeleton key={i} />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <EmptyState onGenerate={() => setModalOpen(true)} />
      ) : (
        <MotionStagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <MotionStaggerItem key={pkg.id}>
              <VideoPackageCard
                pkg={pkg}
                onClick={() => router.push(`/video/${pkg.id}`)}
              />
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      ))}

      {/* ── Pagination ──────────────────────────────────── */}
      {activeTab === 'packages' && !loading && packages.length > 0 && total > PAGE_SIZE && (
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

      {/* ── Modal ───────────────────────────────────────── */}
      <GenerateVideoPackageModal
        workspaceId={workspaceId}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
