'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AssetEditorProps {
  body: string
  title: string | null
  isEditing: boolean
  onSave: (body: string, title: string | null) => Promise<void>
  onCancel: () => void
}

export function AssetEditor({
  body,
  title,
  isEditing,
  onSave,
  onCancel,
}: AssetEditorProps) {
  const [editBody, setEditBody] = useState(body)
  const [editTitle, setEditTitle] = useState(title ?? '')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasChanges = editBody !== body || editTitle !== (title ?? '')

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (isEditing) {
      setEditBody(body)
      setEditTitle(title ?? '')
    }
  }, [isEditing, body, title])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      autoResize()
    }
  }, [isEditing, autoResize])

  useEffect(() => {
    autoResize()
  }, [editBody, autoResize])

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(editBody, editTitle || null)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEditBody(body)
    setEditTitle(title ?? '')
    onCancel()
  }

  useEffect(() => {
    if (!isEditing || !hasChanges) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isEditing, hasChanges])

  if (!isEditing) {
    return (
      <div className="space-y-3">
        {title && (
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
        )}
        <div
          className={cn(
            'text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap',
            'p-4 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)]',
            'border border-[var(--border)]',
          )}
        >
          {body || (
            <span className="text-[var(--text-disabled)] italic">No content</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Title
        </label>
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Asset title (optional)"
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Content
        </label>
        <textarea
          ref={textareaRef}
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          className={cn(
            'flex w-full rounded-[var(--radius)] border border-[var(--border)]',
            'bg-[var(--surface-elevated)] text-[var(--text)]',
            'px-3 py-2 text-sm leading-relaxed',
            'placeholder:text-[var(--text-disabled)]',
            'transition-all duration-150',
            'focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]',
            'resize-none overflow-hidden min-h-[120px]',
          )}
          placeholder="Write your content..."
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)] tabular-nums">
          {editBody.length} characters
          {hasChanges && (
            <span className="ml-2 text-[var(--warning)]">Unsaved changes</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <span
                  className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
