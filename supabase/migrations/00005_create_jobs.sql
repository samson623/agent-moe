-- =============================================================================
-- Migration 00005: Create jobs table
-- =============================================================================
-- Purpose: Atomic units of work produced by the Mission Engine's decomposition.
--          Each job is assigned to an operator team and processed by either
--          Claude Agent SDK (heavy) or GPT-5 Nano (light) via the Model Router.
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.operator_team AS ENUM (
    'content_strike',   -- Content Strike Team: posts, hooks, scripts, captions, CTAs
    'growth_operator',  -- Growth Operator: trend signals, market angles, topic scoring
    'revenue_closer',   -- Revenue Closer: offer mapping, CTA strategy, lead magnets
    'brand_guardian'    -- Brand Guardian: safety review, tone check, claim flagging
);

CREATE TYPE public.job_status AS ENUM (
    'pending',    -- Queued, not yet started
    'running',    -- Currently executing on an operator
    'completed',  -- Finished successfully; output_data populated
    'failed',     -- Execution error; error_message populated
    'cancelled'   -- Manually cancelled before execution
);

CREATE TYPE public.model_used AS ENUM (
    'claude',     -- Claude Agent SDK via Max subscription (@anthropic-ai/claude-agent-sdk)
    'gpt5_nano'   -- GPT-5 Nano via OpenAI API (light tasks, near-zero cost)
);

COMMENT ON TYPE public.operator_team IS 'The four specialist AI operator teams. Each team has a specialized prompt, tools, and output schema.';
COMMENT ON TYPE public.job_status IS 'Lifecycle state of an individual job unit.';
COMMENT ON TYPE public.model_used IS 'Which AI model executed this job. Claude for heavy reasoning/tool-use; GPT-5 Nano for fast/cheap classification.';

-- =============================================================================
-- TABLE: jobs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.jobs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id     UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    workspace_id   UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Which operator team handles this job
    operator_team  public.operator_team NOT NULL,

    -- Internal job classification (e.g. 'content.thread', 'research.trend_scan', 'review.safety_check')
    job_type       TEXT NOT NULL,

    -- Human-readable job title for UI display
    title          TEXT NOT NULL,

    -- Full description of what this job should accomplish
    description    TEXT NOT NULL DEFAULT '',

    -- Current execution state
    status         public.job_status NOT NULL DEFAULT 'pending',

    -- Higher number = higher priority (0 is default)
    priority       INTEGER NOT NULL DEFAULT 0,

    -- UUIDs of other jobs that must complete before this job can start
    depends_on     UUID[] NOT NULL DEFAULT '{}',

    -- Which AI model executed or will execute this job
    model_used     public.model_used,

    -- Structured input data passed to the operator (prompt context, parameters, etc.)
    input_data     JSONB NOT NULL DEFAULT '{}',

    -- Structured output from the operator (varies by job_type and operator_team)
    output_data    JSONB NOT NULL DEFAULT '{}',

    -- Error details if status = 'failed'
    error_message  TEXT,

    -- Execution timestamps
    started_at     TIMESTAMPTZ,
    completed_at   TIMESTAMPTZ,

    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.jobs IS 'Atomic work units decomposed from missions. Executed by operator teams using Claude (heavy) or GPT-5 Nano (light).';
COMMENT ON COLUMN public.jobs.mission_id IS 'FK to missions. Parent mission that spawned this job.';
COMMENT ON COLUMN public.jobs.workspace_id IS 'FK to workspaces. Denormalized for fast workspace-scoped queries.';
COMMENT ON COLUMN public.jobs.operator_team IS 'Which operator team is responsible: content_strike, growth_operator, revenue_closer, or brand_guardian.';
COMMENT ON COLUMN public.jobs.job_type IS 'Internal type string for routing. e.g. content.thread, research.trend_scan, review.safety_check, revenue.offer_map.';
COMMENT ON COLUMN public.jobs.priority IS 'Integer priority. Higher = processed sooner within mission queue.';
COMMENT ON COLUMN public.jobs.depends_on IS 'Array of job UUIDs that must complete before this job begins. Used by Mission Engine for DAG execution.';
COMMENT ON COLUMN public.jobs.model_used IS 'AI model that processed or will process this job. Null until job starts.';
COMMENT ON COLUMN public.jobs.input_data IS 'Structured input context passed to the operator: brand rules, active offer, platform target, etc.';
COMMENT ON COLUMN public.jobs.output_data IS 'Raw structured output from the operator. Schema varies by operator_team and job_type.';
COMMENT ON COLUMN public.jobs.error_message IS 'Human-readable error details if job failed. Captured from operator exception or timeout.';
COMMENT ON COLUMN public.jobs.started_at IS 'Timestamp when job execution began.';
COMMENT ON COLUMN public.jobs.completed_at IS 'Timestamp when job finished (success or failure).';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_title_not_empty CHECK (length(trim(title)) > 0);

ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_type_not_empty CHECK (length(trim(job_type)) > 0);

ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_priority_range CHECK (priority >= -100 AND priority <= 100);

-- completed_at must be after started_at
ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_completion_after_start
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_owner"
    ON public.jobs
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "jobs_insert_owner"
    ON public.jobs
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "jobs_update_owner"
    ON public.jobs
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

CREATE POLICY "jobs_delete_owner"
    ON public.jobs
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Jobs for a mission (used when rendering mission detail page)
CREATE INDEX IF NOT EXISTS idx_jobs_mission_id
    ON public.jobs (mission_id);

-- Pending jobs for queue processing (used by job executor)
CREATE INDEX IF NOT EXISTS idx_jobs_status_priority
    ON public.jobs (status, priority DESC, created_at ASC)
    WHERE status = 'pending';

-- Workspace-scoped job list with status filter
CREATE INDEX IF NOT EXISTS idx_jobs_workspace_status
    ON public.jobs (workspace_id, status);

-- Operator team view (used on Operators page)
CREATE INDEX IF NOT EXISTS idx_jobs_operator_team
    ON public.jobs (operator_team, status);

-- Mission + operator team combo (used for team activity within a mission)
CREATE INDEX IF NOT EXISTS idx_jobs_mission_operator
    ON public.jobs (mission_id, operator_team);

-- Recently completed jobs for analytics
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at
    ON public.jobs (completed_at DESC)
    WHERE completed_at IS NOT NULL;
