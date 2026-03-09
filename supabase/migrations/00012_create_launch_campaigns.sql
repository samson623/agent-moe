-- =============================================================================
-- Migration 00012: Create launch_campaigns table
-- =============================================================================
-- Purpose: Campaign orchestrator. Groups missions, assets, and an offer into
--          a coordinated launch sequence with a timeline. Powers the Launchpad
--          view where the user plans and executes multi-day content campaigns.
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.campaign_status AS ENUM (
    'draft',      -- Being assembled; not yet launched
    'active',     -- Actively running; timeline tasks executing
    'paused',     -- Temporarily paused; execution halted
    'completed',  -- All timeline tasks done; campaign wrapped
    'archived'    -- Completed and moved to archive
);

COMMENT ON TYPE public.campaign_status IS 'Lifecycle state of a launch campaign from planning to completion.';

-- =============================================================================
-- TABLE: launch_campaigns
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.launch_campaigns (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Campaign display name
    name          TEXT NOT NULL,

    -- Full campaign description and goals
    description   TEXT NOT NULL DEFAULT '',

    -- Lifecycle state
    status        public.campaign_status NOT NULL DEFAULT 'draft',

    -- Campaign schedule window
    launch_date   DATE,
    end_date      DATE,

    -- Array of mission UUIDs that belong to this campaign
    -- Denormalized for fast lookup; source of truth is the missions table
    mission_ids   UUID[] NOT NULL DEFAULT '{}',

    -- Array of asset UUIDs curated for this campaign
    -- Denormalized for fast lookup; source of truth is the assets table
    asset_ids     UUID[] NOT NULL DEFAULT '{}',

    -- The monetization offer this campaign is driving toward
    offer_id      UUID REFERENCES public.offers(id) ON DELETE SET NULL,

    -- Structured timeline: ordered list of campaign milestones and content drops
    -- Schema: Array of {
    --   date: string (ISO date),
    --   title: string,
    --   description: string,
    --   status: 'pending' | 'running' | 'completed' | 'skipped',
    --   asset_ids: string[],
    --   mission_id: string | null
    -- }
    timeline      JSONB NOT NULL DEFAULT '[]',

    -- Arbitrary metadata: target_revenue, target_leads, utm_params, notes
    meta          JSONB NOT NULL DEFAULT '{}',

    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.launch_campaigns IS 'Campaign orchestrator. Groups missions and assets into a coordinated launch sequence with timeline milestones. Powers the Launchpad view.';
COMMENT ON COLUMN public.launch_campaigns.workspace_id IS 'FK to workspaces. Owner workspace.';
COMMENT ON COLUMN public.launch_campaigns.name IS 'Campaign display name. e.g. "Q1 Course Launch", "Lead Magnet Blitz Week".';
COMMENT ON COLUMN public.launch_campaigns.description IS 'Full campaign brief: goals, target audience, key messages, success metrics.';
COMMENT ON COLUMN public.launch_campaigns.status IS 'Campaign lifecycle state: draft → active → paused/completed → archived.';
COMMENT ON COLUMN public.launch_campaigns.launch_date IS 'Planned campaign start date. NULL = date not yet set.';
COMMENT ON COLUMN public.launch_campaigns.end_date IS 'Planned campaign end date. NULL = open-ended or not yet set.';
COMMENT ON COLUMN public.launch_campaigns.mission_ids IS 'Denormalized array of mission UUIDs. All missions contributing content to this campaign.';
COMMENT ON COLUMN public.launch_campaigns.asset_ids IS 'Denormalized array of asset UUIDs curated for this campaign. Subset of assets from linked missions.';
COMMENT ON COLUMN public.launch_campaigns.offer_id IS 'FK to offers. The primary monetization offer this campaign promotes.';
COMMENT ON COLUMN public.launch_campaigns.timeline IS 'Ordered array of campaign milestones. Each item: { date, title, description, status, asset_ids, mission_id }.';
COMMENT ON COLUMN public.launch_campaigns.meta IS 'Flexible metadata: { target_revenue_cents, target_leads, utm_source, utm_campaign, notes }.';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

ALTER TABLE public.launch_campaigns
    ADD CONSTRAINT launch_campaigns_name_not_empty CHECK (length(trim(name)) > 0);

-- End date must be on or after launch date if both are set
ALTER TABLE public.launch_campaigns
    ADD CONSTRAINT launch_campaigns_date_range
    CHECK (end_date IS NULL OR launch_date IS NULL OR end_date >= launch_date);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.launch_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "launch_campaigns_select_owner"
    ON public.launch_campaigns
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "launch_campaigns_insert_owner"
    ON public.launch_campaigns
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "launch_campaigns_update_owner"
    ON public.launch_campaigns
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "launch_campaigns_delete_owner"
    ON public.launch_campaigns
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary Launchpad view: workspace campaigns by status
CREATE INDEX IF NOT EXISTS idx_launch_campaigns_workspace_status
    ON public.launch_campaigns (workspace_id, status);

-- Date-range queries for calendar view
CREATE INDEX IF NOT EXISTS idx_launch_campaigns_launch_date
    ON public.launch_campaigns (workspace_id, launch_date)
    WHERE launch_date IS NOT NULL;

-- Active campaigns (used for dashboard summary)
CREATE INDEX IF NOT EXISTS idx_launch_campaigns_active
    ON public.launch_campaigns (workspace_id)
    WHERE status = 'active';

-- Offer-linked campaigns
CREATE INDEX IF NOT EXISTS idx_launch_campaigns_offer_id
    ON public.launch_campaigns (offer_id)
    WHERE offer_id IS NOT NULL;
