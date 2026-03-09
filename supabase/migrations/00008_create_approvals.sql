-- =============================================================================
-- Migration 00008: Create approvals table
-- =============================================================================
-- Purpose: The safety and control layer. Every flagged asset and every
--          high-risk job must pass through the approval queue before
--          execution or publishing. Provides complete audit trail of all
--          approval decisions with risk scoring and flag tracking.
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.approval_status AS ENUM (
    'pending',             -- Awaiting review (in queue)
    'approved',            -- Approved — proceed with publishing/execution
    'rejected',            -- Rejected — discard or send back to operator
    'revision_requested'   -- Needs changes — returned to originating operator
);

CREATE TYPE public.risk_level AS ENUM (
    'low',      -- Minimal brand risk; may auto-approve based on threshold
    'medium',   -- Some flags detected; recommend review
    'high',     -- Multiple or serious flags; human review required
    'critical'  -- Severe violations; blocked regardless of safety_level setting
);

COMMENT ON TYPE public.approval_status IS 'Decision state of an approval request.';
COMMENT ON TYPE public.risk_level IS 'Risk assessment level assigned by Brand Guardian. Higher risk = stricter review requirement.';

-- =============================================================================
-- TABLE: approvals
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.approvals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- The asset being reviewed (nullable — some approvals cover a job, not an asset)
    asset_id        UUID REFERENCES public.assets(id) ON DELETE CASCADE,

    -- The job being reviewed (nullable — some approvals cover an asset, not a job)
    job_id          UUID REFERENCES public.jobs(id) ON DELETE CASCADE,

    -- Who/what submitted this for approval ('system', 'brand_guardian', 'user')
    requested_by    TEXT NOT NULL DEFAULT 'system',

    -- The user who reviewed this (NULL until reviewed)
    reviewed_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Current decision state
    status          public.approval_status NOT NULL DEFAULT 'pending',

    -- Risk assessment from Brand Guardian
    risk_level      public.risk_level NOT NULL DEFAULT 'low',

    -- Specific flags raised by Brand Guardian (e.g. 'blocked_phrase', 'unverified_claim', 'competitor_mention')
    risk_flags      TEXT[] NOT NULL DEFAULT '{}',

    -- Reviewer notes or Brand Guardian reasoning
    notes           TEXT,

    -- Whether this was approved automatically (no human review)
    auto_approved   BOOLEAN NOT NULL DEFAULT FALSE,

    -- When the approval was requested
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- When the approval decision was made (NULL until reviewed)
    reviewed_at     TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.approvals IS 'Approval queue for assets and jobs. Provides audit trail of all Brand Guardian and user approval decisions.';
COMMENT ON COLUMN public.approvals.workspace_id IS 'FK to workspaces. Workspace that owns this approval request.';
COMMENT ON COLUMN public.approvals.asset_id IS 'FK to assets. The asset under review. NULL if this approval covers a job.';
COMMENT ON COLUMN public.approvals.job_id IS 'FK to jobs. The job under review. NULL if this approval covers an asset.';
COMMENT ON COLUMN public.approvals.requested_by IS 'Actor that submitted this for approval: system (auto-routed), brand_guardian (AI-flagged), user (manual submission).';
COMMENT ON COLUMN public.approvals.reviewed_by IS 'FK to users. NULL until a human reviews. Auto-approved items remain NULL.';
COMMENT ON COLUMN public.approvals.status IS 'Current decision: pending, approved, rejected, or revision_requested.';
COMMENT ON COLUMN public.approvals.risk_level IS 'Brand Guardian risk assessment: low, medium, high, critical. Critical always blocks regardless of safety_level.';
COMMENT ON COLUMN public.approvals.risk_flags IS 'Specific flags from Brand Guardian: blocked_phrase, unverified_claim, competitor_mention, profanity, off_brand_tone, etc.';
COMMENT ON COLUMN public.approvals.notes IS 'Reviewer notes explaining the decision, or Brand Guardian reasoning for flagging.';
COMMENT ON COLUMN public.approvals.auto_approved IS 'True if approved automatically based on confidence score exceeding auto_approve_threshold. No human involved.';
COMMENT ON COLUMN public.approvals.requested_at IS 'When this item entered the approval queue.';
COMMENT ON COLUMN public.approvals.reviewed_at IS 'When the final decision was made. NULL for pending items.';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- At least one of asset_id or job_id must be set
ALTER TABLE public.approvals
    ADD CONSTRAINT approvals_target_required
    CHECK (asset_id IS NOT NULL OR job_id IS NOT NULL);

-- reviewed_at must be after requested_at
ALTER TABLE public.approvals
    ADD CONSTRAINT approvals_reviewed_after_requested
    CHECK (reviewed_at IS NULL OR reviewed_at >= requested_at);

-- Auto-approved items should not have a human reviewer
-- (soft constraint — informational only, not enforced at DB level to allow override)

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals_select_owner"
    ON public.approvals
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "approvals_insert_owner"
    ON public.approvals
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "approvals_update_owner"
    ON public.approvals
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

CREATE POLICY "approvals_delete_owner"
    ON public.approvals
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary approval queue view: pending items for workspace
CREATE INDEX IF NOT EXISTS idx_approvals_workspace_status
    ON public.approvals (workspace_id, status);

-- Pending approvals (used for dashboard badge count)
CREATE INDEX IF NOT EXISTS idx_approvals_pending
    ON public.approvals (workspace_id, requested_at DESC)
    WHERE status = 'pending';

-- Risk level filter (critical items surface first)
CREATE INDEX IF NOT EXISTS idx_approvals_risk_level
    ON public.approvals (workspace_id, risk_level, requested_at DESC)
    WHERE status = 'pending';

-- Asset-specific approvals (used on asset detail page)
CREATE INDEX IF NOT EXISTS idx_approvals_asset_id
    ON public.approvals (asset_id)
    WHERE asset_id IS NOT NULL;

-- Job-specific approvals
CREATE INDEX IF NOT EXISTS idx_approvals_job_id
    ON public.approvals (job_id)
    WHERE job_id IS NOT NULL;

-- Audit trail: approved/rejected history
CREATE INDEX IF NOT EXISTS idx_approvals_reviewed_at
    ON public.approvals (workspace_id, reviewed_at DESC)
    WHERE reviewed_at IS NOT NULL;
