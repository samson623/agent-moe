'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Rocket,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MissionInputProps {
  onSubmit: (title: string, description?: string) => Promise<void>;
  isSubmitting: boolean;
}

type Priority = 'low' | 'normal' | 'high' | 'urgent';

const PRIORITIES: { value: Priority; label: string; color: string; ring: string }[] = [
  {
    value: 'low',
    label: 'Low',
    color: 'text-[var(--text-muted)] bg-[var(--surface-elevated)] border-[var(--border)]',
    ring: 'ring-[var(--text-muted)]',
  },
  {
    value: 'normal',
    label: 'Normal',
    color: 'text-[var(--primary)] bg-[var(--primary-muted)] border-[rgba(59,130,246,0.25)]',
    ring: 'ring-[var(--primary)]',
  },
  {
    value: 'high',
    label: 'High',
    color: 'text-[var(--warning)] bg-[var(--warning-muted)] border-[rgba(245,158,11,0.25)]',
    ring: 'ring-[var(--warning)]',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    color: 'text-[var(--danger)] bg-[var(--danger-muted)] border-[rgba(239,68,68,0.25)]',
    ring: 'ring-[var(--danger)]',
  },
];

export function MissionInput({ onSubmit, isSubmitting }: MissionInputProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [showDescription, setShowDescription] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = title.trim().length > 0 && !isSubmitting && !showSuccess;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    try {
      await onSubmit(title.trim(), description.trim() || undefined);
      setShowSuccess(true);
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setPriority('normal');
        setShowDescription(false);
        setShowSuccess(false);
        titleRef.current?.focus();
      }, 1500);
    } catch {
      // Error handling delegated to parent
    }
  }, [canSubmit, title, description, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card
      glow="primary"
      className={cn(
        'relative overflow-hidden',
        'bg-gradient-to-br from-[var(--surface)] to-[var(--surface-elevated)]',
        'shadow-[0_0_40px_rgba(59,130,246,0.06)]'
      )}
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none grid-bg"
        aria-hidden="true"
      />

      <div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none opacity-[0.04] blur-3xl bg-[var(--primary)]"
        aria-hidden="true"
      />

      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-[var(--radius)]',
              'bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]',
              'shadow-[0_0_16px_rgba(59,130,246,0.3)]'
            )}
          >
            <Rocket size={16} className="text-white" />
          </div>
          <div>
            <CardTitle className="text-base">New Mission</CardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Define objectives for your operator teams
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="space-y-2">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What should the operators do?"
            disabled={isSubmitting || showSuccess}
            rows={2}
            aria-label="Mission title"
            className={cn(
              'w-full resize-none rounded-[var(--radius-lg)] border border-[var(--border)]',
              'bg-[var(--surface)] text-[var(--text)] text-[17px]',
              'px-5 py-3.5 placeholder:text-[var(--text-disabled)]',
              'transition-all duration-200',
              'focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]',
              'focus:shadow-[0_0_16px_rgba(59,130,246,0.1)]',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          />

          {!showDescription ? (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className={cn(
                'flex items-center gap-1.5 text-xs text-[var(--text-muted)]',
                'hover:text-[var(--primary)] transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
                'rounded-[var(--radius-sm)] px-1 py-0.5'
              )}
            >
              <ChevronDown size={12} />
              Add details
            </button>
          ) : (
            <div className="animate-fade-in space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Mission details</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowDescription(false);
                    setDescription('');
                  }}
                  className={cn(
                    'flex items-center gap-1 text-xs text-[var(--text-muted)]',
                    'hover:text-[var(--text-secondary)] transition-colors duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
                    'rounded-[var(--radius-sm)] px-1 py-0.5'
                  )}
                >
                  <ChevronUp size={12} />
                  Hide
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Additional context, constraints, or specific instructions..."
                disabled={isSubmitting || showSuccess}
                rows={3}
                aria-label="Mission description"
                className={cn(
                  'w-full resize-none rounded-[var(--radius)] border border-[var(--border)]',
                  'bg-[var(--surface-elevated)] text-[var(--text)] text-sm',
                  'px-3 py-2.5 placeholder:text-[var(--text-disabled)]',
                  'transition-all duration-200',
                  'focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Priority
          </span>
          <div className="flex gap-2" role="radiogroup" aria-label="Mission priority">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={priority === p.value}
                onClick={() => setPriority(p.value)}
                disabled={isSubmitting || showSuccess}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border',
                  'transition-all duration-150 cursor-pointer',
                  'focus:outline-none focus-visible:ring-2',
                  p.ring,
                  priority === p.value
                    ? cn(p.color, 'shadow-sm')
                    : 'text-[var(--text-disabled)] bg-transparent border-[var(--border-subtle)] hover:border-[var(--border)] hover:text-[var(--text-muted)]',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-[var(--text-disabled)]">
            {title.trim().length > 0 && (
              <>
                <Sparkles size={10} className="inline mr-1 -mt-px" />
                <kbd className="text-[10px] px-1 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
                  ⌘
                </kbd>
                {' + '}
                <kbd className="text-[10px] px-1 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
                  Enter
                </kbd>
                {' to launch'}
              </>
            )}
          </span>

          <Button
            variant="success"
            size="default"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={cn(
              'gap-2 min-w-[140px]',
              showSuccess && 'bg-[var(--success)] pointer-events-none'
            )}
            aria-label={showSuccess ? 'Mission deployed' : 'Launch mission'}
          >
            {showSuccess ? (
              <>
                <CheckCircle2 size={15} className="animate-fade-in" />
                Deployed!
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Send size={14} />
                Launch Mission
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
