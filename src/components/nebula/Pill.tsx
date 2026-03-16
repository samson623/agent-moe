'use client';

import { cn } from '@/lib/utils';

type PillTone = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'primary' | 'muted';

const toneStyles: Record<PillTone, string> = {
  default: 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]',
  success: 'border-[rgba(52,211,153,0.2)] bg-[var(--success-muted)] text-[var(--success)]',
  warning: 'border-[rgba(251,191,36,0.2)] bg-[var(--warning-muted)] text-[var(--warning)]',
  danger: 'border-[rgba(248,113,113,0.2)] bg-[var(--danger-muted)] text-[var(--danger)]',
  accent: 'border-[rgba(245,158,11,0.2)] bg-[var(--accent-muted)] text-[var(--accent)]',
  primary: 'border-[rgba(139,92,246,0.2)] bg-[var(--primary-muted)] text-[var(--primary)]',
  muted: 'border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-muted)]',
};

interface PillProps {
  children: React.ReactNode;
  tone?: PillTone;
  className?: string;
}

export function Pill({ children, tone = 'default', className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
