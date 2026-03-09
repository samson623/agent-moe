-- =============================================================================
-- Migration 00001: Create users table
-- =============================================================================
-- Purpose: Single private user system. One authenticated user owns everything.
--          Mirrors auth.users from Supabase Auth with additional profile fields.
-- =============================================================================

-- Enable UUID extension (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE: users
-- =============================================================================
-- Mirrors auth.users and stores additional profile metadata.
-- The id MUST match auth.uid() — synced via trigger in migration 00013.

CREATE TABLE IF NOT EXISTS public.users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    full_name     TEXT,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.users IS 'Private user profile. Single-user platform — one row per authenticated Supabase user.';
COMMENT ON COLUMN public.users.id IS 'Must match auth.uid() from Supabase Auth. Synced via handle_new_auth_user trigger.';
COMMENT ON COLUMN public.users.email IS 'User email address. Pulled from auth.users on creation.';
COMMENT ON COLUMN public.users.full_name IS 'Display name for activity logs and UI.';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to profile avatar image (Supabase Storage or external).';
COMMENT ON COLUMN public.users.created_at IS 'Timestamp of first login / account creation.';
COMMENT ON COLUMN public.users.updated_at IS 'Last profile update. Auto-maintained by trigger.';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only view their own row
CREATE POLICY "users_select_own"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can only insert their own row
CREATE POLICY "users_insert_own"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can only update their own row
CREATE POLICY "users_update_own"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users cannot delete their own row (admin action only)
-- No DELETE policy — deletion must go through service role key

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at DESC);
