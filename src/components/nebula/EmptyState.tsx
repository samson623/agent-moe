'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative py-16 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface-solid)] flex flex-col items-center text-center',
        className,
      )}
    >
      <div className="relative">
        <div
          className="absolute -inset-8 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
          }}
        />
        <Icon size={40} className="relative text-[var(--text-disabled)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text)] mt-4">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
