'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Mail,
  Send,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard, Pill } from '@/components/nebula';
import type { Campaign } from '@/features/launchpad/types';

interface LaunchControlsProps {
  campaign: Campaign | null;
  workspaceId: string;
}

const CONTROLS = [
  { id: 'copy', label: 'Generate launch copy', icon: MessageSquare },
  { id: 'visuals', label: 'Create hero visuals', icon: ImageIcon },
  { id: 'clips', label: 'Cut 8 short-form clips', icon: Video },
  { id: 'emails', label: 'Stage nurture emails', icon: Mail },
  { id: 'publish', label: 'Publish after approval', icon: Send },
] as const;

export function LaunchControls({ campaign, workspaceId }: LaunchControlsProps) {
  const [triggered, setTriggered] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  async function handleAction(controlId: string) {
    if (!campaign) return;
    setPending(controlId);

    try {
      const control = CONTROLS.find((c) => c.id === controlId);
      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title: `${control?.label ?? controlId} — ${campaign.name}`,
          description: `Campaign: ${campaign.name}\nAction: ${control?.label}`,
          priority: 'high',
        }),
      });

      setTriggered((prev) => new Set(prev).add(controlId));
    } catch {
      // silently handle
    } finally {
      setPending(null);
    }
  }

  return (
    <SectionCard
      title="Launch Controls"
      subtitle={
        campaign
          ? `Actions for "${campaign.name}"`
          : 'Select a campaign to unlock controls'
      }
    >
      <div className="space-y-2">
        {CONTROLS.map(({ id, label, icon: Icon }) => {
          const done = triggered.has(id);
          const loading = pending === id;
          const disabled = !campaign || loading;

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
