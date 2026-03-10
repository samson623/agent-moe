'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ThumbnailConcept } from '../hooks/use-video-packages'

interface ThumbnailConceptCardProps {
  concept: ThumbnailConcept
}

export function ThumbnailConceptCard({ concept }: ThumbnailConceptCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thumbnail Concept</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simulated thumbnail preview */}
        <div
          className={cn(
            'relative w-full aspect-video rounded-[var(--radius-lg)] overflow-hidden',
            'bg-[var(--surface-elevated)] border border-[var(--border)]',
            'flex items-center justify-center',
          )}
          style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--background) 100%)',
          }}
        >
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 grid-bg opacity-30" aria-hidden="true" />

          {/* Headline text */}
          <div className="relative z-10 px-6 py-4 text-center max-w-sm">
            <p
              className="text-xl font-black text-white leading-tight"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
            >
              {concept.headline}
            </p>
            {concept.text_overlay && (
              <p
                className="mt-2 text-sm font-bold uppercase tracking-widest"
                style={{ color: 'var(--accent)', textShadow: '0 0 12px rgba(124,58,237,0.6)' }}
              >
                {concept.text_overlay}
              </p>
            )}
          </div>

          {/* Corner label */}
          <span
            className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)]/80 text-[var(--text-muted)]"
          >
            Preview
          </span>
        </div>

        {/* Metadata fields */}
        <div className="space-y-3">
          <DetailRow label="Visual Description" value={concept.visual_description} />
          <DetailRow label="Color Scheme" value={concept.color_scheme} isColor />
          <DetailRow label="Text Overlay" value={concept.text_overlay || '—'} />
        </div>
      </CardContent>
    </Card>
  )
}

function DetailRow({
  label,
  value,
  isColor = false,
}: {
  label: string
  value: string
  isColor?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
        {label}
      </p>
      <div className="flex items-start gap-2">
        {isColor && (
          <div
            className="mt-0.5 w-4 h-4 rounded-full shrink-0 border border-[var(--border)]"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--primary))',
            }}
          />
        )}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{value}</p>
      </div>
    </div>
  )
}
