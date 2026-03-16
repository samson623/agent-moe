'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, Pill } from '@/components/nebula';
import type { Asset, AssetType, Platform } from '@/lib/supabase/types';

interface ContentPreviewPanelProps {
  asset: Asset;
  onClose: () => void;
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
};

const PLATFORM_NAME: Record<Platform, string> = {
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  email: 'Email',
  universal: 'Universal',
};

const STATUS_TONE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'accent'> = {
  draft: 'default',
  review: 'warning',
  approved: 'success',
  published: 'primary',
  rejected: 'danger',
  archived: 'muted' as 'default',
};

export function ContentPreviewPanel({ asset, onClose }: ContentPreviewPanelProps) {
  const body = asset.body ?? '';
  const lines = body.split('\n').filter(Boolean);
  const hook = lines[0] ?? '';
  const rest = lines.slice(1).join('\n');

  return (
    <GlassCard variant="glow" padding="md" hover={false}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--primary)]">Content Preview</p>
          <p className="text-xs text-[var(--text-muted)]">
            Social-style preview of this asset
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={STATUS_TONE[asset.status] ?? 'default'}>{asset.status}</Pill>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
            aria-label="Close preview"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Mock social post */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
        {/* Avatar row */}
        <div className="mb-3 flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 rounded-full bg-[image:var(--gradient-progress)]" />
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Agent MOE</p>
            <p className="text-xs text-[var(--text-muted)]">
              {PLATFORM_NAME[asset.platform] ?? asset.platform}
            </p>
          </div>
        </div>

        {/* Title */}
        <p className="text-base font-semibold text-[var(--text)] leading-snug">
          {asset.title}
        </p>

        {/* Hook */}
        {hook && (
          <p className="mt-2 text-sm font-medium text-[var(--primary)]">{hook}</p>
        )}

        {/* Body */}
        {rest && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
            {rest.length > 500 ? `${rest.slice(0, 500)}...` : rest}
          </p>
        )}

        {/* CTA block — extracted from body if last line looks like a CTA */}
        {body.includes('DM ') || body.includes('Comment ') || body.includes('Reply ') ? (
          <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-sm font-medium text-[var(--text)]">
            {lines[lines.length - 1]}
          </div>
        ) : null}
      </div>

      {/* Metadata pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill tone="default">{TYPE_LABEL[asset.type] ?? asset.type}</Pill>
        <Pill tone="default">{PLATFORM_NAME[asset.platform] ?? asset.platform}</Pill>
        {'quality_score' in asset && asset.quality_score !== null && (
          <Pill tone={(asset.quality_score as number) >= 70 ? 'success' : 'warning'}>
            Score {asset.quality_score as number}
          </Pill>
        )}
        {asset.operator_team && (
          <Pill tone="primary">{asset.operator_team.replace('_', ' ')}</Pill>
        )}
      </div>

      {/* Timestamps */}
      <p className="mt-3 text-xs text-[var(--text-disabled)]">
        Created {new Date(asset.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </GlassCard>
  );
}
