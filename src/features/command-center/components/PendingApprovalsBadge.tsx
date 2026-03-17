'use client';

import { cn } from '@/lib/utils';

interface PendingApprovalsBadgeProps {
  count: number;
  isLoading: boolean;
}

export function PendingApprovalsBadge({ count, isLoading }: PendingApprovalsBadgeProps) {
  if (isLoading) {
    return (
      <span
        className={cn(
          'absolute -top-1 -right-1 h-4 w-4 rounded-full',
          'bg-[var(--danger-muted)] animate-pulse'
        )}
        aria-hidden="true"
      />
    );
  }

  if (count === 0) return null;

  const display = count > 9 ? '9+' : String(count);

  return (
    <span
      className={cn(
        'absolute -top-1.5 -right-1.5 z-10',
        'flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1 rounded-full',
        'bg-[var(--danger)] text-white',
        'text-xs font-bold leading-none',
        'ring-2 ring-[var(--surface)]',
        'transition-transform duration-200 ease-out',
        'scale-100 hover:scale-110'
      )}
      role="status"
      aria-label={`${count} pending approval${count !== 1 ? 's' : ''}`}
    >
      {display}
    </span>
  );
}
