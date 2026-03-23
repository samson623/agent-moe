-- =============================================================================
-- Migration 00026: Create experiment_briefs and experiment_runs tables
-- =============================================================================
-- Purpose: Autoresearch loop — autonomous overnight iterate/evaluate engine.
--          experiment_briefs = the "program.md" (goal, metric, budget).
--          experiment_runs   = per-iteration history (instruction, diff, decision).
--          missions gets two new columns to link into the experiment loop.
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.experiment_metric_type AS ENUM (
    'confidence_score',  -- Read from assets.confidence_score
    'content_length',    -- Character count of the generated asset
    'approval_rate'      -- % of iterations that got approved
);

CREATE TYPE public.experiment_metric_direction AS ENUM (
    'maximize',  -- Higher is better (confidence, length, approval)
    'minimize'   -- Lower is better (cost, time)
);

CREATE TYPE public.experiment_decision AS ENUM (
    'pending',    -- Run has not been evaluated yet
    'baseline',   -- First iteration — establishes the baseline
    'kept',       -- Metric improved, becomes new best
    'discarded'   -- Metric did not improve past threshold
);

-- =============================================================================
-- TABLE: experiment_briefs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.experiment_briefs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Human-readable experiment name
    name                    TEXT NOT NULL,

    -- Natural language description of the experiment goal
    goal                    TEXT NOT NULL,

    -- Which operator team runs each iteration
    operator_team           TEXT NOT NULL DEFAULT 'content_strike',

    -- Target content platform (x, linkedin, youtube, etc.)
    target_platform         TEXT NOT NULL DEFAULT 'x',

    -- What type of asset is produced (post, thread, script, etc.)
    target_asset_type       TEXT NOT NULL DEFAULT 'post',

    -- Metric configuration
    metric_type             public.experiment_metric_type NOT NULL DEFAULT 'confidence_score',
    metric_direction        public.experiment_metric_direction NOT NULL DEFAULT 'maximize',
    metric_target           NUMERIC(10, 4),                              -- Optional absolute target (stop when reached)
    keep_threshold          NUMERIC(10, 4) NOT NULL DEFAULT 0.0,         -- Min improvement delta to keep iteration

    -- Budget limits
    max_tokens_per_run      INTEGER NOT NULL DEFAULT 50000,
    max_duration_ms         INTEGER NOT NULL DEFAULT 120000,
    max_iterations          INTEGER NOT NULL DEFAULT 10,

    -- Iteration tracking (mutable — updated after each run)
    current_iteration       INTEGER NOT NULL DEFAULT 0,
    best_metric_value       NUMERIC(10, 4),
    best_asset_id           UUID REFERENCES public.assets(id) ON DELETE SET NULL,

    -- Schedule (Vercel Cron compatible — standard 5-part cron)
    cron_expression         TEXT NOT NULL DEFAULT '0 6 * * *',  -- 6 AM UTC = 2 AM EST
    timezone                TEXT NOT NULL DEFAULT 'America/New_York',
    last_run_at             TIMESTAMPTZ,
    next_run_at             TIMESTAMPTZ,

    -- Lifecycle
    is_active               BOOLEAN NOT NULL DEFAULT true,
    is_complete             BOOLEAN NOT NULL DEFAULT false,  -- Set when max_iterations reached or target hit

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.experiment_briefs IS 'Autoresearch experiment definitions — goal, metric, budget, and iteration state.';
COMMENT ON COLUMN public.experiment_briefs.goal IS 'Natural language description of what the experiment is trying to optimize.';
COMMENT ON COLUMN public.experiment_briefs.keep_threshold IS 'Minimum metric delta to accept an iteration as improvement. Zero accepts any positive delta.';
COMMENT ON COLUMN public.experiment_briefs.current_iteration IS 'Incremented after each run. Stops at max_iterations.';
COMMENT ON COLUMN public.experiment_briefs.best_asset_id IS 'FK to the asset with the best observed metric value.';

-- =============================================================================
-- TABLE: experiment_runs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.experiment_runs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_brief_id     UUID NOT NULL REFERENCES public.experiment_briefs(id) ON DELETE CASCADE,

    -- Links to the mission that was created for this iteration
    mission_id              UUID REFERENCES public.missions(id) ON DELETE SET NULL,

    -- Iteration number (0 = baseline)
    iteration               INTEGER NOT NULL DEFAULT 0,

    -- The exact instruction sent to the operator team for this iteration
    instruction_used        TEXT NOT NULL,

    -- GPT-5 Nano diff summary: "what changed and why" vs prior iteration
    diff_summary            TEXT,

    -- Metric result
    metric_value            NUMERIC(10, 4),
    metric_delta            NUMERIC(10, 4),  -- Positive = improvement vs prior best

    -- Evaluation outcome
    decision                public.experiment_decision NOT NULL DEFAULT 'pending',
    decision_reason         TEXT,  -- Human-readable reason for keep/discard

    -- Resource consumption
    tokens_used             INTEGER,
    duration_ms             INTEGER,
    exceeded_token_budget   BOOLEAN NOT NULL DEFAULT false,
    exceeded_duration_budget BOOLEAN NOT NULL DEFAULT false,

    -- Timing
    started_at              TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.experiment_runs IS 'Per-iteration history for autoresearch experiments.';
COMMENT ON COLUMN public.experiment_runs.iteration IS '0-indexed. Iteration 0 is the baseline.';
COMMENT ON COLUMN public.experiment_runs.diff_summary IS 'GPT-5 Nano generated summary of what changed vs prior iteration.';
COMMENT ON COLUMN public.experiment_runs.metric_delta IS 'Positive = metric improved vs prior best. Used to make keep/discard decision.';

-- =============================================================================
-- ALTER TABLE: missions — add experiment loop columns
-- =============================================================================

ALTER TABLE public.missions
    ADD COLUMN IF NOT EXISTS experiment_brief_id UUID REFERENCES public.experiment_briefs(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS iteration_number    INTEGER;

COMMENT ON COLUMN public.missions.experiment_brief_id IS 'If set, this mission was created by the autoresearch loop for the given experiment.';
COMMENT ON COLUMN public.missions.iteration_number IS 'Which iteration of the experiment brief this mission represents.';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

ALTER TABLE public.experiment_briefs
    ADD CONSTRAINT experiment_briefs_name_not_empty CHECK (length(trim(name)) > 0);

ALTER TABLE public.experiment_briefs
    ADD CONSTRAINT experiment_briefs_goal_not_empty CHECK (length(trim(goal)) > 0);

ALTER TABLE public.experiment_briefs
    ADD CONSTRAINT experiment_briefs_max_iterations_positive CHECK (max_iterations > 0);

ALTER TABLE public.experiment_runs
    ADD CONSTRAINT experiment_runs_iteration_non_negative CHECK (iteration >= 0);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.experiment_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_runs ENABLE ROW LEVEL SECURITY;

-- experiment_briefs: workspace owner only
CREATE POLICY "experiment_briefs_select_owner"
    ON public.experiment_briefs FOR SELECT
    USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY "experiment_briefs_insert_owner"
    ON public.experiment_briefs FOR INSERT
    WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY "experiment_briefs_update_owner"
    ON public.experiment_briefs FOR UPDATE
    USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY "experiment_briefs_delete_owner"
    ON public.experiment_briefs FOR DELETE
    USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

-- experiment_runs: join via brief's workspace
CREATE POLICY "experiment_runs_select_owner"
    ON public.experiment_runs FOR SELECT
    USING (
        experiment_brief_id IN (
            SELECT id FROM public.experiment_briefs
            WHERE workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "experiment_runs_insert_owner"
    ON public.experiment_runs FOR INSERT
    WITH CHECK (
        experiment_brief_id IN (
            SELECT id FROM public.experiment_briefs
            WHERE workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "experiment_runs_update_owner"
    ON public.experiment_runs FOR UPDATE
    USING (
        experiment_brief_id IN (
            SELECT id FROM public.experiment_briefs
            WHERE workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid())
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- experiment_briefs: find active briefs due to run (used by Vercel Cron)
CREATE INDEX IF NOT EXISTS idx_experiment_briefs_active_next_run
    ON public.experiment_briefs (is_active, next_run_at)
    WHERE is_active = true AND is_complete = false;

-- experiment_briefs: workspace dashboard listing
CREATE INDEX IF NOT EXISTS idx_experiment_briefs_workspace_created
    ON public.experiment_briefs (workspace_id, created_at DESC);

-- experiment_runs: iteration history per brief (most common query)
CREATE INDEX IF NOT EXISTS idx_experiment_runs_brief_iteration
    ON public.experiment_runs (experiment_brief_id, iteration DESC);

-- experiment_runs: find all runs for a mission
CREATE INDEX IF NOT EXISTS idx_experiment_runs_mission_id
    ON public.experiment_runs (mission_id)
    WHERE mission_id IS NOT NULL;

-- missions: find all missions for an experiment
CREATE INDEX IF NOT EXISTS idx_missions_experiment_brief
    ON public.missions (experiment_brief_id)
    WHERE experiment_brief_id IS NOT NULL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at on experiment_briefs
CREATE TRIGGER set_experiment_briefs_updated_at
    BEFORE UPDATE ON public.experiment_briefs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
