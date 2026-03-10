'use client'

import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/supabase/types'

interface PlatformSelectorProps {
  currentPlatform: Platform
  onPlatformChange: (platform: Platform) => Promise<void>
  loading: boolean
}

interface PlatformOption {
  value: Platform
  icon: string
  label: string
  color: string
}

const PLATFORMS: PlatformOption[] = [
  { value: 'x', icon: '𝕏', label: 'X / Twitter', color: '#1DA1F2' },
  { value: 'linkedin', icon: 'in', label: 'LinkedIn', color: '#0A66C2' },
  { value: 'instagram', icon: 'IG', label: 'Instagram', color: '#E4405F' },
  { value: 'tiktok', icon: 'TT', label: 'TikTok', color: '#00F2EA' },
  { value: 'youtube', icon: 'YT', label: 'YouTube', color: '#FF0000' },
  { value: 'email', icon: '✉', label: 'Email', color: '#7C3AED' },
  { value: 'universal', icon: '🌐', label: 'Universal', color: '#6B7280' },
]

export function PlatformSelector({
  currentPlatform,
  onPlatformChange,
  loading,
}: PlatformSelectorProps) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
        Platform
      </span>
      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map((platform) => {
          const isActive = currentPlatform === platform.value
          return (
            <button
              key={platform.value}
              onClick={() => onPlatformChange(platform.value)}
              disabled={loading || isActive}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius)]',
                'border transition-all duration-150',
                'text-left',
                isActive
                  ? 'border-current bg-[var(--surface-elevated)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--text-muted)]',
                loading && 'opacity-50 cursor-not-allowed',
                !loading && !isActive && 'cursor-pointer',
              )}
              style={isActive ? { borderColor: platform.color } : undefined}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)]',
                  'text-xs font-bold shrink-0',
                )}
                style={{
                  backgroundColor: `${platform.color}20`,
                  color: platform.color,
                }}
              >
                {platform.icon}
              </span>
              <span
                className={cn(
                  'text-xs font-medium truncate',
                  isActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                )}
              >
                {platform.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
