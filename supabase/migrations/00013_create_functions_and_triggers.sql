-- =============================================================================
-- Migration 00013: Functions and Triggers
-- =============================================================================
-- Purpose: Automated database logic for:
--   1. Auto-updating updated_at timestamps on all mutable tables
--   2. Auto-creating workspace + brand_rules when a new Supabase Auth user signs up
--   3. Auto-creating a users row when auth.users row is created
--   4. Logging mission status changes to activity_logs
--   5. Logging job status changes to activity_logs
-- =============================================================================

-- =============================================================================
-- FUNCTION 1: set_updated_at
-- =============================================================================
-- Generic trigger function used by all tables with an updated_at column.
-- Automatically sets updated_at = NOW() before any UPDATE operation.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Generic trigger function: sets updated_at = NOW() before any UPDATE. Applied to all mutable tables.';

-- =============================================================================
-- TRIGGER: Apply set_updated_at to all mutable tables
-- =============================================================================

-- users
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- workspaces
CREATE TRIGGER trg_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- brand_rules
CREATE TRIGGER trg_brand_rules_updated_at
    BEFORE UPDATE ON public.brand_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- missions
CREATE TRIGGER trg_missions_updated_at
    BEFORE UPDATE ON public.missions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- jobs
CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- assets
CREATE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- offers
CREATE TRIGGER trg_offers_updated_at
    BEFORE UPDATE ON public.offers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- approvals
CREATE TRIGGER trg_approvals_updated_at
    BEFORE UPDATE ON public.approvals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- connectors
CREATE TRIGGER trg_connectors_updated_at
    BEFORE UPDATE ON public.connectors
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- launch_campaigns
CREATE TRIGGER trg_launch_campaigns_updated_at
    BEFORE UPDATE ON public.launch_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- FUNCTION 2: handle_new_auth_user
-- =============================================================================
-- Triggered when a new user is created in auth.users (Supabase Auth).
-- Creates:
--   1. A public.users row mirroring auth.users
--   2. A default workspace for the user
--   3. Default brand_rules for the workspace

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id  UUID;
    v_slug          TEXT;
    v_full_name     TEXT;
BEGIN
    -- Extract full name from auth metadata (populated by OAuth providers or signup form)
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Generate a URL-safe slug from email prefix
    -- Replaces non-alphanumeric chars with hyphens, lowercases, trims hyphens
    v_slug := lower(
        regexp_replace(
            regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '-', 'g'),
            '-+', '-', 'g'
        )
    );

    -- Ensure slug is unique by appending a short UUID suffix if needed
    IF EXISTS (SELECT 1 FROM public.workspaces WHERE slug = v_slug) THEN
        v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;

    -- 1. Create public.users row
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        )
    )
    ON CONFLICT (id) DO NOTHING; -- Idempotent: safe to re-run

    -- 2. Create default workspace
    INSERT INTO public.workspaces (id, user_id, name, slug, settings)
    VALUES (
        gen_random_uuid(),
        NEW.id,
        COALESCE(v_full_name, 'My Workspace') || '''s Workspace',
        v_slug,
        jsonb_build_object(
            'timezone', 'America/New_York',
            'locale', 'en-US',
            'default_platform', 'universal',
            'notifications_enabled', true
        )
    )
    RETURNING id INTO v_workspace_id;

    -- 3. Create default brand_rules for the workspace
    INSERT INTO public.brand_rules (workspace_id, tone_voice, blocked_phrases, safety_level, auto_approve_threshold, brand_guidelines)
    VALUES (
        v_workspace_id,
        'Professional, direct, and confident. Lead with value. No fluff or filler. Be specific. Use data when available. No hype or empty promises.',
        ARRAY[]::TEXT[],
        'moderate',
        0.85,
        'Default brand guidelines. Update this in Settings > Brand Rules to define your specific voice, style, target audience, and content standards.'
    );

    -- 4. Log the account creation to activity_logs
    INSERT INTO public.activity_logs (
        workspace_id,
        actor,
        action,
        entity_type,
        entity_id,
        message,
        meta
    ) VALUES (
        v_workspace_id,
        'system',
        'workspace.created',
        'workspace',
        v_workspace_id,
        'Platform initialized. Default workspace and brand rules created.',
        jsonb_build_object(
            'user_id', NEW.id,
            'email', NEW.email,
            'workspace_id', v_workspace_id
        )
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't prevent user creation from succeeding
    RAISE WARNING 'handle_new_auth_user failed for user %: % %',
        NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Auth hook: runs when a new user signs up via Supabase Auth. Creates public.users row, default workspace, and default brand_rules automatically.';

-- =============================================================================
-- TRIGGER: Attach handle_new_auth_user to auth.users
-- =============================================================================

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================================================
-- FUNCTION 3: log_mission_status_change
-- =============================================================================
-- Triggered when a mission's status column changes.
-- Writes a narrative entry to activity_logs.

CREATE OR REPLACE FUNCTION public.log_mission_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_message TEXT;
BEGIN
    -- Only fire when status actually changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Build human-readable message based on new status
    v_message := CASE NEW.status
        WHEN 'planning'   THEN 'Mission Engine is decomposing mission "' || NEW.title || '" into jobs.'
        WHEN 'running'    THEN 'Mission "' || NEW.title || '" is now running — operator teams are executing jobs.'
        WHEN 'paused'     THEN 'Mission "' || NEW.title || '" has been paused. Jobs will hold until resumed.'
        WHEN 'completed'  THEN 'Mission "' || NEW.title || '" completed successfully.'
        WHEN 'failed'     THEN 'Mission "' || NEW.title || '" failed. Check job logs for error details.'
        ELSE 'Mission "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status || '.'
    END;

    INSERT INTO public.activity_logs (
        workspace_id,
        actor,
        action,
        entity_type,
        entity_id,
        message,
        meta
    ) VALUES (
        NEW.workspace_id,
        'system',
        'mission.status_changed',
        'mission',
        NEW.id,
        v_message,
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'mission_title', NEW.title,
            'priority', NEW.priority
        )
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'log_mission_status_change failed for mission %: % %',
        NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.log_mission_status_change() IS 'Trigger function: logs mission status transitions to activity_logs with human-readable narrative.';

-- Apply trigger to missions table
CREATE TRIGGER trg_mission_status_change
    AFTER UPDATE OF status ON public.missions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_mission_status_change();

-- =============================================================================
-- FUNCTION 4: log_job_status_change
-- =============================================================================
-- Triggered when a job's status column changes.
-- Writes a narrative entry to activity_logs with operator team context.

CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_message      TEXT;
    v_actor        TEXT;
    v_action       TEXT;
BEGIN
    -- Only fire when status actually changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Map operator_team enum to display name
    v_actor := CASE NEW.operator_team
        WHEN 'content_strike'  THEN 'content_strike'
        WHEN 'growth_operator' THEN 'growth_operator'
        WHEN 'revenue_closer'  THEN 'revenue_closer'
        WHEN 'brand_guardian'  THEN 'brand_guardian'
        ELSE 'system'
    END;

    -- Determine action and message based on new status
    v_action := 'job.' || NEW.status::TEXT;

    v_message := CASE NEW.status
        WHEN 'running'   THEN
            initcap(replace(NEW.operator_team::TEXT, '_', ' ')) ||
            ' started job: ' || NEW.title || '.'
        WHEN 'completed' THEN
            initcap(replace(NEW.operator_team::TEXT, '_', ' ')) ||
            ' completed job: ' || NEW.title || '.'
        WHEN 'failed'    THEN
            'Job "' || NEW.title || '" failed' ||
            COALESCE(': ' || NEW.error_message, '.') ||
            ' (Operator: ' || initcap(replace(NEW.operator_team::TEXT, '_', ' ')) || ')'
        WHEN 'cancelled' THEN
            'Job "' || NEW.title || '" was cancelled.'
        ELSE
            'Job "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status || '.'
    END;

    INSERT INTO public.activity_logs (
        workspace_id,
        actor,
        action,
        entity_type,
        entity_id,
        message,
        meta
    ) VALUES (
        NEW.workspace_id,
        v_actor,
        v_action,
        'job',
        NEW.id,
        v_message,
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'job_type', NEW.job_type,
            'operator_team', NEW.operator_team,
            'mission_id', NEW.mission_id,
            'model_used', NEW.model_used,
            'duration_ms', CASE
                WHEN NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000
                ELSE NULL
            END
        )
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'log_job_status_change failed for job %: % %',
        NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.log_job_status_change() IS 'Trigger function: logs job status transitions to activity_logs with operator team context and duration tracking.';

-- Apply trigger to jobs table
CREATE TRIGGER trg_job_status_change
    AFTER UPDATE OF status ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.log_job_status_change();

-- =============================================================================
-- FUNCTION 5: track_analytics_on_asset_status_change
-- =============================================================================
-- Records analytics events when assets move through their lifecycle.
-- Enables conversion funnel analysis (generated → approved → published).

CREATE OR REPLACE FUNCTION public.track_analytics_on_asset_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_type TEXT;
BEGIN
    -- Only fire when status actually changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Map status transitions to event types
    v_event_type := 'asset.' || NEW.status::TEXT;

    INSERT INTO public.analytics_events (
        workspace_id,
        event_type,
        entity_type,
        entity_id,
        properties,
        occurred_at
    ) VALUES (
        NEW.workspace_id,
        v_event_type,
        'asset',
        NEW.id,
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'asset_type', NEW.asset_type,
            'platform', NEW.platform,
            'operator_team', NEW.operator_team,
            'confidence_score', NEW.confidence_score,
            'version', NEW.version,
            'mission_id', NEW.mission_id,
            'job_id', NEW.job_id,
            'linked_offer_id', NEW.linked_offer_id
        ),
        NOW()
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'track_analytics_on_asset_status_change failed for asset %: % %',
        NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.track_analytics_on_asset_status_change() IS 'Trigger function: records analytics events on asset status changes. Powers conversion funnel analysis.';

-- Apply trigger to assets table
CREATE TRIGGER trg_asset_status_analytics
    AFTER UPDATE OF status ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.track_analytics_on_asset_status_change();

-- =============================================================================
-- FUNCTION 6: track_analytics_on_mission_completion
-- =============================================================================
-- Records a detailed analytics event when a mission completes.
-- Captures job count, asset count, and duration for performance tracking.

CREATE OR REPLACE FUNCTION public.track_analytics_on_mission_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_count   INTEGER;
    v_asset_count INTEGER;
BEGIN
    -- Only fire on completion or failure transitions
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status NOT IN ('completed', 'failed') THEN
        RETURN NEW;
    END IF;

    -- Count jobs for this mission
    SELECT COUNT(*) INTO v_job_count
    FROM public.jobs
    WHERE mission_id = NEW.id;

    -- Count assets generated for this mission
    SELECT COUNT(*) INTO v_asset_count
    FROM public.assets
    WHERE mission_id = NEW.id;

    INSERT INTO public.analytics_events (
        workspace_id,
        event_type,
        entity_type,
        entity_id,
        properties,
        occurred_at
    ) VALUES (
        NEW.workspace_id,
        'mission.' || NEW.status::TEXT,
        'mission',
        NEW.id,
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'title', NEW.title,
            'priority', NEW.priority,
            'job_count', v_job_count,
            'asset_count', v_asset_count,
            'duration_ms', EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) * 1000
        ),
        NOW()
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'track_analytics_on_mission_completion failed for mission %: % %',
        NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.track_analytics_on_mission_completion() IS 'Trigger function: records mission completion/failure analytics event with job and asset counts.';

-- Apply trigger to missions table
CREATE TRIGGER trg_mission_completion_analytics
    AFTER UPDATE OF status ON public.missions
    FOR EACH ROW
    EXECUTE FUNCTION public.track_analytics_on_mission_completion();
