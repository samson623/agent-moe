'use client';

import { cn } from '@/lib/utils';
import { MotionPage } from './motion';

type PageWrapperProps = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'full' | 'xl' | '2xl';
};

const maxWidthMap = {
  full: '',
  xl: 'max-w-screen-xl mx-auto',
  '2xl': 'max-w-screen-2xl mx-auto',
} as const;

export function PageWrapper({
  children,
  className,
  maxWidth = 'full',
}: PageWrapperProps) {
  return (
    <MotionPage
      className={cn(
        'px-6 py-6',
        maxWidthMap[maxWidth],
        className,
      )}
    >
      {children}
    </MotionPage>
  );
}
