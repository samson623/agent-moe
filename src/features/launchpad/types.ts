/**
 * Launchpad — domain types.
 *
 * These types describe the data structures used by the Launchpad feature:
 * campaign management, launch timelines, and milestone tracking. They are
 * intentionally decoupled from the Supabase schema so the feature layer can
 * evolve independently of the DB shape.
 */

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/**
 * A single milestone within a campaign timeline. Each milestone can reference
 * one or more assets and optionally link to a mission that drives execution.
 */
export interface TimelineMilestone {
  date: string // ISO date 'YYYY-MM-DD'
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'skipped'
  asset_ids: string[]
  mission_id: string | null
}

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

/**
 * A campaign coordinates a set of missions and assets around a focused launch.
 * The timeline field stores ordered milestones so the Launchpad UI can render
 * a visual progress track.
 */
export interface Campaign {
  id: string
  workspace_id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  launch_date: string | null
  end_date: string | null
  mission_ids: string[]
  asset_ids: string[]
  offer_id: string | null
  timeline: TimelineMilestone[]
  meta: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/**
 * Aggregate campaign stats computed for a workspace.
 */
export interface CampaignStats {
  total: number
  active: number
  draft: number
  completed: number
  archived: number
  total_assets: number
}

// ---------------------------------------------------------------------------
// Mutation Inputs
// ---------------------------------------------------------------------------

/**
 * Input for creating a new campaign.
 */
export interface CreateCampaignInput {
  workspace_id: string
  name: string
  description?: string
  launch_date?: string | null
  end_date?: string | null
  offer_id?: string | null
  meta?: Record<string, unknown>
}

/**
 * Partial update payload for an existing campaign.
 */
export interface UpdateCampaignInput {
  name?: string
  description?: string
  status?: Campaign['status']
  launch_date?: string | null
  end_date?: string | null
  offer_id?: string | null
  meta?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Convenience aliases
// ---------------------------------------------------------------------------

export type CampaignStatus = Campaign['status']
export type MilestoneStatus = TimelineMilestone['status']
