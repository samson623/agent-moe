'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Layers, Clock } from 'lucide-react'
import type { Campaign, TimelineMilestone, MilestoneStatus } from '@/features/launchpad/types'

interface CampaignTimelineProps {
  campaign: Campaign
}

function formatMilestoneDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const MILESTONE_STATUS_DOT: Record<MilestoneStatus, string> = {
  pending: 'bg-[var(--text-muted)]',
  running: 'bg-[var(--primary)] animate-pulse',
  completed: 'bg-[var(--success)]',
  skipped: 'bg-[var(--text-disabled)]',
}

const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  skipped: 'Skipped',
}

const MILESTONE_STATUS_BADGE: Record<
  MilestoneStatus,
  'muted' | 'default' | 'success' | 'warning'
> = {
  pending: 'muted',
  running: 'default',
  completed: 'success',
  skipped: 'muted',
}

interface MilestoneRowProps {
  milestone: TimelineMilestone
  isLast: boolean
}

function MilestoneRow({ milestone, isLast }: MilestoneRowProps) {
  return (
    <div className="flex gap-3">
      {/* Spine + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full mt-1 shrink-0 ring-2 ring-[var(--surface)]',
            MILESTONE_STATUS_DOT[milestone.status],
          )}
          aria-hidden="true"
        />
        {!isLast && (
          <div className="w-px flex-1 bg-[var(--border-subtle)] mt-1" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className={cn('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text)] leading-snug truncate">
              {milestone.title}
            </p>
            {milestone.description && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                {milestone.description}
              </p>
            )}
          </div>
          <Badge
            variant={MILESTONE_STATUS_BADGE[milestone.status]}
            className="text-[10px] shrink-0"
          >
            {MILESTONE_STATUS_LABEL[milestone.status]}
          </Badge>
        </div>

        {/* Footer: date + asset count */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <Clock size={9} aria-hidden="true" />
            <span>{formatMilestoneDate(milestone.date)}</span>
          </div>
          {milestone.asset_ids.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <Layers size={9} aria-hidden="true" />
              <span>
                {milestone.asset_ids.length} asset{milestone.asset_ids.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CampaignTimeline({ campaign }: CampaignTimelineProps) {
  if (campaign.timeline.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)]"
          style={{
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
          aria-hidden="true"
        >
          <Clock size={18} className="text-[var(--primary)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)] mb-1">No timeline milestones</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
            No milestone schedule has been set for this campaign yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {campaign.timeline.map((milestone, idx) => (
        <MilestoneRow
          key={`${milestone.date}-${milestone.title}-${idx}`}
          milestone={milestone}
          isLast={idx === campaign.timeline.length - 1}
        />
      ))}
    </div>
  )
}
