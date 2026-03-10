'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrendScanner } from '../hooks/use-trend-scanner'

interface TrendScanModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: () => void;
}

const PLATFORMS = ['X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube']

const PLACEHOLDER = `AI automation\nSolopreneur tools\nContent monetization`

export function TrendScanModal({
  workspaceId,
  isOpen,
  onClose,
  onScanComplete,
}: TrendScanModalProps) {
  const [topicsText, setTopicsText] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(PLATFORMS))
  const { scanState, triggerScan, reset } = useTrendScanner(workspaceId)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      reset()
      setTopicsText('')
      setSelectedPlatforms(new Set(PLATFORMS))
    }
  }, [isOpen, reset])

  // Notify parent when scan completes
  useEffect(() => {
    if (scanState.progress === 100 && !scanState.isScanning) {
      onScanComplete?.()
    }
  }, [scanState.progress, scanState.isScanning, onScanComplete])

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  function handleLaunch() {
    const topics = topicsText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)

    if (topics.length === 0) return

    void triggerScan(topics, Array.from(selectedPlatforms))
  }

  const topics = topicsText.split('\n').map((t) => t.trim()).filter(Boolean)
  const isDone = scanState.progress === 100

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Launch Trend Scan</span>
          </DialogTitle>
          <DialogDescription>
            Research and AI-score topics for signal opportunities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {isDone ? (
            /* Complete state */
            <div className="text-center py-4 space-y-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Scan complete!</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {topics.length} topic{topics.length > 1 ? 's' : ''} queued for processing. Signals will appear in your board shortly.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
              </div>
            </div>
          ) : scanState.isScanning ? (
            /* Scanning state */
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">{scanState.statusMessage}</span>
                  <span className="font-bold tabular-nums text-[var(--accent)]">
                    {scanState.progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${scanState.progress}%`,
                      background: 'linear-gradient(90deg, var(--accent), #10b981)',
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] text-center">
                Scanning {topics.length} topic{topics.length > 1 ? 's' : ''} across{' '}
                {selectedPlatforms.size} platform{selectedPlatforms.size > 1 ? 's' : ''}...
              </p>
            </div>
          ) : (
            /* Input state */
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)]">
                  Topics to scan <span className="text-[var(--text-muted)]">(one per line)</span>
                </label>
                <textarea
                  value={topicsText}
                  onChange={(e) => setTopicsText(e.target.value)}
                  placeholder={PLACEHOLDER}
                  rows={5}
                  className={cn(
                    'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]',
                    'text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
                    'px-3 py-2 resize-none outline-none',
                    'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors'
                  )}
                />
                {topics.length > 0 && (
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {topics.length} topic{topics.length > 1 ? 's' : ''} detected
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)]">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs border transition-all',
                        selectedPlatforms.has(p)
                          ? 'border-[var(--accent)] text-[var(--accent)] bg-[rgba(99,102,241,0.08)]'
                          : 'border-[var(--border)] text-[var(--text-muted)]'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {scanState.error && (
                <p className="text-xs text-[var(--danger)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-[var(--radius)] px-3 py-2">
                  {scanState.error} — please try again
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleLaunch}
                  disabled={topics.length === 0 || selectedPlatforms.size === 0}
                  className="flex-1"
                >
                  {scanState.isScanning ? (
                    <><Loader2 size={12} className="animate-spin mr-1.5" />Scanning...</>
                  ) : (
                    'Launch Scan'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
