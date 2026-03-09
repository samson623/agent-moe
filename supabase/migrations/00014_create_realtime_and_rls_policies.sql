-- =============================================================================
-- Migration 00014: Realtime subscriptions and complete RLS policy audit
-- =============================================================================
-- Purpose:
--   1. Enable Supabase Realtime for live-updating tables
--   2. Complete RLS policy verification and any supplemental policies
--   3. Grant appropriate permissions to authenticated role
-- =============================================================================

-- =============================================================================
-- SECTION 1: Enable Realtime
-- =============================================================================
-- Adds tables to the supabase_realtime publication so clients can subscribe
-- to INSERT, UPDATE, DELETE events via Supabase's realtime websocket.

-- Drop any existing publication config first (idempotent approach)
DO $$
BEGIN
    -- Only create if the publication doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Enable realtime for missions (live status updates on Command Center)
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;

-- Enable realtime for jobs (live job execution tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- Enable realtime for assets (live content feed in Content Studio)
ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;

-- Enable realtime for approvals (live approval queue badge count)
ALTER PUBLICATION supabase_realtime ADD TABLE public.approvals;

-- Enable realtime for activity_logs (live activity feed on dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Enable realtime for analytics_events (live stats dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;

COMMENT ON PUBLICATION supabase_realtime IS 'Supabase Realtime publication. Missions, jobs, assets, approvals, activity_logs, and analytics_events broadcast live changes to subscribed clients.';

-- =============================================================================
-- SECTION 2: Grant schema usage to authenticated role
-- =============================================================================
-- Required for RLS policies using auth.uid() to function correctly.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- =============================================================================
-- SECTION 3: Table-level grants for authenticated users
-- =============================================================================
-- RLS policies handle row-level access; these grants handle table-level access.
-- Authenticated users get full CRUD. Anon users get nothing (private platform).

-- users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- workspaces
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;

-- brand_rules
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_rules TO authenticated;

-- missions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missions TO authenticated;

-- jobs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;

-- assets
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;

-- offers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;

-- approvals
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approvals TO authenticated;

-- connectors
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connectors TO authenticated;

-- analytics_events (append-only for authenticated; service_role can backfill)
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;

-- activity_logs (append-only for authenticated; service_role can backfill)
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

-- launch_campaigns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.launch_campaigns TO authenticated;

-- Sequence grants for BIGSERIAL tables
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.activity_logs_id_seq TO authenticated;

-- =============================================================================
-- SECTION 4: Supplemental RLS policies for edge cases
-- =============================================================================
-- The base policies (SELECT/INSERT/UPDATE/DELETE) were created in each table's
-- migration. This section adds any supplemental or cross-table policies.

-- Policy: Allow service_role to bypass RLS entirely (Supabase default)
-- Service role is used by:
-- - Trigger functions (SECURITY DEFINER bypasses RLS already)
-- - Server-side API routes using service_role key
-- - Job executor running as service_role
-- No additional policy needed — service_role bypasses RLS by default in Supabase.

-- =============================================================================
-- SECTION 5: Verify RLS is enabled on all tables (safety check)
-- =============================================================================
-- This block raises a WARNING (not an error) if any table has RLS disabled.
-- Safe to run in production — won't break anything.

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN (
            'users', 'workspaces', 'brand_rules', 'missions', 'jobs',
            'assets', 'offers', 'approvals', 'connectors',
            'analytics_events', 'activity_logs', 'launch_campaigns'
        )
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = tbl.schemaname
            AND c.relname = tbl.tablename
            AND c.relrowsecurity = TRUE
        ) THEN
            RAISE WARNING 'RLS NOT ENABLED on table: %.%',
                tbl.schemaname, tbl.tablename;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- SECTION 6: Realtime replica identity
-- =============================================================================
-- Required for Realtime to correctly broadcast UPDATE and DELETE events.
-- FULL means the entire old row is included in change events (needed for RLS
-- filtering on the client side).

ALTER TABLE public.missions        REPLICA IDENTITY FULL;
ALTER TABLE public.jobs            REPLICA IDENTITY FULL;
ALTER TABLE public.assets          REPLICA IDENTITY FULL;
ALTER TABLE public.approvals       REPLICA IDENTITY FULL;
ALTER TABLE public.activity_logs   REPLICA IDENTITY FULL;
ALTER TABLE public.analytics_events REPLICA IDENTITY FULL;

-- =============================================================================
-- SECTION 7: Additional composite RLS helper function
-- =============================================================================
-- Convenience function to check workspace ownership without repeating the subquery.
-- Used internally by application code for double-checking ownership before writes.

CREATE OR REPLACE FUNCTION public.is_workspace_owner(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspaces
        WHERE id = p_workspace_id
        AND user_id = auth.uid()
    );
$$;

COMMENT ON FUNCTION public.is_workspace_owner(UUID) IS 'Returns TRUE if the currently authenticated user owns the given workspace. Use in application-layer ownership checks.';

GRANT EXECUTE ON FUNCTION public.is_workspace_owner(UUID) TO authenticated;
