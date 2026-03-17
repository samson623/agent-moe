'use client';

import { useState } from 'react';
import {
  Wand2,
  Search,
  Globe,
  Briefcase,
  Wallet,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard, Pill } from '@/components/nebula';
import type { TrendSignal } from '../types';

interface GrowthActionsPanelProps {
  selectedSignal: TrendSignal | null;
  workspaceId: string;
}

const ACTIONS = [
  { id: 'hooks', label: 'Generate 8 stronger hooks', icon: Wand2 },
  { id: 'gaps', label: 'Create a competitor gap report', icon: Search },
  { id: 'clone', label: 'Clone best angle across platforms', icon: Globe },
  { id: 'magnet', label: 'Build a lead magnet around this signal', icon: Briefcase },
  { id: 'revenue', label: 'Push signal to Revenue Closer', icon: Wallet },
] as const;

export function GrowthActionsPanel({
  selectedSignal,
  workspaceId,
}: GrowthActionsPanelProps) {
  const [triggered, setTriggered] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  async function handleAction(actionId: string) {
    if (!selectedSignal) return;
    setPending(actionId);

    try {
      // Create a mission with the action as the objective
      const action = ACTIONS.find((a) => a.id === actionId);
      const title = `${action?.label ?? actionId} — ${selectedSignal.topic}`;

      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title,
          description: `Signal: ${selectedSignal.topic} (score: ${selectedSignal.opportunity_score})\nAction: ${action?.label}`,
          priority: 'high',
        }),
      });

      setTriggered((prev) => new Set(prev).add(actionId));
    } catch {
      // silently handle
    } finally {
      setPending(null);
    }
  }

  return (
    <SectionCard
      title="Growth Actions"
      subtitle={
        selectedSignal
          ? `Actions for "${selectedSignal.topic}"`
          : 'Select a signal to unlock actions'
      }
      action={
        selectedSignal ? (
          <Pill tone="success">Signal selected</Pill>
        ) : (
          <Pill tone="muted">No signal</Pill>
        )
      }
    >
      <div className="space-y-2">
        {ACTIONS.map(({ id, label, icon: Icon }) => {
          const done = triggered.has(id);
          const loading = pending === id;
          const disabled = !selectedSignal || loading;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleAction(id)}
              disabled={disabled}
              className={cn(
                'flex w-full items-center justify-between rounded-[var(--radius)] border px-4 py-3 text-left text-sm transition-colors',
                disabled
                  ? 'border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-disabled)] cursor-not-allowed'
                  : done
                    ? 'border-[rgba(52,211,153,0.2)] bg-[var(--success-muted)] text-[var(--success)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
              )}
            >
              <span className="flex items-center gap-3">
                {loading ? (
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                ) : done ? (
                  <CheckCircle2 size={16} className="shrink-0" />
                ) : (
                  <Icon size={16} className="shrink-0 text-[var(--primary)]" />
                )}
                {label}
              </span>
              {!done && !loading && (
                <ChevronRight size={14} className="text-[var(--text-disabled)]" />
              )}
              {done && <Pill tone="success">Queued</Pill>}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
