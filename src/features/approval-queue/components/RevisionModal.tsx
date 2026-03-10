'use client'

import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RevisionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (notes: string) => void
  isPending: boolean
}

export function RevisionModal({ isOpen, onClose, onConfirm, isPending }: RevisionModalProps) {
  const [notes, setNotes] = useState('')
  const isValid = notes.trim().length >= 10

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!isValid) return
    onConfirm(notes.trim())
    setNotes('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Send for revision"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md mx-4',
          'bg-[var(--surface-elevated)] border border-[var(--border)]',
          'rounded-[var(--radius)] shadow-[0_24px_64px_rgba(0,0,0,0.5)]',
          'p-6',
        )}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <RotateCcw size={16} className="text-amber-400" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text)]">Send for Revision</h2>
        </div>

        <p className="text-sm text-[var(--text-muted)] mb-4">
          Describe what needs to be changed. This will move the asset back to draft status.
        </p>

        {/* Textarea */}
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value) }}
          placeholder="Describe what needs to be changed..."
          rows={4}
          className={cn(
            'w-full px-3 py-2.5 text-sm rounded-[var(--radius)]',
            'bg-[var(--surface)] border border-[var(--border)]',
            'text-[var(--text)] placeholder:text-[var(--text-disabled)]',
            'focus:outline-none focus:ring-1 focus:ring-[var(--primary)]',
            'resize-none transition-colors',
          )}
        />

        {notes.length > 0 && notes.trim().length < 10 && (
          <p className="text-xs text-red-400 mt-1">Please provide at least 10 characters.</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-1"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <RotateCcw size={12} className="mr-1.5" />
            {isPending ? 'Sending…' : 'Send for Revision'}
          </Button>
        </div>
      </div>
    </div>
  )
}
