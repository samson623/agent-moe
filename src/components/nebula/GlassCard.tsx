'use client';

import { cn } from '@/lib/utils';

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glow';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: React.ElementType;
};

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
} as const;

export function GlassCard({
  children,
  className,
  variant = 'default',
  hover = true,
  padding = 'md',
  as: Component = 'div',
}: GlassCardProps) {
  return (
    <Component
      className={cn(
        // Base
        'relative rounded-[var(--radius)] border transition-all duration-200',
        paddingMap[padding],

        // Default variant
        variant === 'default' &&
          'bg-[var(--surface-solid)] border-[var(--border)]',

        // Elevated variant
        variant === 'elevated' &&
          'bg-[var(--surface-elevated)] border-[var(--border)] backdrop-blur-sm',

        // Glow variant
        variant === 'glow' &&
          'bg-[var(--surface-solid)] border-[var(--primary-muted)] shadow-[var(--glow-primary)]',

        // Hover effect
        hover &&
          'hover:-translate-y-px hover:border-[var(--border-hover)] hover:shadow-md',

        className,
      )}
    >
      {/* Gradient shine overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--radius)] bg-[image:var(--gradient-card-shine)] opacity-60 z-0"
      />
      <div className="relative z-[1]">{children}</div>
    </Component>
  );
}
