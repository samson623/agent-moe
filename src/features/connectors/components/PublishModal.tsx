'use client'

import { useState } from 'react'
import { X, Send, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePublish } from '@/features/connectors/hooks/use-publish'
import type { Connector } from '@/features/connectors/hooks/use-connectors'
import type { PublishResult } from '@/features/connectors/hooks/use-publish'

type ContentType = 'post' | 'thread' | 'script' | 'caption' | 'video_concept' | 'cta'

interface PublishModalProps {
  open: boolean
  connector: Connector | null
  onClose: () => void
  onSuccess?: () => void
  loading?: boolean
}

export function PublishModal({ open, connector, onClose, onSuccess }: PublishModalProps) {
  const { publish, loading } = usePublish()
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<ContentType>('post')
  const [title, setTitle] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublishResult | null>(null)

  if (!open || !connector) return null

  const handlePublish = async () => {
    if (!content.trim()) { setError('Content is required'); return }
    setError(null)
    setResult(null)

    const hashtagArr = hashtags
      .split(',')
      .map((h) => h.trim().replace(/^#/, ''))
      .filter(Boolean)

    const res = await publish(connector.id, {
      content: content.trim(),
      contentType,
      title: title.trim() || undefined,
      hashtags: hashtagArr.length > 0 ? hashtagArr : undefined,
    })

    setResult(res)
    if (res.success) {
      onSuccess?.()
    } else {
      setError(res.error ?? 'Publish failed')
    }
  }

  const handleClose = () => {
    setContent('')
    setTitle('')
    setHashtags('')
    setError(null)
    setResult(null)
    onClose()
  }

  const CONTENT_TYPES: { value: ContentType; label: string }[] = [
    { value: 'post', label: 'Post' },
    { value: 'thread', label: 'Thread' },
    { value: 'script', label: 'Script' },
    { value: 'caption', label: 'Caption' },
    { value: 'video_concept', label: 'Video' },
    { value: 'cta', label: 'CTA' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className={cn(
        'relative z-10 w-full max-w-md rounded-[var(--radius-lg)]',
        'bg-[var(--surface)] border border-[var(--border)]',
        'shadow-2xl'
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Publish to {connector.name}</h3>
            <p className="text-[10px] text-[var(--text-muted)] capitalize">{connector.platform}</p>
          </div>
          <button onClick={handleClose} className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {result?.success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={32} className="text-[var(--success)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Published!</p>
                {result.externalPostUrl && (
                  <a
                    href={result.externalPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 justify-center mt-1"
                  >
                    View post <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={handleClose}>Done</Button>
            </div>
          ) : (
            <>
              {/* Content type */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Content Type
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {CONTENT_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setContentType(value)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-medium transition-all',
                        contentType === value
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title (for YouTube / Notion) */}
              {(contentType === 'video_concept' || connector.platform === 'notion') && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title..."
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-[var(--radius)]',
                      'bg-[var(--surface-elevated)] border border-[var(--border)]',
                      'text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                      'focus:outline-none focus:border-[var(--primary)]'
                    )}
                  />
                </div>
              )}

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter content to publish..."
                  rows={6}
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-[var(--radius)] resize-none',
                    'bg-[var(--surface-elevated)] border border-[var(--border)]',
                    'text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                    'focus:outline-none focus:border-[var(--primary)]'
                  )}
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{content.length} characters</p>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Hashtags (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="ai, contentmarketing, growth"
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-[var(--radius)]',
                    'bg-[var(--surface-elevated)] border border-[var(--border)]',
                    'text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                    'focus:outline-none focus:border-[var(--primary)]'
                  )}
                />
              </div>

              {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

              <Button className="w-full gap-1.5" onClick={handlePublish} disabled={loading}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Publish
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
