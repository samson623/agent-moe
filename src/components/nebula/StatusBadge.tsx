'use client';

import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
  success: 'bg-[var(--success-muted)] text-[var(--success)]',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-muted)] text-[var(--danger)]',
  primary: 'bg-[var(--primary-muted)] text-[var(--primary)]',
  accent: 'bg-[var(--accent-muted)] text-[var(--accent)]',
  info: 'bg-[var(--info-muted)] text-[var(--info)]',
} as const;

const sizeStyles = {
  sm: 'text-xs md:text-sm px-2 py-0.5 h-5',
  md: 'text-[12px] px-2.5 py-0.5 h-6',
} as const;

const dotSize = {
  sm: 'size-1.5',
  md: 'size-[7px]',
} as const;

interface StatusBadgeProps {
  label: string;
  variant?: keyof typeof variantStyles;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  label,
  variant = 'default',
  pulse = false,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'rounded-[var(--radius-pill)] font-medium inline-flex items-center gap-1.5',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {pulse && (
        <span
          className={cn(
            'rounded-full bg-current animate-pulse-glow shrink-0',
            dotSize[size],
          )}
        />
      )}
      {label}
    </span>
  );
}
