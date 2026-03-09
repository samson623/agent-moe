-- =============================================================================
-- Migration 00006: Create assets table
-- =============================================================================
-- Purpose: Generated content and deliverables produced by operator teams.
--          Assets are the primary output of the platform — posts, scripts,
--          captions, CTAs, reports, and all other content artifacts.
--          Versioning is supported via parent_asset_id self-reference.
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.asset_type AS ENUM (
    'post',              -- Short-form social post (X, LinkedIn, Instagram)
    'thread',            -- Multi-part threaded content (X thread, LinkedIn carousel)
    'script',            -- Video or audio script (YouTube, TikTok, Podcast)
    'caption',           -- Platform-specific caption for visual content
    'cta',               -- Call-to-action copy (button text, end card, DM prompt)
    'thumbnail_concept', -- Thumbnail description/concept for video content
    'carousel',          -- Multi-slide carousel content (LinkedIn, Instagram)
    'video_concept',     -- Video concept brief: hook, scenes, B-roll, outro
    'email',             -- Email marketing copy (subject, body, CTA)
    'report'             -- Analysis or research report from Growth Operator
);

CREATE TYPE public.asset_platform AS ENUM (
    'x',          -- Twitter / X
    'linkedin',   -- LinkedIn
    'instagram',  -- Instagram
    'tiktok',     -- TikTok
    'youtube',    -- YouTube
    'email',      -- Email marketing
    'universal'   -- Platform-agnostic (applies to multiple platforms)
);

CREATE TYPE public.asset_status AS ENUM (
    'draft',      -- Generated, not yet reviewed
    'review',     -- Submitted to approval queue
    'approved',   -- Approved by Brand Guardian or user
    'published',  -- Published to platform via Connector
    'archived',   -- Moved to archive (not deleted, just hidden from active views)
    'rejected'    -- Rejected in approval queue; needs revision or discard
);

COMMENT ON TYPE public.asset_type IS 'Content format/type of the generated asset.';
COMMENT ON TYPE public.asset_platform IS 'Target distribution platform for this asset.';
COMMENT ON TYPE public.asset_status IS 'Lifecycle state of an asset from draft through publishing.';

-- =============================================================================
-- TABLE: assets
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.assets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- The mission that requested this content (nullable for manually created assets)
    mission_id       UUID REFERENCES public.missions(id) ON DELETE SET NULL,

    -- The specific job that produced this asset (nullable for manually created assets)
    job_id           UUID REFERENCES public.jobs(id) ON DELETE SET NULL,

    -- Which operator team produced this asset
    operator_team    public.operator_team NOT NULL,

    -- Content format
    asset_type       public.asset_type NOT NULL,

    -- Target distribution platform
    platform         public.asset_platform NOT NULL DEFAULT 'universal',

    -- Short title for UI display (auto-generated from content if not set)
    title            TEXT NOT NULL,

    -- The actual generated content (full text, markdown, or structured string)
    content          TEXT NOT NULL DEFAULT '',

    -- Flexible metadata: word count, hashtags, estimated read time, tone tags, etc.
    metadata         JSONB NOT NULL DEFAULT '{}',

    -- Current lifecycle state
    status           public.asset_status NOT NULL DEFAULT 'draft',

    -- Confidence score from the generating operator (0.0 = low quality, 1.0 = high confidence)
    confidence_score FLOAT NOT NULL DEFAULT 0.0
                         CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),

    -- Version number. Starts at 1, increments on each edit/regeneration.
    version          INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),

    -- Self-referential FK for versioning. Points to the original (v1) asset.
    -- All versions of the same asset share the same parent_asset_id.
    parent_asset_id  UUID REFERENCES public.assets(id) ON DELETE SET NULL,

    -- The offer this asset is linked to (for revenue tracking and CTA alignment)
    linked_offer_id  UUID, -- FK added after offers table created in 00007

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.assets IS 'Generated content artifacts from operator teams. Supports versioning, platform targeting, approval workflow, and offer linking.';
COMMENT ON COLUMN public.assets.workspace_id IS 'FK to workspaces. Owner workspace.';
COMMENT ON COLUMN public.assets.mission_id IS 'FK to missions. Nullable — manually created assets have no parent mission.';
COMMENT ON COLUMN public.assets.job_id IS 'FK to jobs. The specific job that produced this asset. Nullable for manual assets.';
COMMENT ON COLUMN public.assets.operator_team IS 'Which operator team generated this content.';
COMMENT ON COLUMN public.assets.asset_type IS 'Content format: post, thread, script, caption, cta, thumbnail_concept, carousel, video_concept, email, report.';
COMMENT ON COLUMN public.assets.platform IS 'Target platform for distribution. Universal means not yet platform-targeted.';
COMMENT ON COLUMN public.assets.title IS 'Short display title. Auto-generated from first line of content if not explicitly set.';
COMMENT ON COLUMN public.assets.content IS 'The full generated content. Plain text, markdown, or platform-native format.';
COMMENT ON COLUMN public.assets.metadata IS 'Flexible metadata: { word_count, char_count, hashtags, reading_time_secs, tone_tags, hooks, cta_count }.';
COMMENT ON COLUMN public.assets.status IS 'Lifecycle state from draft to published or archived.';
COMMENT ON COLUMN public.assets.confidence_score IS 'Operator-assigned confidence score (0–1). Low scores trigger automatic review queue flagging.';
COMMENT ON COLUMN public.assets.version IS 'Version counter. v1 = original generation. Increments on each edit or regeneration.';
COMMENT ON COLUMN public.assets.parent_asset_id IS 'Self-referential FK. All versions of the same asset point to the v1 parent. Null if this IS v1.';
COMMENT ON COLUMN public.assets.linked_offer_id IS 'FK to offers. Links this asset to a monetization offer for conversion tracking.';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

ALTER TABLE public.assets
    ADD CONSTRAINT assets_title_not_empty CHECK (length(trim(title)) > 0);

-- Cannot be your own parent
ALTER TABLE public.assets
    ADD CONSTRAINT assets_no_self_parent CHECK (parent_asset_id != id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select_owner"
    ON public.assets
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "assets_insert_owner"
    ON public.assets
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "assets_update_owner"
    ON public.assets
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

CREATE POLICY "assets_delete_owner"
    ON public.assets
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary content studio view: workspace assets by status
CREATE INDEX IF NOT EXISTS idx_assets_workspace_status
    ON public.assets (workspace_id, status);

-- Filter by asset type (posts, scripts, etc.)
CREATE INDEX IF NOT EXISTS idx_assets_workspace_type
    ON public.assets (workspace_id, asset_type);

-- Filter by platform
CREATE INDEX IF NOT EXISTS idx_assets_workspace_platform
    ON public.assets (workspace_id, platform);

-- Assets for a specific mission
CREATE INDEX IF NOT EXISTS idx_assets_mission_id
    ON public.assets (mission_id)
    WHERE mission_id IS NOT NULL;

-- Assets produced by a specific job
CREATE INDEX IF NOT EXISTS idx_assets_job_id
    ON public.assets (job_id)
    WHERE job_id IS NOT NULL;

-- Versioning: find all versions of an asset
CREATE INDEX IF NOT EXISTS idx_assets_parent_asset_id
    ON public.assets (parent_asset_id)
    WHERE parent_asset_id IS NOT NULL;

-- Linked offer lookup
CREATE INDEX IF NOT EXISTS idx_assets_linked_offer_id
    ON public.assets (linked_offer_id)
    WHERE linked_offer_id IS NOT NULL;

-- Confidence score for auto-approval queries
CREATE INDEX IF NOT EXISTS idx_assets_confidence_score
    ON public.assets (confidence_score DESC)
    WHERE status = 'draft';

-- Recent drafts in review (approval queue)
CREATE INDEX IF NOT EXISTS idx_assets_status_created
    ON public.assets (status, created_at DESC);
