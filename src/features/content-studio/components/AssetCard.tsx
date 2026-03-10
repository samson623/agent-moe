'use client'

import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  MessageSquare,
  Film,
  Quote,
  MousePointerClick,
  Image,
  LayoutGrid,
  Video,
  Mail,
  FileBarChart,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Asset, AssetType, AssetStatus, Platform, OperatorTeam } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const ASSET_TYPE_CONFIG: Record<AssetType, { icon: LucideIcon; color: string; label: string }> = {
  post: { icon: FileText, color: '#3b82f6', label: 'Post' },
  thread: { icon: MessageSquare, color: '#8b5cf6', label: 'Thread' },
  script: { icon: Film, color: '#f59e0b', label: 'Script' },
  caption: { icon: Quote, color: '#10b981', label: 'Caption' },
  cta: { icon: MousePointerClick, color: '#ef4444', label: 'CTA' },
  thumbnail_concept: { icon: Image, color: '#ec4899', label: 'Thumbnail' },
  carousel: { icon: LayoutGrid, color: '#06b6d4', label: 'Carousel' },
  video_concept: { icon: Video, color: '#f97316', label: 'Video Concept' },
  email: { icon: Mail, color: '#6366f1', label: 'Email' },
  report: { icon: FileBarChart, color: '#14b8a6', label: 'Report' },
}

const STATUS_BADGE_VARIANT: Record<AssetStatus, 'muted' | 'warning' | 'success' | 'info' | 'danger'> = {
  draft: 'muted',
  review: 'warning',
  approved: 'success',
  published: 'info',
  rejected: 'danger',
  archived: 'muted',
}

const PLATFORM_LABELS: Record<Platform, string> = {
  x: '𝕏',
  linkedin: 'in',
  instagram: 'IG',
  tiktok: 'TT',
  youtube: 'YT',
  email: '✉',
  universal: '🌐',
}

const TEAM_LABELS: Record<OperatorTeam, string> = {
  content_strike: 'Content Strike',
  growth_operator: 'Growth',
  revenue_closer: 'Revenue',
  brand_guardian: 'Brand',
  browser_agent: 'Browser',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '…'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AssetCardProps {
  asset: Asset
  isSelected: boolean
  onSelect: (id: string) => void
  onClick: (id: string) => void
}

export function AssetCard({ asset, isSelected, onSelect, onClick }: AssetCardProps) {
  const typeConfig = ASSET_TYPE_CONFIG[asset.type]
  const TypeIcon = typeConfig.icon
  const displayTitle = asset.title || truncate(asset.body, 80)
  const confidence = asset.confidence_score

  return (
    <Card
      className={cn(
        'overflow-hidden group cursor-pointer transition-all duration-200',
        'hover:border-[var(--primary)]/40 hover:shadow-[0_0_16px_rgba(59,130,246,0.1)]',
        isSelected && 'border-[var(--primary)] shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      )}
      onClick={() => onClick(asset.id)}
    >
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${typeConfig.color}, ${typeConfig.color}40)` }}
      />

      <CardContent className="p-4 space-y-3">
        {/* Top row: checkbox + type badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              className={cn(
                'flex items-center justify-center w-5 h-5 rounded-[3px] border transition-colors shrink-0',
                isSelected
                  ? 'bg-[var(--primary)] border-[var(--primary)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)]',
              )}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(asset.id)
              }}
              aria-label={isSelected ? 'Deselect asset' : 'Select asset'}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <div
              className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)]"
              style={{ background: `${typeConfig.color}18`, border: `1px solid ${typeConfig.color}30` }}
            >
              <TypeIcon size={14} style={{ color: typeConfig.color }} />
            </div>
            <Badge variant="outline" className="text-[10px]">
              {typeConfig.label}
            </Badge>
          </div>

          <Badge variant={STATUS_BADGE_VARIANT[asset.status]} className="text-[10px]">
            {asset.status}
          </Badge>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-[var(--text)] leading-tight line-clamp-1">
          {displayTitle}
        </p>

        {/* Body preview */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
          {asset.body}
        </p>

        {/* Platform + team row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              'bg-[var(--surface-elevated)] text-[var(--text-secondary)]',
              'border border-[var(--border-subtle)]',
            )}
          >
            {PLATFORM_LABELS[asset.platform]}
          </span>
          {asset.operator_team && (
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
                'border border-[var(--border-subtle)]',
              )}
            >
              {TEAM_LABELS[asset.operator_team]}
            </span>
          )}
          <span className="text-[10px] text-[var(--text-muted)] ml-auto tabular-nums">
            v{asset.version}
          </span>
        </div>

        {/* Confidence bar */}
        {confidence !== null && confidence !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
              <span>Confidence</span>
              <span className="tabular-nums">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-[var(--surface-elevated)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${confidence * 100}%`,
                  background:
                    confidence > 0.7
                      ? 'var(--success)'
                      : confidence > 0.4
                        ? 'var(--warning)'
                        : 'var(--danger)',
                }}
              />
            </div>
          </div>
        )}

        {/* Footer: timestamp */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
            {formatTimeAgo(asset.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
