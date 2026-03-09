-- =============================================================================
-- Migration 00003: Create brand_rules table
-- =============================================================================
-- Purpose: Brand Guardian's ruleset. Defines tone/voice, blocked phrases,
--          safety thresholds, and auto-approval confidence levels.
--          One brand_rules row per workspace (enforced via unique constraint).
-- =============================================================================

-- =============================================================================
-- ENUM: safety_level
-- =============================================================================

CREATE TYPE public.safety_level AS ENUM (
    'strict',    -- All content requires manual approval. Zero auto-approval.
    'moderate',  -- Auto-approve high-confidence, low-risk content.
    'relaxed'    -- Approve most content automatically. Flag only clear violations.
);

COMMENT ON TYPE public.safety_level IS 'Controls how aggressively the Brand Guardian blocks or flags content.';

-- =============================================================================
-- TABLE: brand_rules
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.brand_rules (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id             UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Prose description of brand voice, style, and tone (fed to AI operators)
    tone_voice               TEXT NOT NULL DEFAULT 'Professional, direct, and confident. No fluff. Leads with value.',

    -- Array of exact phrases or patterns the Brand Guardian blocks from all output
    blocked_phrases          TEXT[] NOT NULL DEFAULT '{}',

    -- Safety strictness (controls auto-approval behavior)
    safety_level             public.safety_level NOT NULL DEFAULT 'moderate',

    -- Confidence score (0.0–1.0) above which content is auto-approved without human review
    -- Only applies when safety_level != 'strict'
    auto_approve_threshold   FLOAT NOT NULL DEFAULT 0.85
                                 CHECK (auto_approve_threshold >= 0.0 AND auto_approve_threshold <= 1.0),

    -- Long-form brand guidelines document fed to Content Strike Team
    brand_guidelines         TEXT NOT NULL DEFAULT '',

    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.brand_rules IS 'Brand Guardian configuration. One row per workspace. Controls tone, safety, and auto-approval behavior for all AI-generated content.';
COMMENT ON COLUMN public.brand_rules.workspace_id IS 'FK to workspaces. Each workspace has exactly one brand_rules row.';
COMMENT ON COLUMN public.brand_rules.tone_voice IS 'Natural language description of desired brand voice. Injected into operator system prompts.';
COMMENT ON COLUMN public.brand_rules.blocked_phrases IS 'Exact strings the Brand Guardian will flag and block. Checked against all generated content.';
COMMENT ON COLUMN public.brand_rules.safety_level IS 'Strict = nothing auto-approves. Moderate = high-confidence auto-approves. Relaxed = most auto-approves.';
COMMENT ON COLUMN public.brand_rules.auto_approve_threshold IS 'Confidence score (0–1) above which content skips manual review. Only active when safety_level is moderate or relaxed.';
COMMENT ON COLUMN public.brand_rules.brand_guidelines IS 'Full brand guidelines document. Fed to Content Strike Team as context for every generation job.';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- One brand_rules record per workspace
ALTER TABLE public.brand_rules
    ADD CONSTRAINT brand_rules_workspace_unique UNIQUE (workspace_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.brand_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_rules_select_owner"
    ON public.brand_rules
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "brand_rules_insert_owner"
    ON public.brand_rules
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "brand_rules_update_owner"
    ON public.brand_rules
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

CREATE POLICY "brand_rules_delete_owner"
    ON public.brand_rules
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_brand_rules_workspace_id ON public.brand_rules (workspace_id);
