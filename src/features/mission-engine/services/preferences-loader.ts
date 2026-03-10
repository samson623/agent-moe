/**
 * PreferencesLoader — loads workspace context into AI Workspace type
 *
 * Called before every mission plan to give the AI operator full business context:
 * workspace identity, brand rules, active offers, connected platforms.
 *
 * This is a server-only module — it calls createAdminClient() which requires
 * SUPABASE_SERVICE_ROLE_KEY and must never be bundled into the browser.
 */

import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import {
  type Workspace,
  type BrandRules,
  type Offer,
  Platform,
  RiskLevel,
} from '@/features/ai/types'
import type { Database } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Local DB row aliases
// ---------------------------------------------------------------------------

type DbWorkspace = Database['public']['Tables']['workspaces']['Row']
type DbBrandRule = Database['public']['Tables']['brand_rules']['Row']
type DbOffer = Database['public']['Tables']['offers']['Row']
type DbPlatform = Database['public']['Enums']['asset_platform']
type DbSafetyLevel = Database['public']['Enums']['safety_level']

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Maps a DB platform string to the AI Platform enum.
 * 'universal' maps to Platform.GENERIC since there is no direct equivalent.
 */
function mapDbPlatform(dbPlatform: DbPlatform): Platform {
  const map: Record<DbPlatform, Platform> = {
    x: Platform.X,
    linkedin: Platform.LINKEDIN,
    instagram: Platform.INSTAGRAM,
    tiktok: Platform.TIKTOK,
    youtube: Platform.YOUTUBE,
    email: Platform.EMAIL,
    universal: Platform.GENERIC,
  }
  return map[dbPlatform] ?? Platform.GENERIC
}

/**
 * Maps a brand_rules safety_level to the AI RiskLevel.
 *
 * Safety semantics (what the workspace tolerates):
 *   strict   → will only accept CRITICAL-level risks (i.e. nothing risky) → maxRiskLevel = critical
 *   moderate → tolerates up to medium risk                                 → maxRiskLevel = medium
 *   relaxed  → tolerates up to low risk                                    → maxRiskLevel = low
 */
function mapSafetyLevelToRiskLevel(safety: DbSafetyLevel): RiskLevel {
  switch (safety) {
    case 'strict':
      return RiskLevel.CRITICAL
    case 'moderate':
      return RiskLevel.MEDIUM
    case 'relaxed':
      return RiskLevel.LOW
  }
}

/**
 * Maps a DB offer row → AI Offer type.
 * Derives funnelStage from offer type; missing price shown as "contact us".
 */
function mapDbOfferToOffer(dbOffer: DbOffer): Offer {
  const funnelStageByType: Record<DbOffer['offer_type'], Offer['funnelStage']> = {
    lead_magnet: 'awareness',
    product: 'conversion',
    course: 'conversion',
    consultation: 'consideration',
    service: 'consideration',
    subscription: 'conversion',
    affiliate: 'conversion',
  }

  const pricePoint =
    dbOffer.price_cents !== null
      ? `${dbOffer.currency ?? 'USD'} ${(dbOffer.price_cents / 100).toFixed(2)}`
      : 'contact us'

  return {
    id: dbOffer.id,
    name: dbOffer.name,
    description: dbOffer.description ?? '',
    pricePoint,
    funnelStage: funnelStageByType[dbOffer.offer_type] ?? 'consideration',
    cta: dbOffer.cta_text ?? `Get ${dbOffer.name}`,
    ...(dbOffer.cta_url ? { url: dbOffer.cta_url } : {}),
  }
}

/**
 * Maps a DB brand_rules row → AI BrandRules type.
 */
function mapDbBrandRuleToBrandRules(dbRule: DbBrandRule): BrandRules {
  return {
    allowedTone: dbRule.tone_voice ? [dbRule.tone_voice] : ['professional'],
    blockedPhrases: dbRule.blocked_phrases,
    blockedClaims: [],
    requiresDisclaimer: false,
    maxRiskLevel: mapSafetyLevelToRiskLevel(dbRule.safety_level),
  }
}

/**
 * Maps a DB workspace row → connected platforms array.
 * Uses default_platform as the single connected platform (Phase 2 — real connector
 * data comes in Phase 9 when connectors are built out).
 */
function mapWorkspaceToPlatforms(dbWorkspace: DbWorkspace): Platform[] {
  const defaultPlatform = (dbWorkspace.settings as Record<string, unknown>)?.default_platform
  if (typeof defaultPlatform === 'string') {
    return [mapDbPlatform(defaultPlatform as DbPlatform)]
  }
  return [Platform.GENERIC]
}

// ---------------------------------------------------------------------------
// Default brand rules when none are configured
// ---------------------------------------------------------------------------

const DEFAULT_BRAND_RULES: BrandRules = {
  allowedTone: ['professional', 'clear', 'direct'],
  blockedPhrases: [],
  blockedClaims: [],
  requiresDisclaimer: false,
  maxRiskLevel: RiskLevel.MEDIUM,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Loads the full workspace context required by the AI operators.
 *
 * Fetches in parallel:
 * - Workspace row (identity, niche, brand voice, default platform)
 * - Brand rules (tone, blocked phrases, safety level)
 * - Active offers (monetization options for Revenue Closer + Content Strike)
 *
 * Throws a descriptive Error if the workspace cannot be found — callers must
 * catch and handle (the mission cannot proceed without workspace context).
 */
export async function loadWorkspacePreferences(workspaceId: string): Promise<Workspace> {
  const client = createAdminClient()

  // Fetch all three in parallel — they're independent queries
  const [workspaceResult, brandRulesResult, offersResult] = await Promise.all([
    client.from('workspaces').select('*').eq('id', workspaceId).single(),

    client
      .from('brand_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle(),

    client
      .from('offers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active'),
  ])

  // Workspace must exist — throw if not
  if (workspaceResult.error) {
    throw new Error(
      `Failed to load workspace ${workspaceId}: ${workspaceResult.error.message}`,
    )
  }
  if (!workspaceResult.data) {
    throw new Error(
      `Workspace ${workspaceId} not found. Cannot initialize mission context.`,
    )
  }

  const dbWorkspace = workspaceResult.data as unknown as DbWorkspace

  // Brand rules are optional — fall back to defaults if not configured
  const dbBrandRule =
    brandRulesResult.data !== null
      ? (brandRulesResult.data as unknown as DbBrandRule)
      : null

  const brandRules: BrandRules =
    dbBrandRule !== null ? mapDbBrandRuleToBrandRules(dbBrandRule) : DEFAULT_BRAND_RULES

  // Offers — empty array is fine (Revenue Closer will note no offers available)
  const dbOffers: DbOffer[] =
    offersResult.error || !offersResult.data
      ? []
      : (offersResult.data as unknown as DbOffer[])

  const activeOffers: Offer[] = dbOffers.map(mapDbOfferToOffer)

  const workspace: Workspace = {
    id: dbWorkspace.id,
    name: dbWorkspace.name,
    niche: ((dbWorkspace.settings as Record<string, unknown>)?.industry as string) ?? 'general',
    targetAudience: ((dbWorkspace.settings as Record<string, unknown>)?.target_audience as string) ?? 'general audience',
    brandVoice: ((dbWorkspace.settings as Record<string, unknown>)?.brand_voice as string) ?? 'professional',
    activeOffers,
    brandRules,
    connectedPlatforms: mapWorkspaceToPlatforms(dbWorkspace),
  }

  return workspace
}
