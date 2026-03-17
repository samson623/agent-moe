'use client'

import Link from 'next/link'
import { Crosshair } from 'lucide-react'
import { EmptyState } from '@/components/nebula'
import { MotionFadeIn } from '@/components/nebula/motion'

export function MissionsEmptyState({ variant }: { variant: 'no-workspace' | 'no-missions' }) {
  if (variant === 'no-workspace') {
    return (
      <MotionFadeIn delay={0.1}>
        <EmptyState
          icon={Crosshair}
          title="No workspace found"
          description="Set up a workspace to start creating missions."
          action={
            <Link
              href="/settings"
              className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] underline underline-offset-2"
            >
              Set up a workspace in Settings
            </Link>
          }
        />
      </MotionFadeIn>
    )
  }

  return (
    <MotionFadeIn delay={0.1}>
      <EmptyState
        icon={Crosshair}
        title="No missions yet"
        description="Create your first mission from the Command Center."
        action={
          <Link
            href="/"
            className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] underline underline-offset-2"
          >
            Go to Command Center
          </Link>
        }
      />
    </MotionFadeIn>
  )
}
