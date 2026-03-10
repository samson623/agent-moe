'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChart2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopicScorerProps {
  workspaceId: string;
  onScanQueued?: () => void;
}

type ScorerState = 'idle' | 'scoring' | 'queued' | 'error'

export function TopicScorer({ workspaceId, onScanQueued }: TopicScorerProps) {
  const [topic, setTopic] = useState('')
  const [state, setState] = useState<ScorerState>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleScore() {
    const trimmed = topic.trim()
    if (!trimmed) return

    setState('scoring')
    setError(null)

    try {
      const res = await fetch('/api/trend-signals/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          topics: [trimmed],
        }),
      })

      if (!res.ok) throw new Error(`Request failed (${res.status})`)

      setState('queued')
      onScanQueued?.()
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Scoring failed')
    }
  }

  function handleReset() {
    setState('idle')
    setError(null)
    setTopic('')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-[var(--radius)]"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <BarChart2 size={14} className="text-[var(--accent)]" />
          </div>
          <div>
            <CardTitle className="text-sm">Topic Scorer</CardTitle>
            <p className="text-[11px] text-[var(--text-muted)]">
              Drop any topic — queue it for AI signal scoring
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {state === 'queued' ? (
          <div className="flex items-start gap-3 p-3 rounded-[var(--radius)] bg-[var(--surface-hover)] border border-[var(--success)]">
            <div className="w-2 h-2 rounded-full bg-[var(--success)] mt-1.5 shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-[var(--success)] mb-0.5">Scan queued</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                &ldquo;{topic}&rdquo; has been queued for analysis. Check back in ~30 seconds — the signal will appear in your board when ready.
              </p>
              <button
                onClick={handleReset}
                className="text-[11px] text-[var(--accent)] mt-2 hover:underline"
              >
                Score another topic
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleScore() }}
                placeholder="e.g. AI agents for solopreneurs"
                disabled={state === 'scoring'}
                className={cn('flex-1 text-sm', state === 'error' && 'border-[var(--danger)]')}
              />
              <Button
                onClick={() => void handleScore()}
                disabled={!topic.trim() || state === 'scoring'}
                variant="accent"
                size="sm"
                className="shrink-0"
              >
                {state === 'scoring' ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1.5" />
                    Queuing...
                  </>
                ) : (
                  'Score It'
                )}
              </Button>
            </div>

            {state === 'error' && error && (
              <p className="text-xs text-[var(--danger)]">{error} — try again</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
