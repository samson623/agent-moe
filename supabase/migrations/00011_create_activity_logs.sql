-- =============================================================================
-- Migration 00011: Create activity_logs table
-- =============================================================================
-- Purpose: Human-readable system action history. Every significant action by
--          the user or any operator team gets logged here. Powers the activity
--          feed on the dashboard and provides operator audit trails.
--          Unlike analytics_events (metrics), activity_logs are narrative —
--          they tell the story of what happened and who did it.
-- =============================================================================

-- =============================================================================
-- TABLE: activity_logs
-- =============================================================================
-- Note: Using BIGSERIAL for id to match analytics_events pattern and support
-- high-volume append operations from concurrent operator activity.

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id            BIGSERIAL PRIMARY KEY,
    workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Who or what performed the action
    -- Values: 'user', 'content_strike', 'growth_operator', 'revenue_closer',
    --         'brand_guardian', 'system', 'mission_engine', 'model_router'
    actor         TEXT NOT NULL,

    -- Dot-notation action identifier (mirrors event_type conventions)
    -- e.g. 'mission.created', 'mission.status_changed', 'job.started', 'job.completed',
    --       'asset.generated', 'asset.approved', 'asset.rejected', 'approval.requested',
    --       'connector.connected', 'brand_rules.updated', 'offer.created'
    action        TEXT NOT NULL,

    -- Type of entity this action relates to: 'mission', 'job', 'asset', 'offer', etc.
    entity_type   TEXT NOT NULL,

    -- UUID of the specific entity being acted upon
    entity_id     UUID NOT NULL,

    -- Human-readable narrative of what happened
    -- e.g. "Content Strike Team generated a Twitter thread for mission 'Launch Campaign'"
    -- e.g. "Brand Guardian flagged asset for unverified_claim: 'guaranteed results'"
    message       TEXT NOT NULL,

    -- Structured context: old_status, new_status, model_used, duration_ms, etc.
    meta          JSONB NOT NULL DEFAULT '{}',

    -- When the action occurred
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.activity_logs IS 'Human-readable narrative action log. Powers the activity feed and operator audit trails. Append-only — never update or delete rows.';
COMMENT ON COLUMN public.activity_logs.id IS 'BIGSERIAL for high-performance sequential appends from concurrent operator activity.';
COMMENT ON COLUMN public.activity_logs.workspace_id IS 'FK to workspaces. All activity is workspace-scoped.';
COMMENT ON COLUMN public.activity_logs.actor IS 'Who performed the action: user, content_strike, growth_operator, revenue_closer, brand_guardian, system, mission_engine, model_router.';
COMMENT ON COLUMN public.activity_logs.action IS 'Dot-notation action identifier: mission.created, job.started, asset.generated, approval.requested, etc.';
COMMENT ON COLUMN public.activity_logs.entity_type IS 'Type of entity acted upon: mission, job, asset, offer, approval, connector, brand_rules.';
COMMENT ON COLUMN public.activity_logs.entity_id IS 'UUID of the specific entity. Use with entity_type to look up the full record.';
COMMENT ON COLUMN public.activity_logs.message IS 'Human-readable narrative for the activity feed. Written to be understood without context.';
COMMENT ON COLUMN public.activity_logs.meta IS 'Structured context: { old_status, new_status, model_used, duration_ms, error_code, job_count }.';
COMMENT ON COLUMN public.activity_logs.occurred_at IS 'When the action occurred. Used for feed ordering and time-range filtering.';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

ALTER TABLE public.activity_logs
    ADD CONSTRAINT activity_logs_actor_not_empty
    CHECK (length(trim(actor)) > 0);

ALTER TABLE public.activity_logs
    ADD CONSTRAINT activity_logs_action_not_empty
    CHECK (length(trim(action)) > 0);

ALTER TABLE public.activity_logs
    ADD CONSTRAINT activity_logs_message_not_empty
    CHECK (length(trim(message)) > 0);

ALTER TABLE public.activity_logs
    ADD CONSTRAINT activity_logs_entity_type_not_empty
    CHECK (length(trim(entity_type)) > 0);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity logs are append-only — no UPDATE or DELETE policies

CREATE POLICY "activity_logs_select_owner"
    ON public.activity_logs
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "activity_logs_insert_owner"
    ON public.activity_logs
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary activity feed query: workspace activity newest first
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_occurred
    ON public.activity_logs (workspace_id, occurred_at DESC);

-- Filter by actor (used on Operators page to show per-team activity)
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_actor
    ON public.activity_logs (workspace_id, actor, occurred_at DESC);

-- Filter by action type (used for specific action feeds)
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_action
    ON public.activity_logs (workspace_id, action, occurred_at DESC);

-- Entity timeline: all activity for a specific entity
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity
    ON public.activity_logs (entity_type, entity_id, occurred_at DESC);

-- Global recency (used for cross-workspace system monitoring, service-role only)
CREATE INDEX IF NOT EXISTS idx_activity_logs_occurred_at
    ON public.activity_logs (occurred_at DESC);
