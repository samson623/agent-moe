'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Asset } from '@/lib/supabase/types'

interface VersionHistoryProps {
  versions: Asset[]
  currentVersion: number
  onCreateVersion: (body: string, title?: string) => Promise<void>
  onSelectVersion: (version: Asset) => void
  loading: boolean
}

function computeLineDiff(
  oldText: string,
  newText: string,
): { type: 'same' | 'added' | 'removed'; text: string }[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: { type: 'same' | 'added' | 'removed'; text: string }[] = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]

    if (oldLine === newLine) {
      result.push({ type: 'same', text: oldLine ?? '' })
    } else {
      if (oldLine !== undefined) {
        result.push({ type: 'removed', text: oldLine })
      }
      if (newLine !== undefined) {
        result.push({ type: 'added', text: newLine })
      }
    }
  }

  return result
}

function DiffView({ oldBody, newBody }: { oldBody: string; newBody: string }) {
  const diff = useMemo(() => computeLineDiff(oldBody, newBody), [oldBody, newBody])

  if (oldBody === newBody) {
    return (
      <p className="text-xs text-[var(--text-disabled)] italic py-2">
        No changes between these versions
      </p>
    )
  }

  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-[var(--border)] overflow-hidden',
        'text-xs font-mono leading-relaxed max-h-64 overflow-y-auto',
      )}
    >
      {diff.map((line, i) => (
        <div
          key={i}
          className={cn(
            'px-3 py-0.5',
            line.type === 'added' && 'bg-[rgba(16,185,129,0.12)] text-[var(--success)]',
            line.type === 'removed' && 'bg-[rgba(239,68,68,0.12)] text-[var(--danger)]',
            line.type === 'same' && 'text-[var(--text-muted)]',
          )}
        >
          <span className="mr-2 select-none opacity-50">
            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
          </span>
          {line.text || '\u00A0'}
        </div>
      ))}
    </div>
  )
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function VersionHistory({
  versions,
  currentVersion,
  onCreateVersion,
  onSelectVersion,
  loading,
}: VersionHistoryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions],
  )

  const currentAsset = sorted.find((v) => v.version === currentVersion)
  const selectedAsset = selectedIdx !== null ? sorted[selectedIdx] : null

  function handleSelect(idx: number) {
    const version = sorted[idx]
    if (!version) return

    if (selectedIdx === idx) {
      setSelectedIdx(null)
      setShowDiff(false)
      return
    }

    setSelectedIdx(idx)
    setShowDiff(true)
    onSelectVersion(version)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Versions
        </span>
        <Badge variant="muted" className="text-[10px]">
          {versions.length}
        </Badge>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-[var(--text-disabled)]">No versions yet</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {sorted.map((version, idx) => {
            const isCurrent = version.version === currentVersion
            const isSelected = selectedIdx === idx

            return (
              <button
                key={version.id}
                onClick={() => handleSelect(idx)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)]',
                  'border transition-all duration-150 text-left',
                  isCurrent && !isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary-muted)]'
                    : isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]',
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0',
                    isCurrent
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-muted)]',
                  )}
                >
                  v{version.version}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-xs font-medium truncate',
                      isCurrent ? 'text-[var(--text)]' : 'text-[var(--text-secondary)]',
                    )}
                  >
                    {isCurrent ? 'Current' : version.title ?? `Version ${version.version}`}
                  </p>
                  <p className="text-[10px] text-[var(--text-disabled)]">
                    {formatTimestamp(version.created_at)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Diff view */}
      {showDiff && selectedAsset && currentAsset && selectedAsset.id !== currentAsset.id && (
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--text-muted)]">
            Comparing v{selectedAsset.version} → v{currentAsset.version}
          </p>
          <DiffView oldBody={selectedAsset.body} newBody={currentAsset.body} />
        </div>
      )}

      {/* Create version */}
      {currentAsset && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center mt-2"
          onClick={() => onCreateVersion(currentAsset.body, currentAsset.title ?? undefined)}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Save as New Version'}
        </Button>
      )}
    </div>
  )
}
