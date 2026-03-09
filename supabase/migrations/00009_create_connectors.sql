-- =============================================================================
-- Migration 00009: Create connectors table
-- =============================================================================
-- Purpose: External platform integrations and webhooks. Connectors allow
--          the platform to publish approved assets, sync data, and receive
--          signals from external services (social platforms, CRMs, etc.).
--
-- SECURITY NOTE: credentials column stores encrypted OAuth tokens and API keys.
--                Encryption/decryption is handled at the application layer
--                using AES-256 before writing to this column.
--                NEVER expose credentials in API responses without decryption
--                control logic — strip or mask this field in all public-facing
--                API routes.
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.connector_platform AS ENUM (
    'x',         -- Twitter / X (OAuth 2.0)
    'linkedin',  -- LinkedIn (OAuth 2.0)
    'instagram', -- Instagram via Meta Graph API
    'tiktok',    -- TikTok for Developers API
    'youtube',   -- YouTube Data API v3
    'email',     -- Email service (SendGrid, Resend, Mailchimp)
    'notion',    -- Notion API (for publishing reports, briefs)
    'airtable',  -- Airtable (for external data sync)
    'webhook'    -- Generic webhook (POST to any URL on events)
);

CREATE TYPE public.connector_status AS ENUM (
    'connected',     -- Authenticated and active; ready to publish
    'disconnected',  -- Not authenticated or manually disconnected
    'error',         -- Authentication expired or API error; needs re-auth
    'pending'        -- OAuth flow initiated but not yet completed
);

COMMENT ON TYPE public.connector_platform IS 'Supported external platforms and services for content publishing and data sync.';
COMMENT ON TYPE public.connector_status IS 'Authentication and health status of the connector.';

-- =============================================================================
-- TABLE: connectors
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.connectors (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Which external platform this connector targets
    platform      public.connector_platform NOT NULL,

    -- Human-readable name for this connector instance (e.g. "Personal X Account", "Business LinkedIn")
    name          TEXT NOT NULL,

    -- Authentication and health status
    status        public.connector_status NOT NULL DEFAULT 'pending',

    -- ENCRYPTED at application layer. Contains: access_token, refresh_token, token_expiry, scopes.
    -- NEVER expose in API without stripping/masking. AES-256 encrypted before write.
    credentials   JSONB NOT NULL DEFAULT '{}',

    -- Non-sensitive configuration: account_id, page_id, list_id, webhook_url, publish_schedule, etc.
    config        JSONB NOT NULL DEFAULT '{}',

    -- Last successful data sync or publish timestamp
    last_sync_at  TIMESTAMPTZ,

    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.connectors IS 'External platform integrations. Handles OAuth tokens for publishing and data sync. Credentials are AES-256 encrypted at app layer.';
COMMENT ON COLUMN public.connectors.workspace_id IS 'FK to workspaces. Owner workspace.';
COMMENT ON COLUMN public.connectors.platform IS 'Target external platform: x, linkedin, instagram, tiktok, youtube, email, notion, airtable, webhook.';
COMMENT ON COLUMN public.connectors.name IS 'User-friendly connector name. e.g. "Main X Account", "Newsletter List".';
COMMENT ON COLUMN public.connectors.status IS 'Auth status: connected (ready), disconnected (no auth), error (expired/failed), pending (OAuth in progress).';
COMMENT ON COLUMN public.connectors.credentials IS 'ENCRYPTED JSONB. Contains OAuth tokens, API keys, expiry. Application layer must encrypt before write and decrypt after read. NEVER expose raw in API.';
COMMENT ON COLUMN public.connectors.config IS 'Non-sensitive connector configuration: account_id, page_id, webhook_url, publish_schedule, content_filters.';
COMMENT ON COLUMN public.connectors.last_sync_at IS 'Timestamp of last successful sync or publish operation.';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

ALTER TABLE public.connectors
    ADD CONSTRAINT connectors_name_not_empty CHECK (length(trim(name)) > 0);

-- One connector per platform per workspace (enforced; use config.account_id for multi-account)
ALTER TABLE public.connectors
    ADD CONSTRAINT connectors_workspace_platform_unique UNIQUE (workspace_id, platform);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connectors_select_owner"
    ON public.connectors
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "connectors_insert_owner"
    ON public.connectors
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "connectors_update_owner"
    ON public.connectors
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

CREATE POLICY "connectors_delete_owner"
    ON public.connectors
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Workspace connectors list (Connectors page)
CREATE INDEX IF NOT EXISTS idx_connectors_workspace_id
    ON public.connectors (workspace_id);

-- Platform lookup (check if platform is connected before publishing)
CREATE INDEX IF NOT EXISTS idx_connectors_workspace_platform
    ON public.connectors (workspace_id, platform);

-- Connected connectors only (used by publisher service)
CREATE INDEX IF NOT EXISTS idx_connectors_connected
    ON public.connectors (workspace_id)
    WHERE status = 'connected';

-- Error connectors (used for health check alerts)
CREATE INDEX IF NOT EXISTS idx_connectors_error
    ON public.connectors (workspace_id)
    WHERE status = 'error';
