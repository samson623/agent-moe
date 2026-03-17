'use client';

import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glow';
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  variant = 'default',
}: SectionCardProps) {
  return (
    <GlassCard variant={variant} padding="md" hover={false} className={className}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </GlassCard>
  );
}
