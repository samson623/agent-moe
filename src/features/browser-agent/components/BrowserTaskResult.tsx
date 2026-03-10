'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import type { BrowserTask } from '../types'

interface BrowserTaskResultProps {
  task: BrowserTask
}

type ResultTab = 'data' | 'text' | 'links' | 'screenshot'

export function BrowserTaskResult({ task }: BrowserTaskResultProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>('data')

  if (!task.result) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--text-muted)]">
          {task.status === 'pending' || task.status === 'running'
            ? 'Result will appear here when execution completes.'
            : 'No result data.'}
        </p>
      </div>
    )
  }

  const { result } = task
  const hasData       = result.data && Object.keys(result.data).length > 0
  const hasText       = Boolean(result.text_content)
  const hasLinks      = result.links && result.links.length > 0
  const hasScreenshot = Boolean(task.screenshot_url || result.screenshot_path)

  const TABS: Array<{ id: ResultTab; label: string; available: boolean }> = [
    { id: 'data',       label: 'Data',       available: Boolean(hasData) },
    { id: 'text',       label: 'Text',       available: Boolean(hasText) },
    { id: 'links',      label: `Links${hasLinks ? ` (${result.links!.length})` : ''}`, available: Boolean(hasLinks) },
    { id: 'screenshot', label: 'Screenshot', available: Boolean(hasScreenshot) },
  ]

  const availableTabs = TABS.filter((t) => t.available)

  if (availableTabs.length === 0) {
    return (
      <div className="space-y-3">
        {!result.success && result.error && (
          <div className="rounded-[var(--radius)] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] px-4 py-3">
            <p className="text-xs font-semibold text-[var(--danger)] mb-1">Error</p>
            <p className="text-xs text-[var(--text-muted)]">{result.error}</p>
          </div>
        )}
        <p className="text-sm text-[var(--text-muted)] text-center py-4">No output data captured.</p>
      </div>
    )
  }

  const currentTab = availableTabs.find((t) => t.id === activeTab) ? activeTab : availableTabs[0]!.id

  return (
    <div className="space-y-3">
      {/* Error banner */}
      {!result.success && result.error && (
        <div className="rounded-[var(--radius)] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] px-4 py-3">
          <p className="text-xs font-semibold text-[var(--danger)] mb-1">Execution Error</p>
          <p className="text-xs text-[var(--text-muted)]">{result.error}</p>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
        {result.page_title && <span>Title: <span className="text-[var(--text)]">{result.page_title}</span></span>}
        {result.final_url && result.final_url !== task.url && (
          <span>Redirected to: <span className="text-[var(--primary)]">{result.final_url.slice(0, 60)}</span></span>
        )}
        {result.execution_time_ms && (
          <span className="ml-auto">{(result.execution_time_ms / 1000).toFixed(2)}s</span>
        )}
      </div>

      {/* Tabs */}
      {availableTabs.length > 1 && (
        <div className="flex gap-1 border-b border-[var(--border)] pb-0">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-all border-b-2 -mb-px',
                currentTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div>
        {currentTab === 'data' && hasData && (
          <pre
            className={cn(
              'text-[11px] text-[var(--text)] bg-[var(--surface-elevated)] border border-[var(--border)]',
              'rounded-[var(--radius)] p-4 overflow-auto max-h-96 font-mono leading-relaxed'
            )}
          >
            {JSON.stringify(result.data, null, 2)}
          </pre>
        )}

        {currentTab === 'text' && hasText && (
          <pre
            className={cn(
              'text-[11px] text-[var(--text-secondary)] bg-[var(--surface-elevated)] border border-[var(--border)]',
              'rounded-[var(--radius)] p-4 overflow-auto max-h-96 whitespace-pre-wrap font-mono leading-relaxed'
            )}
          >
            {result.text_content}
          </pre>
        )}

        {currentTab === 'links' && hasLinks && (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {result.links!.slice(0, 20).map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[var(--primary)] hover:underline truncate"
              >
                <ExternalLink size={10} className="shrink-0" />
                <span className="truncate">{link}</span>
              </a>
            ))}
            {result.links!.length > 20 && (
              <p className="text-[10px] text-[var(--text-muted)] pt-1">
                +{result.links!.length - 20} more links
              </p>
            )}
          </div>
        )}

        {currentTab === 'screenshot' && hasScreenshot && (
          <div className="rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
            <Image
              src={task.screenshot_url ?? result.screenshot_path ?? ''}
              alt="Page screenshot"
              width={800}
              height={500}
              className="w-full h-auto max-h-[500px] object-contain"
              unoptimized
            />
          </div>
        )}
      </div>
    </div>
  )
}
