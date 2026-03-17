'use client'

import { useState } from 'react'
import { Sparkles, Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard, SliderInput } from '@/components/nebula'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VideoFactoryInputProps {
  onGenerate: (topic: string, durationSeconds: number, tone: string, platforms: string[]) => void
  generating: boolean
}

// ---------------------------------------------------------------------------
// Tone options
// ---------------------------------------------------------------------------

const TONES = ['educational', 'conversational', 'energetic', 'professional', 'motivational'] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoFactoryInput({ onGenerate, generating }: VideoFactoryInputProps) {
  const [topic, setTopic] = useState('')
  const [durationSeconds, setDurationSeconds] = useState(30)
  const [tone, setTone] = useState<string>('educational')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'youtube', 'instagram'])

  const canSubmit = topic.trim().length > 0 && selectedPlatforms.length > 0 && !generating

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onGenerate(topic.trim(), durationSeconds, tone, selectedPlatforms)
  }

  return (
    <GlassCard className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)]/10">
            <Film className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Video Factory</h3>
            <p className="text-xs text-[var(--text-muted)]">
              One topic &rarr; 3 platform-optimized videos
            </p>
          </div>
        </div>

        {/* Topic input */}
        <div>
          <label htmlFor="vf-topic" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Topic
          </label>
          <input
            id="vf-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. productivity hacks for remote workers"
            disabled={generating}
            className={cn(
              'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-solid)]',
              'px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-disabled)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/50',
              'disabled:opacity-50',
            )}
            maxLength={500}
          />
        </div>

        {/* Duration slider */}
        <SliderInput
          label="Duration"
          value={durationSeconds}
          onChange={setDurationSeconds}
          min={15}
          max={120}
          step={5}
          formatValue={(v) => `${v}s`}
        />

        {/* Tone selector */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Tone
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                disabled={generating}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  'border disabled:opacity-50',
                  tone === t
                    ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:border-[var(--primary)]/30',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Platform selection */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Platforms
          </label>
          <div className="flex flex-wrap gap-1.5">
            {([['tiktok', 'TikTok'], ['youtube', 'YouTube Shorts'], ['instagram', 'IG Reels']] as const).map(([value, label]) => {
              const selected = selectedPlatforms.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  disabled={generating}
                  onClick={() => {
                    setSelectedPlatforms((prev) =>
                      selected
                        ? prev.filter((p) => p !== value)
                        : [...prev, value],
                    )
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    'border disabled:opacity-50',
                    selected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                      : 'border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:border-[var(--primary)]/30',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={!canSubmit}
          className="w-full gap-2"
        >
          {generating ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating {selectedPlatforms.length} video{selectedPlatforms.length !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate {selectedPlatforms.length} Video{selectedPlatforms.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </form>
    </GlassCard>
  )
}
