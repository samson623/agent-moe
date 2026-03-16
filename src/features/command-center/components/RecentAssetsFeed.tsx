'use client';

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
  BarChart3,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RecentAsset {
  id: string;
  title: string | null;
  asset_type: string;
  asset_status: string;
  platform: string;
  confidence_score: number | null;
  created_at: string;
  mission_id: string | null;
}

interface RecentAssetsFeedProps {
  assets: RecentAsset[];
  isLoading: boolean;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const ASSET_ICONS: Record<string, React.ElementType> = {
  post: FileText,
  thread: MessageSquare,
  script: Film,
  caption: Quote,
  cta: MousePointerClick,
  thumbnail: Image,
  carousel: LayoutGrid,
  video: Video,
  email: Mail,
  report: BarChart3,
};

const PLATFORM_VARIANT: Record<string, 'default' | 'info' | 'success' | 'danger'> = {
  x: 'default',
  twitter: 'default',
  linkedin: 'info',
  instagram: 'success',
  tiktok: 'default',
  youtube: 'danger',
};

const PLATFORM_LABELS: Record<string, string> = {
  x: '𝕏',
  twitter: '𝕏',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

function ConfidenceBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-[var(--success)]'
      : score >= 50
        ? 'bg-[var(--warning)]'
        : 'bg-[var(--danger)]';

  const label =
    score >= 80
      ? 'text-[var(--success)]'
      : score >= 50
        ? 'text-[var(--warning)]'
        : 'text-[var(--danger)]';

  return (
    <div className="flex items-center gap-1.5" aria-label={`Confidence: ${score}%`}>
      <div className="h-1 w-12 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium tabular-nums', label)}>
        {score}%
      </span>
    </div>
  );
}

function AssetRow({ asset }: { asset: RecentAsset }) {
  const Icon = ASSET_ICONS[asset.asset_type] ?? FileText;
  const platformVariant = PLATFORM_VARIANT[asset.platform] ?? 'default';
  const platformLabel = PLATFORM_LABELS[asset.platform] ?? asset.platform;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3',
        'border-b border-[var(--border-subtle)] last:border-none',
        'hover:bg-[var(--surface-hover)] transition-colors duration-100'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-[var(--radius)] shrink-0',
          'bg-[var(--surface-elevated)] border border-[var(--border-subtle)]',
          'group-hover:border-[var(--border)] transition-colors duration-100'
        )}
      >
        <Icon size={13} className="text-[var(--text-secondary)]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text)] truncate">
          {asset.title ?? 'Untitled Asset'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="muted" className="text-xs capitalize">
            {asset.asset_type}
          </Badge>
          <Badge variant={platformVariant} className="text-xs">
            {platformLabel}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-xs text-[var(--text-disabled)]">
          {timeAgo(asset.created_at)}
        </span>
        {asset.confidence_score != null && (
          <ConfidenceBar score={asset.confidence_score} />
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] last:border-none">
      <div className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface-elevated)] animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-[var(--surface-elevated)] animate-pulse" />
        <div className="flex gap-1.5">
          <div className="h-4 w-12 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
          <div className="h-4 w-16 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="h-3 w-10 rounded bg-[var(--surface-elevated)] animate-pulse" />
        <div className="h-1 w-12 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
      </div>
    </div>
  );
}

export function RecentAssetsFeed({ assets, isLoading }: RecentAssetsFeedProps) {
  const displayed = assets.slice(0, 10);
  const hasMore = assets.length > 10;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-[var(--radius)]',
                'bg-[var(--accent-muted)] border border-[rgba(124,58,237,0.15)]'
              )}
            >
              <Layers size={13} className="text-[var(--accent)]" />
            </div>
            <CardTitle>Recent Assets</CardTitle>
          </div>
          {!isLoading && assets.length > 0 && (
            <Badge variant="accent" className="tabular-nums">
              {assets.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-2">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : displayed.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div
              className={cn(
                'mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3',
                'bg-[var(--surface-elevated)] border border-[var(--border-subtle)]'
              )}
            >
              <FileText size={16} className="text-[var(--text-disabled)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">No assets yet</p>
            <p className="text-xs text-[var(--text-disabled)] mt-1">
              Launch a mission to generate content.
            </p>
          </div>
        ) : (
          <>
            {displayed.map((asset) => (
              <AssetRow key={asset.id} asset={asset} />
            ))}
          </>
        )}

        {hasMore && (
          <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs">
              View all in Content Studio
              <ArrowRight size={12} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
