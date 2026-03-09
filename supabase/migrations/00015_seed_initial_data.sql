-- =============================================================================
-- Migration 00015: Seed Initial Data
-- =============================================================================
-- Purpose: Inserts template/default data that helps users get started quickly.
--          All inserts are conditional (DO NOTHING on conflict) — safe to re-run.
--
-- Note: This seed does NOT insert a hardcoded user or workspace row because
--       those are created automatically by the handle_new_auth_user trigger
--       when the user first signs up. Instead, this file seeds template offers
--       that will be visible to the workspace created on first login.
--
-- Template offers are inserted using a special "template" mechanism:
-- They are stored in a staging table or as workspace-agnostic seed data
-- that the application copies into the user's workspace on first setup.
--
-- Since workspaces are created dynamically, the seed data below uses a
-- PL/pgSQL block that operates on the first available workspace for the
-- first registered user (post-signup seeding pattern).
-- =============================================================================

-- =============================================================================
-- SEED: Default Brand Rules (template values for reference)
-- =============================================================================
-- Brand rules are auto-created by the trigger with sensible defaults.
-- This section documents the expected default values for testing/verification.
-- No INSERT needed here — trigger handles it.

-- =============================================================================
-- SEED: Template Offers
-- =============================================================================
-- Inserts 3 template offers into the first workspace found in the system.
-- In production (single private user), there will be exactly one workspace.
-- These templates give Revenue Closer something to work with immediately.

DO $$
DECLARE
    v_workspace_id  UUID;
BEGIN
    -- Find the first workspace (single-user platform, only one workspace exists)
    SELECT id INTO v_workspace_id
    FROM public.workspaces
    ORDER BY created_at ASC
    LIMIT 1;

    -- Only seed if a workspace exists (user has signed up)
    IF v_workspace_id IS NULL THEN
        RAISE NOTICE 'No workspace found. Skipping offer seed. Offers will be seeded on first login.';
        RETURN;
    END IF;

    -- Offer 1: High-Ticket Consulting Package
    INSERT INTO public.offers (
        id,
        workspace_id,
        name,
        description,
        offer_type,
        price_cents,
        currency,
        cta_text,
        cta_url,
        status,
        meta
    ) VALUES (
        gen_random_uuid(),
        v_workspace_id,
        'Strategy Intensive',
        'A high-touch 1-on-1 consulting engagement. Work directly together to build, position, and launch your core offer. Includes deep-dive strategy session, custom roadmap, 30-day implementation support, and direct access via a private channel. Designed for serious operators ready to move fast.',
        'consultation',
        497000,  -- $4,970.00
        'USD',
        'Book Your Strategy Intensive',
        'https://cal.com/placeholder',
        'active',
        jsonb_build_object(
            'target_audience', 'Coaches, consultants, and course creators doing $5K–$50K/month who want to scale',
            'differentiators', ARRAY[
                'Direct access to operator (not a team)',
                'Custom strategy — not a template',
                'Results-focused: tied to specific revenue goal',
                '30-day implementation support included'
            ],
            'objections', ARRAY[
                'Too expensive — reframe as investment with measurable ROI',
                'Not sure if it''s right for me — offer a free 15-min clarity call'
            ],
            'success_stories', ARRAY[
                'Client went from $8K to $34K/month in 6 weeks',
                'Launched course that generated $112K in first week'
            ]
        )
    )
    ON CONFLICT DO NOTHING;

    -- Offer 2: Digital Course / Knowledge Product
    INSERT INTO public.offers (
        id,
        workspace_id,
        name,
        description,
        offer_type,
        price_cents,
        currency,
        cta_text,
        cta_url,
        status,
        meta
    ) VALUES (
        gen_random_uuid(),
        v_workspace_id,
        'Operator System Course',
        'The complete self-paced system for building an AI-powered operator platform. Step-by-step curriculum covering mission design, operator architecture, approval workflows, and monetization. Includes lifetime access, future updates, and a private community. Learn what took years to build in days.',
        'course',
        49700,  -- $497.00
        'USD',
        'Get Instant Access',
        'https://placeholder.course/checkout',
        'active',
        jsonb_build_object(
            'target_audience', 'Founders, solopreneurs, and digital product creators who want to leverage AI operators',
            'modules', ARRAY[
                'Module 1: Mission Architecture',
                'Module 2: Operator Teams Setup',
                'Module 3: Content Strike System',
                'Module 4: Revenue Closer Framework',
                'Module 5: Brand Guardian Configuration',
                'Module 6: Launch Campaigns'
            ],
            'differentiators', ARRAY[
                'Battle-tested system — not theoretical',
                'Plug-and-play templates included',
                'Lifetime access + updates',
                'Private community access'
            ],
            'bonus_items', ARRAY[
                'Operator prompt library (47 prompts)',
                'Mission template pack',
                'Brand rules configuration guide'
            ]
        )
    )
    ON CONFLICT DO NOTHING;

    -- Offer 3: Free Lead Magnet
    INSERT INTO public.offers (
        id,
        workspace_id,
        name,
        description,
        offer_type,
        price_cents,
        currency,
        cta_text,
        cta_url,
        status,
        meta
    ) VALUES (
        gen_random_uuid(),
        v_workspace_id,
        'AI Operator Playbook (Free)',
        'A free PDF guide covering the 5-step framework for turning one idea into a full content campaign using AI operators. Includes a mission template, operator cheat sheet, and a worked example campaign from start to published. Downloaded by 3,000+ operators.',
        'lead_magnet',
        NULL,  -- Free
        'USD',
        'Download Free Playbook',
        'https://placeholder.com/playbook',
        'active',
        jsonb_build_object(
            'target_audience', 'Anyone curious about AI operator systems — broad top-of-funnel',
            'format', 'PDF (23 pages)',
            'funnel_next_step', 'Email sequence leading to Operator System Course',
            'conversion_goal', 'Email list subscriber → Course buyer (5–7 day email sequence)',
            'content_hooks', ARRAY[
                'The exact mission format we used to generate $40K in content in one week',
                '5 operator prompts that do the work of a full team',
                'How to go from idea to 30 pieces of content in 2 hours'
            ]
        )
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seed complete: 3 template offers inserted for workspace %', v_workspace_id;

END $$;

-- =============================================================================
-- SEED: Activity Log Entry for Seed Completion
-- =============================================================================

DO $$
DECLARE
    v_workspace_id  UUID;
BEGIN
    SELECT id INTO v_workspace_id
    FROM public.workspaces
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_workspace_id IS NOT NULL THEN
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
            'platform.seeded',
            'workspace',
            v_workspace_id,
            'Platform seed complete. 3 template offers loaded. Ready to accept your first mission.',
            jsonb_build_object(
                'seed_version', '00015',
                'offers_seeded', 3,
                'seeded_at', NOW()
            )
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
