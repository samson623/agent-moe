-- =============================================================================
-- Migration 00016: Create video_packages table
-- =============================================================================
-- Purpose: Stores AI-generated video packages produced by the Content Strike
--          Team operator. Each package is a complete, platform-ready video
--          brief including hook variants, scene-by-scene script, thumbnail
--          concept, caption, and call-to-action.
--
-- Reuses existing enums: asset_platform, asset_status (defined in earlier
-- migrations for the assets table).
-- =============================================================================

-- =============================================================================
-- TABLE: video_packages
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.video_packages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Workspace ownership
    workspace_id        UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Optional links to parent entities
    mission_id          UUID REFERENCES public.missions(id) ON DELETE SET NULL,
    asset_id            UUID REFERENCES public.assets(id) ON DELETE SET NULL,

    -- Core content fields
    title               TEXT NOT NULL,
    platform            public.asset_platform NOT NULL,

    -- Hook: primary hook + A/B variants
    -- Shape: { primary: string, variants: string[] }
    hook                JSONB NOT NULL DEFAULT '{}',

    -- Scene list ordered by sequence
    -- Shape: [{ order: number, title: string, script: string, visual_direction: string, duration_seconds: number }]
    scenes              JSONB NOT NULL DEFAULT '[]',

    -- Thumbnail concept brief
    -- Shape: { headline: string, visual_description: string, color_scheme: string, text_overlay: string }
    thumbnail_concept   JSONB NOT NULL DEFAULT '{}',

    -- Platform caption (optional — some platforms don't use standalone captions)
    caption             TEXT,

    -- Call-to-action definition
    -- Shape: { text: string, type: string, destination?: string }
    cta                 JSONB DEFAULT '{}',

    -- Workflow status — reuses asset_status enum for consistency
    status              public.asset_status NOT NULL DEFAULT 'draft',

    -- AI confidence in the generated package quality (0.0–1.0)
    confidence_score    FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Arbitrary extension bag for operator metadata, model info, etc.
    metadata            JSONB DEFAULT '{}',

    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.video_packages IS 'AI-generated video packages. Each row is a complete platform-ready video brief: hook variants, scene scripts, thumbnail concept, caption, and CTA.';
COMMENT ON COLUMN public.video_packages.workspace_id      IS 'FK to workspaces. Owner of this video package.';
COMMENT ON COLUMN public.video_packages.mission_id        IS 'FK to missions. NULL if not linked to a mission.';
COMMENT ON COLUMN public.video_packages.asset_id          IS 'FK to assets. Optional link to a parent content asset.';
COMMENT ON COLUMN public.video_packages.title             IS 'Human-readable title for the video package.';
COMMENT ON COLUMN public.video_packages.platform          IS 'Target distribution platform (tiktok, youtube, instagram, etc.).';
COMMENT ON COLUMN public.video_packages.hook              IS 'Hook definition: { primary: string, variants: string[] }. Primary hook + A/B test variants.';
COMMENT ON COLUMN public.video_packages.scenes            IS 'Ordered scene array: [{ order, title, script, visual_direction, duration_seconds }].';
COMMENT ON COLUMN public.video_packages.thumbnail_concept IS 'Thumbnail brief: { headline, visual_description, color_scheme, text_overlay }.';
COMMENT ON COLUMN public.video_packages.caption           IS 'Platform caption text. Optional — not all platforms require a standalone caption.';
COMMENT ON COLUMN public.video_packages.cta               IS 'Call-to-action: { text, type, destination? }.';
COMMENT ON COLUMN public.video_packages.status            IS 'Workflow status: draft, review, approved, published, archived, rejected.';
COMMENT ON COLUMN public.video_packages.confidence_score  IS 'AI confidence score 0.0–1.0. Higher = more reliable output.';
COMMENT ON COLUMN public.video_packages.metadata          IS 'Extension bag: model info, operator team, generation params, etc.';

-- =============================================================================
-- TRIGGER: auto-update updated_at
-- =============================================================================
-- set_updated_at() is defined in migration 00013.

CREATE TRIGGER trg_video_packages_updated_at
    BEFORE UPDATE ON public.video_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.video_packages ENABLE ROW LEVEL SECURITY;

-- SELECT: workspace owner can read their packages
CREATE POLICY "video_packages_select_owner"
    ON public.video_packages
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- INSERT: workspace owner can create packages
CREATE POLICY "video_packages_insert_owner"
    ON public.video_packages
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- UPDATE: workspace owner can update their packages
CREATE POLICY "video_packages_update_owner"
    ON public.video_packages
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

-- DELETE: workspace owner can delete their packages
CREATE POLICY "video_packages_delete_owner"
    ON public.video_packages
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary list view: all packages for a workspace ordered by recency
CREATE INDEX IF NOT EXISTS idx_video_packages_workspace_created
    ON public.video_packages (workspace_id, created_at DESC);

-- Filter by mission (mission detail page)
CREATE INDEX IF NOT EXISTS idx_video_packages_mission_id
    ON public.video_packages (mission_id)
    WHERE mission_id IS NOT NULL;

-- Filter by status (e.g. draft queue, review queue)
CREATE INDEX IF NOT EXISTS idx_video_packages_workspace_status
    ON public.video_packages (workspace_id, status);

-- Filter by platform (platform-specific content views)
CREATE INDEX IF NOT EXISTS idx_video_packages_workspace_platform
    ON public.video_packages (workspace_id, platform);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_packages TO authenticated;
