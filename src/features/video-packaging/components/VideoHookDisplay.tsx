'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VideoHook } from '../hooks/use-video-packages'

interface CopyButtonProps {
  text: string
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API not available
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)]',
        'border border-[var(--border)] bg-[var(--surface-elevated)]',
        'text-[var(--text-muted)] hover:text-[var(--text)]',
        'hover:border-[var(--primary)] transition-all duration-150 shrink-0',
      )}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check size={13} className="text-[var(--success)]" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  )
}

interface VideoHookDisplayProps {
  hook: VideoHook
}

export function VideoHookDisplay({ hook }: VideoHookDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Primary hook */}
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
          Primary Hook
        </p>
        <div
          className={cn(
            'relative p-4 rounded-[var(--radius-lg)]',
            'bg-[var(--surface-elevated)] border border-[var(--border)]',
            'border-l-[3px]',
          )}
          style={{ borderLeftColor: 'var(--accent)' }}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 text-base font-semibold text-[var(--text)] leading-relaxed">
              {hook.primary}
            </p>
            <CopyButton text={hook.primary} />
          </div>
        </div>
      </div>

      {/* Variants */}
      {hook.variants.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
            Variants
          </p>
          <div className="space-y-2">
            {hook.variants.map((variant, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-[var(--radius)]',
                  'bg-[var(--surface)] border border-[var(--border-subtle)]',
                  'hover:border-[var(--border)] transition-colors duration-150',
                )}
              >
                <span
                  className="text-[11px] font-bold shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'var(--accent-muted)',
                    color: '#a78bfa',
                  }}
                >
                  {i + 1}
                </span>
                <p className="flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {variant}
                </p>
                <CopyButton text={variant} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
