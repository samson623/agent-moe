-- =============================================================================
-- Migration 00002: Create workspaces table
-- =============================================================================
-- Purpose: A workspace represents the user's private business environment.
--          All other entities (missions, jobs, assets) belong to a workspace.
--          Single user will typically have one workspace, but schema supports
--          multiple for potential future business separation.
-- =============================================================================

-- =============================================================================
-- TABLE: workspaces
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    -- URL-safe slug for workspace identification (e.g. "my-business")
    slug             TEXT NOT NULL UNIQUE,
    -- Flexible settings: timezone, locale, default platform, approval thresholds, etc.
    settings         JSONB NOT NULL DEFAULT '{}',
    -- FK to offers (nullable — circular ref resolved by adding FK in 00007 via ALTER)
    -- Stored as UUID here; constraint added after offers table is created
    active_offer_id  UUID,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.workspaces IS 'Business workspace owned by the user. Parent container for all missions, jobs, and assets.';
COMMENT ON COLUMN public.workspaces.user_id IS 'FK to users. Owner of this workspace.';
COMMENT ON COLUMN public.workspaces.name IS 'Human-readable workspace name (e.g. "Agent Moe HQ").';
COMMENT ON COLUMN public.workspaces.slug IS 'URL-safe unique identifier for routing (e.g. "agent-moe-hq").';
COMMENT ON COLUMN public.workspaces.settings IS 'Flexible JSONB config: timezone, locale, default_platform, notification_prefs, etc.';
COMMENT ON COLUMN public.workspaces.active_offer_id IS 'The currently active monetization offer. FK added to offers table in migration 00007.';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select_owner"
    ON public.workspaces
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "workspaces_insert_owner"
    ON public.workspaces
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspaces_update_owner"
    ON public.workspaces
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspaces_delete_owner"
    ON public.workspaces
    FOR DELETE
    USING (user_id = auth.uid());

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id   ON public.workspaces (user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug       ON public.workspaces (slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON public.workspaces (created_at DESC);

-- =============================================================================
-- SLUG VALIDATION
-- =============================================================================
-- Enforce URL-safe slug format: lowercase letters, numbers, hyphens only

ALTER TABLE public.workspaces
    ADD CONSTRAINT workspaces_slug_format
    CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{0,62}[a-z0-9]$');
