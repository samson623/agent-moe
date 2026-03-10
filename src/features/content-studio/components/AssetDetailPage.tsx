'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AssetEditor } from './AssetEditor'
import { StatusManager } from './StatusManager'
import { PlatformSelector } from './PlatformSelector'
import { VersionHistory } from './VersionHistory'
import { useAssetDetail } from '../hooks/use-asset-detail'
import { useAssetVersions } from '../hooks/use-asset-versions'
import type { Asset, AssetType, AssetStatus } from '@/lib/supabase/types'
import Link from 'next/link'
import {
  Pencil,
  Copy,
  Trash2,
  ExternalLink,
  Clock,
  Calendar,
} from 'lucide-react'

interface AssetDetailPageProps {
  initialAsset: Asset
}

const TYPE_LABEL: Record<AssetType, string> = {
  post: 'Post',
  thread: 'Thread',
  script: 'Script',
  caption: 'Caption',
  cta: 'CTA',
  thumbnail_concept: 'Thumbnail',
  carousel: 'Carousel',
  video_concept: 'Video Concept',
  email: 'Email',
  report: 'Report',
}

const STATUS_VARIANT: Record<AssetStatus, 'muted' | 'warning' | 'success' | 'default' | 'danger'> = {
  draft: 'muted',
  review: 'warning',
  approved: 'success',
  published: 'default',
  rejected: 'danger',
  archived: 'muted',
}

const PLATFORM_LABEL: Record<string, string> = {
  x: 'X / Twitter',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  email: 'Email',
  universal: 'Universal',
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ConfidenceBar({ score }: { score: number | null }) {
  if (score === null) return null
  const pct = Math.round(score * 100)
  const color =
    pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">Confidence</span>
        <span className="text-xs font-medium tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function MetadataDisplay({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  )
  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
        Metadata
      </span>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-start justify-between gap-4 py-1.5 border-b border-[var(--border)] last:border-0"
          >
            <span className="text-xs text-[var(--text-muted)] shrink-0">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-[var(--text-secondary)] text-right break-all">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AssetDetailPage({ initialAsset }: AssetDetailPageProps) {
  const router = useRouter()
  const {
    asset,
    loading,
    error,
    isEditing,
    setIsEditing,
    updateBody,
    updateStatus,
    updatePlatform,
    duplicate,
    remove,
  } = useAssetDetail(initialAsset)

  const {
    versions,
    loading: versionsLoading,
    createVersion,
  } = useAssetVersions(asset.id)

  const [deleteConfirm, setDeleteConfirm] = useState(false)

  async function handleDuplicate() {
    const newAsset = await duplicate()
    if (newAsset) {
      router.push(`/content/${newAsset.id}`)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    const ok = await remove()
    if (ok) {
      router.push('/content')
    }
  }

  async function handleCreateVersion(body: string, title?: string) {
    await createVersion(body, title ?? null)
  }

  function handleSelectVersion(version: Asset) {
    if (version.id !== asset.id) {
      router.push(`/content/${version.id}`)
    }
  }

  return (
    <div className="animate-fade-in space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/content"
          className={cn(
            'inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]',
            'hover:text-[var(--text-secondary)] transition-colors duration-150',
          )}
        >
          ← Content Studio
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--text)] leading-tight">
              {asset.title ?? TYPE_LABEL[asset.type] ?? 'Untitled Asset'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="accent">{TYPE_LABEL[asset.type] ?? asset.type}</Badge>
              <Badge variant="outline">
                {PLATFORM_LABEL[asset.platform] ?? asset.platform}
              </Badge>
              <Badge variant={STATUS_VARIANT[asset.status]}>
                {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
              </Badge>
              <span className="text-xs text-[var(--text-disabled)]">
                v{asset.version}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Pencil size={13} />
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={loading}
              className="gap-1.5"
            >
              <Copy size={13} />
              Duplicate
            </Button>
            <Button
              variant={deleteConfirm ? 'destructive' : 'ghost'}
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="gap-1.5"
            >
              <Trash2 size={13} />
              {deleteConfirm ? 'Confirm Delete?' : 'Delete'}
            </Button>
            {deleteConfirm && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className={cn(
            'px-4 py-3 rounded-[var(--radius)] text-sm',
            'bg-[var(--danger-muted)] border border-[rgba(239,68,68,0.25)] text-[var(--danger)]',
          )}
        >
          {error}
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content editor/viewer */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <AssetEditor
                body={asset.body}
                title={asset.title}
                isEditing={isEditing}
                onSave={updateBody}
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          </Card>

          {/* Metadata + Confidence */}
          {(asset.metadata && typeof asset.metadata === 'object' && Object.keys(asset.metadata as object).length > 0 || asset.confidence_score !== null) && (
            <Card>
              <CardContent className="pt-5 space-y-4">
                <ConfidenceBar score={asset.confidence_score} />
                <MetadataDisplay metadata={asset.metadata as Record<string, unknown> ?? {}} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardContent className="pt-5">
              <StatusManager
                currentStatus={asset.status}
                onStatusChange={updateStatus}
                loading={loading}
              />
            </CardContent>
          </Card>

          {/* Platform */}
          <Card>
            <CardContent className="pt-5">
              <PlatformSelector
                currentPlatform={asset.platform}
                onPlatformChange={updatePlatform}
                loading={loading}
              />
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardContent className="pt-5">
              <VersionHistory
                versions={versions}
                currentVersion={asset.version}
                onCreateVersion={handleCreateVersion}
                onSelectVersion={handleSelectVersion}
                loading={versionsLoading}
              />
            </CardContent>
          </Card>

          {/* Mission link + timestamps */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              {asset.mission_id && (
                <a
                  href={`/missions/${asset.mission_id}`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-[var(--radius)]',
                    'border border-[var(--border)] bg-[var(--surface-elevated)]',
                    'hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]',
                    'transition-all duration-150 group',
                  )}
                >
                  <ExternalLink
                    size={13}
                    className="text-[var(--text-muted)] group-hover:text-[var(--primary)]"
                  />
                  <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text)]">
                    View linked mission
                  </span>
                </a>
              )}

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Calendar size={12} />
                  <span>Created {formatDate(asset.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Clock size={12} />
                  <span>Updated {formatDate(asset.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
