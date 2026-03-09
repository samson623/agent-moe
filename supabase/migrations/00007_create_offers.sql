-- =============================================================================
-- Migration 00007: Create offers table
-- =============================================================================
-- Purpose: Monetization paths managed by Revenue Closer.
--          Every asset can be linked to an offer, and every workspace
--          has an "active offer" that operators default to when generating CTAs.
--          This migration also patches the circular FK on workspaces.active_offer_id.
-- =============================================================================

-- =============================================================================
-- ENUM
-- =============================================================================

CREATE TYPE public.offer_type AS ENUM (
    'product',       -- Physical or digital product
    'service',       -- Done-for-you or consulting service
    'lead_magnet',   -- Free resource in exchange for email/contact
    'course',        -- Online course or educational program
    'consultation',  -- Paid discovery/strategy call
    'subscription',  -- Recurring membership or SaaS
    'affiliate'      -- Third-party affiliate offer
);

CREATE TYPE public.offer_status AS ENUM (
    'active',    -- Currently promoted; operators default to this offer for CTAs
    'inactive',  -- Temporarily paused; not used in new content
    'archived'   -- Retired offer; kept for historical tracking
);

COMMENT ON TYPE public.offer_type IS 'Category of monetization offer managed by Revenue Closer.';
COMMENT ON TYPE public.offer_status IS 'Whether this offer is actively being promoted in generated content.';

-- =============================================================================
-- TABLE: offers
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.offers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Display name for the offer
    name          TEXT NOT NULL,

    -- Full offer description (fed to Revenue Closer for CTA generation)
    description   TEXT NOT NULL DEFAULT '',

    -- Category of offer
    offer_type    public.offer_type NOT NULL,

    -- Price in smallest currency unit (cents for USD). NULL = free/unknown
    price_cents   BIGINT CHECK (price_cents IS NULL OR price_cents >= 0),

    -- ISO 4217 currency code
    currency      TEXT NOT NULL DEFAULT 'USD',

    -- CTA button/link text (e.g. "Book a Free Call", "Get Instant Access")
    cta_text      TEXT NOT NULL DEFAULT '',

    -- Destination URL when CTA is clicked
    cta_url       TEXT NOT NULL DEFAULT '',

    -- Whether this offer is actively being promoted
    status        public.offer_status NOT NULL DEFAULT 'active',

    -- Arbitrary metadata: success_stories, objections, differentiators, target_audience
    meta          JSONB NOT NULL DEFAULT '{}',

    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.offers IS 'Monetization offers managed by Revenue Closer. Linked to assets for CTA alignment and conversion tracking.';
COMMENT ON COLUMN public.offers.workspace_id IS 'FK to workspaces. Workspace that owns this offer.';
COMMENT ON COLUMN public.offers.name IS 'Human-readable offer name used in UI and operator context.';
COMMENT ON COLUMN public.offers.description IS 'Full offer description fed to Revenue Closer for generating high-converting CTAs and positioning copy.';
COMMENT ON COLUMN public.offers.offer_type IS 'Type category: product, service, lead_magnet, course, consultation, subscription, affiliate.';
COMMENT ON COLUMN public.offers.price_cents IS 'Price in smallest currency unit (cents for USD). NULL = free or price not set.';
COMMENT ON COLUMN public.offers.currency IS 'ISO 4217 currency code. Defaults to USD.';
COMMENT ON COLUMN public.offers.cta_text IS 'Default CTA button/link text for this offer. e.g. "Get Instant Access", "Book a Free Call".';
COMMENT ON COLUMN public.offers.cta_url IS 'Primary landing page or checkout URL for this offer.';
COMMENT ON COLUMN public.offers.status IS 'Active = used in new content. Inactive = paused. Archived = retired.';
COMMENT ON COLUMN public.offers.meta IS 'Flexible metadata: { success_stories, objections, differentiators, target_audience, bonus_items }.';

-- =============================================================================
-- CIRCULAR FK RESOLUTION
-- =============================================================================
-- workspaces.active_offer_id was created without a FK constraint in migration 00002
-- because offers didn't exist yet. Now we add the FK constraint.

ALTER TABLE public.workspaces
    ADD CONSTRAINT workspaces_active_offer_id_fk
    FOREIGN KEY (active_offer_id)
    REFERENCES public.offers(id)
    ON DELETE SET NULL;

-- Now add the FK on assets.linked_offer_id (created in migration 00006 without a constraint)

ALTER TABLE public.assets
    ADD CONSTRAINT assets_linked_offer_id_fk
    FOREIGN KEY (linked_offer_id)
    REFERENCES public.offers(id)
    ON DELETE SET NULL;

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

ALTER TABLE public.offers
    ADD CONSTRAINT offers_name_not_empty CHECK (length(trim(name)) > 0);

ALTER TABLE public.offers
    ADD CONSTRAINT offers_currency_format CHECK (currency ~ '^[A-Z]{3}$');

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_select_owner"
    ON public.offers
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "offers_insert_owner"
    ON public.offers
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "offers_update_owner"
    ON public.offers
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

CREATE POLICY "offers_delete_owner"
    ON public.offers
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary Revenue Lab view: workspace offers by status
CREATE INDEX IF NOT EXISTS idx_offers_workspace_status
    ON public.offers (workspace_id, status);

-- Offer type filter
CREATE INDEX IF NOT EXISTS idx_offers_workspace_type
    ON public.offers (workspace_id, offer_type);

-- Active offers only (used by operators when selecting default offer)
CREATE INDEX IF NOT EXISTS idx_offers_active
    ON public.offers (workspace_id)
    WHERE status = 'active';
