'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useGenerateVideoPackage } from '../hooks/use-generate-video-package'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PLATFORMS = ['YouTube', 'TikTok', 'Instagram', 'X']
const SCENE_COUNTS = [3, 5, 7]
const HOOK_VARIANTS = [2, 3, 5]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GenerateVideoPackageModalProps {
  workspaceId: string
  missionId?: string
  open: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GenerateVideoPackageModal({
  workspaceId,
  missionId,
  open,
  onClose,
}: GenerateVideoPackageModalProps) {
  const router = useRouter()
  const { generate, generating, lastGenerated, error } = useGenerateVideoPackage(workspaceId)

  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('')
  const [tone, setTone] = useState('')
  const [sceneCount, setSceneCount] = useState(5)
  const [hookVariants, setHookVariants] = useState(3)

  const canSubmit = topic.trim().length > 0 && platform.length > 0 && !generating

  const handleSubmit = async () => {
    if (!canSubmit) return
    await generate({
      topic: topic.trim(),
      platform: platform.toLowerCase(),
      tone: tone.trim() || undefined,
      scene_count: sceneCount,
      hook_count: hookVariants,
      mission_id: missionId,
    })
  }

  const handleViewPackage = () => {
    if (lastGenerated) {
      router.push(`/video/${lastGenerated.id}`)
    }
  }

  const handleClose = () => {
    if (!generating) onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Generate Video Package"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-[var(--radius-xl)]',
          'bg-[var(--surface)] border border-[var(--border)]',
          'shadow-[0_24px_64px_rgba(0,0,0,0.6)]',
          'flex flex-col max-h-[90dvh] overflow-hidden',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">Generate Video Package</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              AI will create hooks, scenes, and a thumbnail concept
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={generating}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)]',
              'text-[var(--text-muted)] hover:text-[var(--text)]',
              'hover:bg-[var(--surface-hover)] transition-all duration-150',
              'disabled:opacity-40 disabled:pointer-events-none',
            )}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Success state */}
          {lastGenerated && (
            <div
              className={cn(
                'flex flex-col items-center gap-4 py-8 text-center',
                'rounded-[var(--radius-lg)] border border-[var(--success)]/30',
                'bg-[var(--success-muted)]',
              )}
            >
              <CheckCircle2 size={40} className="text-[var(--success)]" />
              <div>
                <p className="text-base font-bold text-[var(--text)]">Package Generated!</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">{lastGenerated.title}</p>
              </div>
              <Button onClick={handleViewPackage} variant="success" size="sm">
                View Package
              </Button>
            </div>
          )}

          {!lastGenerated && (
            <>
              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Topic */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Topic <span className="text-[var(--danger)]">*</span>
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What is the video about?"
                  rows={3}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-[var(--radius)] text-sm resize-none',
                    'bg-[var(--surface-elevated)] border border-[var(--border)]',
                    'text-[var(--text)] placeholder-[var(--text-muted)]',
                    'focus:outline-none focus:border-[var(--primary)]',
                    'transition-colors duration-150',
                  )}
                />
              </div>

              {/* Platform */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Platform <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={cn(
                        'px-3 h-8 rounded-full text-xs font-medium transition-all duration-150',
                        platform === p
                          ? 'bg-[var(--primary-muted)] text-[var(--primary)] border border-[rgba(59,130,246,0.3)]'
                          : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text)]',
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Tone{' '}
                  <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="energetic, educational, casual…"
                  className={cn(
                    'w-full h-9 px-3 rounded-[var(--radius)] text-sm',
                    'bg-[var(--surface-elevated)] border border-[var(--border)]',
                    'text-[var(--text)] placeholder-[var(--text-muted)]',
                    'focus:outline-none focus:border-[var(--primary)]',
                    'transition-colors duration-150',
                  )}
                />
              </div>

              {/* Scene count */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Scene Count
                </label>
                <div className="flex gap-2">
                  {SCENE_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSceneCount(n)}
                      className={cn(
                        'px-4 h-8 rounded-[var(--radius)] text-xs font-medium transition-all duration-150',
                        sceneCount === n
                          ? 'bg-[var(--accent-muted)] text-[#a78bfa] border border-[rgba(124,58,237,0.3)]'
                          : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)]',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hook variants */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Hook Variants
                </label>
                <div className="flex gap-2">
                  {HOOK_VARIANTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setHookVariants(n)}
                      className={cn(
                        'px-4 h-8 rounded-[var(--radius)] text-xs font-medium transition-all duration-150',
                        hookVariants === n
                          ? 'bg-[var(--accent-muted)] text-[#a78bfa] border border-[rgba(124,58,237,0.3)]'
                          : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)]',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!lastGenerated && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={generating}>
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gap-2 min-w-[140px]"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                'Generate Package'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
