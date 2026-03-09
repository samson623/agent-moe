-- =============================================================================
-- Migration 00010: Create analytics_events table
-- =============================================================================
-- Purpose: Immutable event log for all platform and content performance data.
--          Records system events (mission completed, job failed, asset published)
--          and external performance metrics (post impressions, engagement rates).
--          Uses BIGSERIAL for high-volume append performance.
--          Future: partition by occurred_at for data at scale.
-- =============================================================================

-- =============================================================================
-- TABLE: analytics_events
-- =============================================================================
-- Note: Using BIGSERIAL for id instead of UUID for optimal append performance
-- on high-volume event ingestion. UUID stored in entity_id for entity reference.

CREATE TABLE IF NOT EXISTS public.analytics_events (
    -- BIGSERIAL for sequential, high-performance inserts
    id            BIGSERIAL PRIMARY KEY,
    workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Dot-notation event type for easy filtering and grouping
    -- System events: 'mission.created', 'mission.completed', 'mission.failed'
    --                'job.started', 'job.completed', 'job.failed'
    --                'asset.generated', 'asset.approved', 'asset.published', 'asset.rejected'
    --                'approval.requested', 'approval.auto_approved'
    --                'connector.published', 'connector.error'
    -- Performance events: 'content.impression', 'content.engagement', 'content.click', 'content.conversion'
    event_type    TEXT NOT NULL,

    -- Type of entity this event relates to: 'mission', 'job', 'asset', 'offer', 'connector', 'approval'
    entity_type   TEXT NOT NULL,

    -- UUID of the specific entity (mission id, job id, asset id, etc.)
    entity_id     UUID NOT NULL,

    -- Flexible event payload: varies by event_type
    -- For 'mission.completed': { duration_ms, job_count, asset_count }
    -- For 'asset.published': { platform, connector_id, post_url }
    -- For 'content.impression': { impressions, reach, platform }
    properties    JSONB NOT NULL DEFAULT '{}',

    -- When the event actually occurred (may differ from created_at for imported data)
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.analytics_events IS 'Immutable event ledger. Records all platform activity and content performance metrics. Append-only — never update or delete rows.';
COMMENT ON COLUMN public.analytics_events.id IS 'BIGSERIAL for high-performance sequential inserts. Use entity_id for referencing specific entities.';
COMMENT ON COLUMN public.analytics_events.workspace_id IS 'FK to workspaces. Owner workspace. All events are workspace-scoped.';
COMMENT ON COLUMN public.analytics_events.event_type IS 'Dot-notation event identifier. e.g. mission.completed, asset.published, content.impression, connector.error.';
COMMENT ON COLUMN public.analytics_events.entity_type IS 'Type of the related entity: mission, job, asset, offer, connector, approval.';
COMMENT ON COLUMN public.analytics_events.entity_id IS 'UUID of the specific entity this event describes.';
COMMENT ON COLUMN public.analytics_events.properties IS 'Event-specific payload. Schema varies by event_type. Contains metrics, context, and metadata.';
COMMENT ON COLUMN public.analytics_events.occurred_at IS 'When the event happened. Use for time-series queries. May differ from created_at for backfilled data.';
COMMENT ON COLUMN public.analytics_events.created_at IS 'When this row was inserted. For append ordering.';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

ALTER TABLE public.analytics_events
    ADD CONSTRAINT analytics_events_event_type_not_empty
    CHECK (length(trim(event_type)) > 0);

ALTER TABLE public.analytics_events
    ADD CONSTRAINT analytics_events_entity_type_not_empty
    CHECK (length(trim(entity_type)) > 0);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Analytics events are append-only — no UPDATE or DELETE policies

CREATE POLICY "analytics_events_select_owner"
    ON public.analytics_events
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "analytics_events_insert_owner"
    ON public.analytics_events
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary analytics dashboard query: workspace events by time
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_occurred
    ON public.analytics_events (workspace_id, occurred_at DESC);

-- Filter by event type (used for specific metric queries)
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_type
    ON public.analytics_events (workspace_id, event_type, occurred_at DESC);

-- Entity lookup: all events for a specific entity (e.g. all events for mission X)
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity
    ON public.analytics_events (entity_type, entity_id, occurred_at DESC);

-- Recent events for real-time dashboard
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at
    ON public.analytics_events (occurred_at DESC);

-- Event type + entity type combo (used for aggregation queries)
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_entity_type
    ON public.analytics_events (event_type, entity_type);

-- FUTURE PARTITIONING NOTE:
-- When event volume exceeds 10M rows, partition by range on occurred_at:
-- PARTITION BY RANGE (occurred_at) with monthly partitions.
-- Current volume does not require partitioning.
