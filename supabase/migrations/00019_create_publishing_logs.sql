-- =============================================================================
-- Migration 00019: Create publishing_logs table
-- =============================================================================
-- Purpose: Audit trail of every publish attempt from the Connectors system.
--          Records what was sent, what the platform returned, whether it
--          succeeded, and the external post ID / URL for verification.
-- =============================================================================

-- =============================================================================
-- TABLE: publishing_logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.publishing_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id      UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    connector_id      UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
    asset_id          UUID REFERENCES public.assets(id) ON DELETE SET NULL,

    -- Which platform this log entry targets (denormalised from connector for fast filtering)
    platform          public.connector_platform NOT NULL,

    -- Outcome of the publish attempt
    status            TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'cancelled')),

    -- Platform-assigned post identifier (tweet ID, LinkedIn post URN, IG media ID, etc.)
    external_post_id  TEXT,

    -- Live URL of the published post (if available)
    external_post_url TEXT,

    -- What was sent to the platform (content body, metadata, etc.) — safe to store
    payload           JSONB NOT NULL DEFAULT '{}',

    -- What the platform returned — sanitised, NEVER store tokens here
    response          JSONB NOT NULL DEFAULT '{}',

    -- Human-readable error message on failure
    error_message     TEXT,

    -- When the post went live (NULL for pending/failed)
    published_at      TIMESTAMPTZ,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.publishing_logs IS 'Immutable audit trail of every publish attempt via a Connector. Records payload sent, platform response, and outcome.';
COMMENT ON COLUMN public.publishing_logs.connector_id IS 'FK to connectors. Which connector was used for this publish.';
COMMENT ON COLUMN public.publishing_logs.asset_id IS 'FK to assets. Nullable — can publish ad-hoc content not linked to an asset.';
COMMENT ON COLUMN public.publishing_logs.platform IS 'Denormalised platform for fast filtering without joining connectors.';
COMMENT ON COLUMN public.publishing_logs.status IS 'success | failed | pending | cancelled.';
COMMENT ON COLUMN public.publishing_logs.external_post_id IS 'Platform-native post ID (e.g. Twitter tweet ID). Use to verify live post.';
COMMENT ON COLUMN public.publishing_logs.external_post_url IS 'Direct URL to the live post. NULL for failed/pending entries.';
COMMENT ON COLUMN public.publishing_logs.payload IS 'Sanitised copy of what was sent to the platform API. NEVER include tokens.';
COMMENT ON COLUMN public.publishing_logs.response IS 'Sanitised platform API response. Strip any token fields before storing.';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.publishing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publishing_logs_select_owner"
    ON public.publishing_logs
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "publishing_logs_insert_owner"
    ON public.publishing_logs
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "publishing_logs_update_owner"
    ON public.publishing_logs
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

-- No DELETE policy — publishing logs are immutable audit records.

-- =============================================================================
-- INDEXES
-- =============================================================================

-- All logs for a workspace (Connectors page — history panel)
CREATE INDEX IF NOT EXISTS idx_publishing_logs_workspace_id
    ON public.publishing_logs (workspace_id, created_at DESC);

-- Logs for a specific connector (connector detail view)
CREATE INDEX IF NOT EXISTS idx_publishing_logs_connector_id
    ON public.publishing_logs (connector_id, created_at DESC);

-- Logs linked to a specific asset (Content Studio — publish history)
CREATE INDEX IF NOT EXISTS idx_publishing_logs_asset_id
    ON public.publishing_logs (asset_id)
    WHERE asset_id IS NOT NULL;

-- Filter by platform
CREATE INDEX IF NOT EXISTS idx_publishing_logs_platform
    ON public.publishing_logs (workspace_id, platform, created_at DESC);

-- Failed-only index for error monitoring
CREATE INDEX IF NOT EXISTS idx_publishing_logs_failed
    ON public.publishing_logs (workspace_id, created_at DESC)
    WHERE status = 'failed';

-- Today's successful publishes (for stats counter)
CREATE INDEX IF NOT EXISTS idx_publishing_logs_published_at
    ON public.publishing_logs (workspace_id, published_at DESC)
    WHERE status = 'success';

-- =============================================================================
-- REALTIME
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.publishing_logs;
