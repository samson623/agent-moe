'use client'

import { useState } from 'react'
import { Calendar, Layers, Flag, ArrowUpRight, Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Campaign, CampaignStatus } from '@/features/launchpad/types'

// Status → badge variant mapping
const STATUS_BADGE: Record<CampaignStatus, 'muted' | 'success' | 'warning' | 'accent' | 'default'> = {
  draft: 'muted',
  active: 'success',
  paused: 'warning',
  completed: 'accent',
  archived: 'muted',
}

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
}

function formatDate(iso: string | null): string {
  if (!iso) return 'No date set'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface CampaignCardProps {
  campaign: Campaign
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
}

export function CampaignCard({ campaign, onSelect, onLaunch }: CampaignCardProps) {
  const [hovered, setHovered] = useState(false)

  const canLaunch = campaign.status === 'draft' || campaign.status === 'paused'

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 p-4 rounded-[var(--radius-lg)]',
        'border border-[var(--border)] bg-[var(--surface)]',
        'transition-all duration-150 cursor-pointer',
        hovered && 'bg-[var(--surface-hover)] border-[var(--border)]',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(campaign.id)}
      role="button"
      tabIndex={0}
      aria-label={`View campaign: ${campaign.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(campaign.id)
        }
      }}
    >
      {/* Top row: icon + name + status */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-[var(--radius)] shrink-0 mt-0.5',
            'bg-[var(--primary-muted)] border border-[rgba(59,130,246,0.2)]',
          )}
          aria-hidden="true"
        >
          <Rocket size={13} className="text-[var(--primary)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[var(--text)] truncate max-w-[180px]">
              {campaign.name}
            </p>
            <Badge variant={STATUS_BADGE[campaign.status]} className="capitalize text-xs shrink-0">
              {STATUS_LABEL[campaign.status]}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
            {campaign.description || 'No description provided.'}
          </p>
        </div>

        {/* Hover arrow */}
        <span
          className={cn(
            'shrink-0 text-[var(--primary)] transition-all duration-150 mt-0.5',
            hovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1',
          )}
          aria-hidden="true"
        >
          <ArrowUpRight size={14} />
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Asset count */}
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Layers size={10} aria-hidden="true" />
          <span>
            {campaign.asset_ids.length} asset{campaign.asset_ids.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Milestone count */}
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Flag size={10} aria-hidden="true" />
          <span>
            {campaign.timeline.length} milestone{campaign.timeline.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Launch date */}
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Calendar size={10} aria-hidden="true" />
          <span>{formatDate(campaign.launch_date)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="xs"
          variant="outline"
          onClick={() => onSelect(campaign.id)}
          aria-label={`View details for ${campaign.name}`}
        >
          View
        </Button>

        {canLaunch && (
          <Button
            size="xs"
            variant="success"
            onClick={() => onLaunch(campaign.id)}
            aria-label={`Launch campaign: ${campaign.name}`}
          >
            Launch
          </Button>
        )}
      </div>
    </div>
  )
}
