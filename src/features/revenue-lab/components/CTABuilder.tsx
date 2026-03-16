'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OfferRow } from '@/lib/supabase/types'
import type { CTAVariant } from '../types'

const PLATFORM_OPTIONS = ['general', 'x', 'linkedin', 'instagram', 'email'] as const
const CONTENT_TYPE_OPTIONS = ['post', 'thread', 'video_script', 'email', 'caption'] as const

const PLATFORM_LABEL: Record<string, string> = {
  general: 'General',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  email: 'Email',
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  post: 'Post',
  thread: 'Thread',
  video_script: 'Video Script',
  email: 'Email',
  caption: 'Caption',
}

const URGENCY_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

interface CTABuilderProps {
  offer: OfferRow
  workspaceId: string
}

export function CTABuilder({ offer }: CTABuilderProps) {
  const [variants, setVariants] = useState<CTAVariant[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'general',
    'x',
    'linkedin',
  ])
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['post', 'video_script'])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  function toggleType(t: string) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  async function handleGenerate() {
    if (selectedPlatforms.length === 0 || selectedTypes.length === 0) return
    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch(`/api/offers/${offer.id}/generate-ctas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          content_types: selectedTypes,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Request failed with status ${res.status}`)
      }

      const data = await res.json()
      setVariants(data.variants ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate CTAs')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCopy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // clipboard not available
    }
  }

  const CHIP_BASE =
    'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap'
  const CHIP_ACTIVE = 'bg-[var(--primary)] text-white'
  const CHIP_INACTIVE =
    'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)]'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--text)]">CTA Variants</h3>
        <Button
          variant="default"
          onClick={handleGenerate}
          disabled={isGenerating || selectedPlatforms.length === 0 || selectedTypes.length === 0}
          className="gap-1.5 text-xs h-8 px-3"
        >
          {isGenerating ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap size={12} />
          )}
          {isGenerating ? 'Generating…' : 'Generate'}
        </Button>
      </div>

      {/* Platform chips */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Platforms
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={cn(CHIP_BASE, selectedPlatforms.includes(p) ? CHIP_ACTIVE : CHIP_INACTIVE)}
            >
              {PLATFORM_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Content type chips */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Content Types
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className={cn(CHIP_BASE, selectedTypes.includes(t) ? CHIP_ACTIVE : CHIP_INACTIVE)}
            >
              {CONTENT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-[var(--radius)] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)]">
          <p className="text-xs text-[var(--danger)]">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isGenerating && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 animate-pulse"
            >
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded-full bg-[var(--border)]" />
                <div className="h-4 w-16 rounded-full bg-[var(--border)]" />
              </div>
              <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
              <div className="h-3 w-full rounded bg-[var(--border)]" />
              <div className="h-3 w-5/6 rounded bg-[var(--border)]" />
              <div className="h-3 w-2/3 rounded bg-[var(--border)]" />
            </div>
          ))}
        </div>
      )}

      {/* Variants grid */}
      {!isGenerating && variants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {variants.map((v) => (
            <div
              key={v.id}
              className={cn(
                'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4',
                'hover:bg-[var(--surface-hover)] transition-colors duration-100',
              )}
            >
              {/* Top badges */}
              <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                <Badge variant="default" className="text-[9px]">
                  {PLATFORM_LABEL[v.platform] ?? v.platform}
                </Badge>
                <Badge variant="muted" className="text-[9px]">
                  {CONTENT_TYPE_LABEL[v.content_type] ?? v.content_type}
                </Badge>
                <Badge
                  variant={URGENCY_VARIANT[v.urgency_level] ?? 'muted'}
                  className="text-[9px] ml-auto"
                >
                  {v.urgency_level} urgency
                </Badge>
                <span className="text-xs font-bold tabular-nums" style={{ color: v.confidence >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                  {v.confidence}%
                </span>
              </div>

              {/* Headline */}
              <p className="text-sm font-semibold text-[var(--text)] leading-snug mb-1.5">
                {v.headline}
              </p>

              {/* Body */}
              <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3 mb-3">
                {v.body}
              </p>

              {/* Button text copy badge */}
              <button
                type="button"
                onClick={() => handleCopy(v.button_text, v.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  'border transition-all duration-150',
                  copiedId === v.id
                    ? 'bg-[var(--success-muted)] text-[var(--success)] border-[rgba(16,185,129,0.3)]'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]',
                )}
                title="Copy button text"
              >
                {copiedId === v.id ? '✓ Copied' : `"${v.button_text}"`}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isGenerating && variants.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] mb-2.5"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <Zap size={16} style={{ color: '#7c3aed' }} />
          </div>
          <p className="text-sm font-medium text-[var(--text)] mb-1">No variants yet</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs">
            Click Generate to create CTA variants for this offer
          </p>
        </div>
      )}
    </div>
  )
}
