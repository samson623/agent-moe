'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Copy, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MotionFadeIn } from '@/components/nebula/motion'
import { useVideoPackageDetail } from '../hooks/use-video-package-detail'
import { VideoHookDisplay } from './VideoHookDisplay'
import { SceneBreakdown } from './SceneBreakdown'
import { ThumbnailConceptCard } from './ThumbnailConceptCard'
import { SceneVisualsPanel } from './SceneVisualsPanel'
import { RenderVideoPanel } from '@/features/video-rendering/components/RenderVideoPanel'

// ---------------------------------------------------------------------------
// Config maps (same as card)
// ---------------------------------------------------------------------------

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ef4444',
  tiktok: '#ec4899',
  instagram: '#a855f7',
  x: '#a1a1aa',
}

type StatusVariant = 'muted' | 'warning' | 'success' | 'accent' | 'outline'

const STATUS_VARIANT: Record<string, StatusVariant> = {
  draft: 'muted',
  review: 'warning',
  approved: 'success',
  published: 'accent',
  archived: 'outline',
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-[var(--radius)] bg-[var(--skeleton)]', className)} />
  )
}

function DetailSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3 py-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'scenes' | 'thumbnail' | 'export'

const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'scenes', label: 'Scenes' },
  { value: 'thumbnail', label: 'Thumbnail' },
  { value: 'export', label: 'Export' },
]

// ---------------------------------------------------------------------------
// CTA Display
// ---------------------------------------------------------------------------

function CTADisplay({ cta }: { cta: NonNullable<ReturnType<typeof useVideoPackageDetail>['pkg']>['cta'] }) {
  if (!cta) return null

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
        Call to Action
      </p>
      <div
        className={cn(
          'p-4 rounded-[var(--radius-lg)]',
          'bg-[var(--surface-elevated)] border border-[var(--border)]',
        )}
      >
        <div className="flex items-start gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">{cta.text}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="muted" className="text-xs capitalize">
                {cta.type.replace(/_/g, ' ')}
              </Badge>
              {cta.destination && (
                <span className="text-xs md:text-sm text-[var(--text-muted)] truncate max-w-[200px]">
                  {cta.destination}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Export tab content
// ---------------------------------------------------------------------------

function ExportContent({
  pkg,
}: {
  pkg: NonNullable<ReturnType<typeof useVideoPackageDetail>['pkg']>
}) {
  const [copied, setCopied] = useState(false)

  const exportText = [
    `VIDEO PACKAGE: ${pkg.title}`,
    `Platform: ${pkg.platform} | Status: ${pkg.status}`,
    '',
    '=== PRIMARY HOOK ===',
    pkg.hook.primary,
    '',
    pkg.hook.variants.length > 0
      ? ['=== HOOK VARIANTS ===', ...pkg.hook.variants.map((v, i) => `${i + 1}. ${v}`)].join('\n')
      : '',
    '',
    '=== SCENES ===',
    ...[...pkg.scenes]
      .sort((a, b) => a.order - b.order)
      .map(
        (s) =>
          `Scene ${s.order}: ${s.title} (${s.duration_seconds}s)\n` +
          `Script: ${s.script}\n` +
          `Visual: ${s.visual_direction}`,
      ),
    '',
    '=== THUMBNAIL CONCEPT ===',
    `Headline: ${pkg.thumbnail_concept.headline}`,
    `Visual: ${pkg.thumbnail_concept.visual_description}`,
    `Colors: ${pkg.thumbnail_concept.color_scheme}`,
    `Overlay: ${pkg.thumbnail_concept.text_overlay}`,
    '',
    pkg.caption ? `=== CAPTION ===\n${pkg.caption}` : '',
    pkg.cta ? `\n=== CTA ===\n${pkg.cta.text} (${pkg.cta.type})${pkg.cta.destination ? ` → ${pkg.cta.destination}` : ''}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--text-secondary)]">All content as plain text</p>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check size={13} className="text-[var(--success)]" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy All'}
        </Button>
      </div>
      <textarea
        readOnly
        value={exportText}
        rows={24}
        className={cn(
          'w-full px-4 py-3 rounded-[var(--radius-lg)] text-xs font-mono resize-none',
          'bg-[var(--surface-elevated)] border border-[var(--border)]',
          'text-[var(--text-secondary)] leading-relaxed',
          'focus:outline-none focus:border-[var(--primary)]',
        )}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface VideoPackageDetailPageProps {
  id: string
  workspaceId: string
}

export function VideoPackageDetailPage({ id, workspaceId }: VideoPackageDetailPageProps) {
  const router = useRouter()
  const { pkg, loading, error, refresh, remove } = useVideoPackageDetail(id, workspaceId)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this video package? This cannot be undone.')) return
    setDeleting(true)
    const ok = await remove()
    setDeleting(false)
    if (ok) router.push('/video')
  }

  if (loading) return <DetailSkeleton />

  if (error === 'not_found' || !pkg) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div
          className={cn(
            'flex flex-col items-center gap-4 py-20 text-center',
            'rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]',
          )}
        >
          <AlertTriangle size={36} className="text-[var(--warning)]" />
          <h2 className="text-lg font-bold text-[var(--text)]">Package not found</h2>
          <p className="text-sm text-[var(--text-muted)]">
            This video package does not exist or has been deleted.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push('/video')}>
            Back to Video Studio
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/10 text-red-400">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm flex-1">{error}</p>
        </div>
      </div>
    )
  }

  const platformColor = PLATFORM_COLORS[pkg.platform.toLowerCase()] ?? 'var(--text-muted)'
  const statusVariant = STATUS_VARIANT[pkg.status] ?? 'muted'

  return (
    <MotionFadeIn className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ── Back button ─────────────────────────────────── */}
      <button
        type="button"
        onClick={() => router.push('/video')}
        className={cn(
          'flex items-center gap-1.5 text-sm text-[var(--text-muted)]',
          'hover:text-[var(--text)] transition-colors duration-150',
        )}
      >
        <ArrowLeft size={14} />
        Video Studio
      </button>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text)] leading-tight truncate">
            {pkg.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{
                color: platformColor,
                background: `${platformColor}18`,
              }}
            >
              {pkg.platform}
            </span>
            <Badge variant={statusVariant} className="capitalize">
              {pkg.status}
            </Badge>
            {pkg.confidence_score !== null && (
              <span className="text-xs text-[var(--text-muted)] tabular-nums">
                {(pkg.confidence_score * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="gap-2 shrink-0"
        >
          <Trash2 size={14} />
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-all duration-150 -mb-px',
              'border-b-2',
              activeTab === tab.value
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────── */}
      <div>
        {/* Overview: Hook + CTA */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <VideoHookDisplay hook={pkg.hook} />
            {pkg.cta && <CTADisplay cta={pkg.cta} />}
          </div>
        )}

        {/* Scenes */}
        {activeTab === 'scenes' && (
          <div className="space-y-6">
            <SceneVisualsPanel pkg={pkg} workspaceId={workspaceId} onRefresh={refresh} />
            <SceneBreakdown scenes={pkg.scenes} />
          </div>
        )}

        {/* Thumbnail */}
        {activeTab === 'thumbnail' && (
          <div className="space-y-4">
            <ThumbnailConceptCard concept={pkg.thumbnail_concept} />
            {pkg.caption && (
              <Card>
                <CardContent className="py-4 space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                    Caption
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {pkg.caption}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Export */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <RenderVideoPanel
              videoPackageId={pkg.id}
              workspaceId={workspaceId}
              platform={pkg.platform}
              sceneDurations={pkg.scenes.map((s) => s.duration_seconds)}
              metadata={pkg.metadata}
            />
            <ExportContent pkg={pkg} />
          </div>
        )}
      </div>
    </MotionFadeIn>
  )
}
