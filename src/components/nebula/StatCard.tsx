'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import { AnimatedCounter } from './motion';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';
type SubtitleTone = 'positive' | 'negative' | 'neutral';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  subtitle?: string;
  subtitleTone?: SubtitleTone;
  className?: string;
  loading?: boolean;
  /** Prefix for animated number (e.g. "$") */
  prefix?: string;
  /** Suffix for animated number (e.g. "%") */
  suffix?: string;
  /** Decimal places for animated number */
  decimals?: number;
};

const iconStyles: Record<Tone, string> = {
  default: 'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
  primary: 'bg-[var(--primary-muted)] text-[var(--primary)]',
  success: 'bg-[var(--success-muted)] text-[var(--success)]',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-muted)] text-[var(--danger)]',
  accent: 'bg-[var(--accent-muted)] text-[var(--accent)]',
};

const subtitleColors: Record<SubtitleTone, string> = {
  positive: 'text-[var(--success)]',
  negative: 'text-[var(--danger)]',
  neutral: 'text-[var(--text-muted)]',
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)] bg-[var(--skeleton)]',
        className,
      )}
    />
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  subtitle,
  subtitleTone = 'neutral',
  className,
  loading = false,
  prefix,
  suffix,
  decimals = 0,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const isAnimatable = !loading && !isNaN(numericValue) && typeof value === 'number';

  return (
    <GlassCard className={className} padding="md">
      {/* Top row: icon + label */}
      <div className="flex items-center gap-3">
        {loading ? (
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        ) : (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              iconStyles[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}

        {loading ? (
          <Skeleton className="h-3 w-20" />
        ) : (
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {label}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : isAnimatable ? (
          <AnimatedCounter
            value={numericValue}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            className="text-2xl font-semibold tracking-tight text-[var(--text)]"
          />
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            {value}
          </p>
        )}
      </div>

      {/* Subtitle */}
      {(subtitle || loading) && (
        <div className="mt-1">
          {loading ? (
            <Skeleton className="h-3 w-28" />
          ) : (
            <span className={cn('text-xs', subtitleColors[subtitleTone])}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
}
