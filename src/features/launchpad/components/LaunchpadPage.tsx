'use client'

import { useState, useCallback } from 'react'
import {
  Rocket,
  Plus,
  X,
  AlertCircle,
  Layers,
  Calendar,
  FileText,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import {
  useCampaigns,
  useCampaignDetail,
  useCampaignStats,
  useLaunchCampaign,
} from '@/features/launchpad/hooks'
import type { Campaign, CampaignStatus } from '@/features/launchpad/types'
import { CampaignStats } from './CampaignStats'
import { CampaignFilters } from './CampaignFilters'
import { CampaignCard } from './CampaignCard'
import { CampaignForm } from './CampaignForm'
import { CampaignTimeline } from './CampaignTimeline'
import { LaunchControls } from './LaunchControls'
import { LaunchModal } from './LaunchModal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatusFilter = CampaignStatus | 'all'
type DetailTab = 'overview' | 'timeline' | 'assets'

interface LaunchpadPageProps {
  workspaceId: string
}

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<
  CampaignStatus,
  'muted' | 'success' | 'warning' | 'accent' | 'default'
> = {
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

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--surface-elevated)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/5 bg-[var(--surface-elevated)] rounded" />
          <div className="h-3 w-4/5 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="h-3 w-16 bg-[var(--surface-elevated)] rounded" />
        <div className="h-3 w-20 bg-[var(--surface-elevated)] rounded" />
        <div className="h-3 w-24 bg-[var(--surface-elevated)] rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-14 bg-[var(--surface-elevated)] rounded-[var(--radius)]" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  campaignId: string
  onClose: () => void
  onLaunch: (campaign: Campaign) => void
  onDeleted: () => void
}

function DetailPanel({ campaignId, onClose, onLaunch, onDeleted }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const { campaign, loading, error, remove } = useCampaignDetail(campaignId)

  const DETAIL_TABS: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'assets', label: 'Assets' },
  ]

  async function handleDelete() {
    if (!campaign) return
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return
    try {
      await remove()
      onDeleted()
    } catch {
      // error is shown inline via the hook
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-solid)]',
      )}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" aria-hidden="true" />
          {loading ? (
            <div className="h-4 w-40 bg-[var(--surface-elevated)] rounded animate-pulse" />
          ) : campaign ? (
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--text)] truncate max-w-[200px]">
                {campaign.name}
              </h3>
              <Badge variant={STATUS_BADGE[campaign.status]} className="text-xs shrink-0">
                {STATUS_LABEL[campaign.status]}
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {campaign && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-elevated)] transition-colors"
              aria-label={`Delete campaign ${campaign.name}`}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors"
            aria-label="Close detail panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-[var(--border-subtle)] px-5">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-2.5 text-xs font-medium transition-colors duration-100',
              'border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-[var(--text)] border-[var(--primary)]'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-5/6 bg-[var(--surface-elevated)] rounded" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2.5 text-[var(--danger)] py-4">
            <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
            <p className="text-xs">{error}</p>
          </div>
        ) : !campaign ? null : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab campaign={campaign} onLaunch={onLaunch} />
            )}
            {activeTab === 'timeline' && (
              <CampaignTimeline campaign={campaign} />
            )}
            {activeTab === 'assets' && (
              <AssetsTab campaign={campaign} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface OverviewTabProps {
  campaign: Campaign
  onLaunch: (campaign: Campaign) => void
}

function OverviewTab({ campaign, onLaunch }: OverviewTabProps) {
  const canLaunch = campaign.status === 'draft' || campaign.status === 'paused'

  return (
    <div className="space-y-5">
      {/* Description */}
      <div>
        <p className="text-sm font-medium text-[var(--text-muted)] mb-1.5">
          Description
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {campaign.description || 'No description provided.'}
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
            Launch Date
          </p>
          <div className="flex items-center gap-1.5 text-sm text-[var(--text)]">
            <Calendar size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
            {formatDate(campaign.launch_date)}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
            End Date
          </p>
          <div className="flex items-center gap-1.5 text-sm text-[var(--text)]">
            <Calendar size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
            {formatDate(campaign.end_date)}
          </div>
        </div>
      </div>

      {/* Offer ID */}
      {campaign.offer_id && (
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
            Linked Offer
          </p>
          <Badge variant="default" className="text-xs font-mono">
            {campaign.offer_id}
          </Badge>
        </div>
      )}

      {/* Meta — only if non-empty */}
      {Object.keys(campaign.meta).length > 0 && (
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mb-1.5">
            Metadata
          </p>
          <pre className="text-xs text-[var(--text-muted)] bg-[var(--surface-elevated)] rounded-[var(--radius)] px-3 py-2 overflow-x-auto">
            {JSON.stringify(campaign.meta, null, 2)}
          </pre>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center gap-4 pt-1">
        <p className="text-xs text-[var(--text-disabled)]">
          Created {formatDate(campaign.created_at)}
        </p>
        <p className="text-xs text-[var(--text-disabled)]">
          Updated {formatDate(campaign.updated_at)}
        </p>
      </div>

      {/* Launch CTA */}
      {canLaunch && (
        <div className="pt-2">
          <Button
            variant="accent"
            onClick={() => onLaunch(campaign)}
            aria-label={`Launch campaign: ${campaign.name}`}
            className="w-full"
          >
            <Rocket size={14} aria-hidden="true" />
            Launch Campaign
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assets tab
// ---------------------------------------------------------------------------

interface AssetsTabProps {
  campaign: Campaign
}

function AssetsTab({ campaign }: AssetsTabProps) {
  if (campaign.asset_ids.length === 0) {
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
          <Layers size={18} className="text-[var(--primary)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)] mb-1">No assets staged</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
            Assign content assets to this campaign to stage them for launch.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          aria-label="Add assets to campaign"
        >
          <Plus size={13} aria-hidden="true" />
          Add Assets
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--text-muted)]">
          {campaign.asset_ids.length} asset{campaign.asset_ids.length !== 1 ? 's' : ''} staged
        </p>
        <Button
          size="xs"
          variant="outline"
          aria-label="Add more assets"
        >
          <Plus size={11} aria-hidden="true" />
          Add
        </Button>
      </div>

      <div className="space-y-1.5">
        {campaign.asset_ids.map((assetId) => (
          <div
            key={assetId}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius)]',
              'border border-[var(--border-subtle)] bg-[var(--surface-elevated)]',
            )}
          >
            <FileText size={12} className="text-[var(--text-muted)] shrink-0" aria-hidden="true" />
            <span className="text-xs text-[var(--text)] font-mono truncate">{assetId}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  onCreateClick: () => void
}

function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-xl)] border border-[var(--border)]',
        'bg-[var(--surface-solid)] p-14 text-center overflow-hidden',
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-4">
        <div
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-[var(--radius-xl)]',
            'border border-[rgba(124,58,237,0.3)]',
          )}
          style={{ background: 'rgba(124,58,237,0.12)' }}
          aria-hidden="true"
        >
          <Rocket size={24} className="text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[var(--text)] mb-1.5">No campaigns yet</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            Create your first campaign to coordinate missions and assets into a
            sequenced, multi-platform launch.
          </p>
        </div>
        <Button
          onClick={onCreateClick}
          className="flex items-center gap-2"
          aria-label="Create your first campaign"
        >
          <Plus size={14} aria-hidden="true" />
          New Campaign
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function LaunchpadPage({ workspaceId }: LaunchpadPageProps) {
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>('all')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [launchTarget, setLaunchTarget] = useState<Campaign | null>(null)

  // Campaigns list
  const {
    campaigns,
    total,
    loading: campaignsLoading,
    error: campaignsError,
    refresh: refreshCampaigns,
  } = useCampaigns(workspaceId, {
    status: activeStatusFilter === 'all' ? undefined : activeStatusFilter,
  })

  // Stats bar
  const { stats, loading: statsLoading } = useCampaignStats(workspaceId)

  // Launch hook
  const { launch, launching } = useLaunchCampaign()

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCampaignCreated = useCallback(
    (campaign: Campaign) => {
      setShowCreateForm(false)
      refreshCampaigns()
      setSelectedCampaignId(campaign.id)
    },
    [refreshCampaigns],
  )

  const handleLaunchTrigger = useCallback((campaign: Campaign) => {
    setLaunchTarget(campaign)
  }, [])

  const handleLaunchCardTrigger = useCallback(
    (id: string) => {
      const found = campaigns.find((c) => c.id === id)
      if (found) setLaunchTarget(found)
    },
    [campaigns],
  )

  const handleLaunchConfirm = useCallback(async () => {
    if (!launchTarget) return
    await launch(launchTarget.id)
    setLaunchTarget(null)
    refreshCampaigns()
    // If the launched campaign is open in detail, keep it selected — it will refresh
  }, [launch, launchTarget, refreshCampaigns])

  const handleCampaignDeleted = useCallback(() => {
    setSelectedCampaignId(null)
    refreshCampaigns()
  }, [refreshCampaigns])

  const handleFilterChange = useCallback((status: StatusFilter) => {
    setActiveStatusFilter(status)
    setSelectedCampaignId(null)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  const showDetailPanel = selectedCampaignId !== null

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <MotionFadeIn>
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
            aria-label="Create a new campaign"
          >
            <Plus size={15} aria-hidden="true" />
            New Campaign
          </Button>
        </div>
      </MotionFadeIn>

      {/* Stats bar */}
      <MotionFadeIn delay={0.05}>
        <CampaignStats stats={stats} loading={statsLoading} />
      </MotionFadeIn>

      {/* Main content area */}
      <div
        className={cn(
          'grid gap-7',
          showDetailPanel ? 'grid-cols-1 lg:grid-cols-[1fr_380px]' : 'grid-cols-1',
        )}
      >
        {/* Left: campaign list */}
        <div className="space-y-4">
          {/* Filters */}
          <CampaignFilters activeStatus={activeStatusFilter} onChange={handleFilterChange} />

          {/* List card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Campaigns</CardTitle>
                <Badge variant="muted">{total} total</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0 pb-3">
              {campaignsLoading ? (
                <div className="p-3 space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : campaignsError ? (
                <div className="flex items-center gap-2.5 px-5 py-6 text-[var(--danger)]">
                  <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
                  <p className="text-sm">{campaignsError}</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="px-3 py-3">
                  <EmptyState onCreateClick={() => setShowCreateForm(true)} />
                </div>
              ) : (
                <MotionStagger className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {campaigns.map((campaign) => (
                    <MotionStaggerItem key={campaign.id}>
                      <CampaignCard
                        campaign={campaign}
                        onSelect={(id) => {
                          setSelectedCampaignId((prev) => (prev === id ? null : id))
                        }}
                        onLaunch={handleLaunchCardTrigger}
                      />
                    </MotionStaggerItem>
                  ))}
                </MotionStagger>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: detail panel + launch controls */}
        {showDetailPanel && selectedCampaignId && (
          <div className="space-y-4">
            <DetailPanel
              campaignId={selectedCampaignId}
              onClose={() => setSelectedCampaignId(null)}
              onLaunch={handleLaunchTrigger}
              onDeleted={handleCampaignDeleted}
            />
            <LaunchControls
              campaign={campaigns.find((c) => c.id === selectedCampaignId) ?? null}
              workspaceId={workspaceId}
            />
          </div>
        )}
      </div>

      {/* Create campaign modal */}
      {showCreateForm && (
        <CampaignForm
          workspaceId={workspaceId}
          onSuccess={handleCampaignCreated}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Launch confirmation modal */}
      {launchTarget && (
        <LaunchModal
          campaign={launchTarget}
          onConfirm={handleLaunchConfirm}
          onClose={() => setLaunchTarget(null)}
          launching={launching}
        />
      )}
    </div>
  )
}
