/**
 * Offer query helpers.
 *
 * Offers represent the monetisation layer of the workspace — products,
 * services, lead magnets, courses, consultations, subscriptions, and
 * affiliate items. These helpers cover the full CRUD surface needed by
 * Revenue Lab, the Mission engine (CTA injection), and the dashboard stats.
 *
 * Every function accepts a typed Supabase client so the same helpers work
 * from Server Components, API routes, and background jobs. All functions
 * return `{ data, error }` — callers decide how to surface failures.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  Offer,
  OfferInsert,
  OfferRow,
  OfferStatus,
  OfferType,
  OfferUpdate,
} from '../types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface OfferFilters {
  status?: OfferStatus
  offer_type?: OfferType
  limit?: number
  offset?: number
}

export interface OfferStats {
  total: number
  active: number
  inactive: number
  archived: number
  by_type: Record<string, number>
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toOffer(row: OfferRow): Offer {
  return { ...row }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns a list of offers for a workspace with optional filters.
 * Results are ordered newest-first by default.
 */
export async function getOffers(
  client: TypedClient,
  workspaceId: string,
  options: OfferFilters = {},
): Promise<{ data: Offer[]; error: string | null }> {
  const { status, offer_type, limit = 100, offset = 0 } = options

  let query = client
    .from('offers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }
  if (offer_type) {
    query = query.eq('offer_type', offer_type)
  }

  const { data, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []).map(toOffer), error: null }
}

/**
 * Returns a single offer by ID.
 * Returns null (not an error) when the row does not exist (PGRST116).
 */
export async function getOffer(
  client: TypedClient,
  id: string,
): Promise<{ data: Offer | null; error: string | null }> {
  const { data, error } = await client
    .from('offers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    // PGRST116 = "no rows returned" — treat as not found, not an error
    if (error.code === 'PGRST116') {
      return { data: null, error: null }
    }
    return { data: null, error: error.message }
  }

  return { data: data ? toOffer(data) : null, error: null }
}

/**
 * Inserts a new offer row and returns the created record.
 */
export async function createOffer(
  client: TypedClient,
  input: OfferInsert,
): Promise<{ data: Offer | null; error: string | null }> {
  const { data, error } = await client
    .from('offers')
    .insert(input as unknown as OfferInsert)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ? toOffer(data) : null, error: null }
}

/**
 * Patches an existing offer. Always stamps `updated_at` with the current time.
 */
export async function updateOffer(
  client: TypedClient,
  id: string,
  updates: OfferUpdate,
): Promise<{ data: Offer | null; error: string | null }> {
  const payload: OfferUpdate = {
    ...(updates as unknown as OfferUpdate),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from('offers')
    .update(payload as unknown as OfferUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ? toOffer(data) : null, error: null }
}

/**
 * Hard-deletes an offer by ID.
 */
export async function deleteOffer(
  client: TypedClient,
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('offers')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Returns all active offers for a workspace, newest first.
 * Convenience wrapper used by the CTA injection layer.
 */
export async function getActiveOffers(
  client: TypedClient,
  workspaceId: string,
): Promise<{ data: Offer[]; error: string | null }> {
  return getOffers(client, workspaceId, { status: 'active' })
}

/**
 * Returns all offers of a specific type for a workspace.
 */
export async function getOffersByType(
  client: TypedClient,
  workspaceId: string,
  offerType: OfferType,
): Promise<{ data: Offer[]; error: string | null }> {
  return getOffers(client, workspaceId, { offer_type: offerType })
}

/**
 * Sets the workspace's active offer — writes `active_offer_id` on the
 * workspaces row. Pass `null` to clear the active offer.
 */
export async function setWorkspaceActiveOffer(
  client: TypedClient,
  workspaceId: string,
  offerId: string | null,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('workspaces')
    .update({ active_offer_id: offerId })
    .eq('id', workspaceId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Returns aggregate statistics about the offers in a workspace.
 * Counts are derived from a single DB query for efficiency.
 */
export async function getOfferStats(
  client: TypedClient,
  workspaceId: string,
): Promise<{ data: OfferStats | null; error: string | null }> {
  const { data, error } = await client
    .from('offers')
    .select('status, offer_type')
    .eq('workspace_id', workspaceId)

  if (error) {
    return { data: null, error: error.message }
  }

  const rows = data ?? []

  const stats: OfferStats = {
    total: rows.length,
    active: 0,
    inactive: 0,
    archived: 0,
    by_type: {},
  }

  for (const row of rows) {
    // Status counts
    if (row.status === 'active') stats.active++
    else if (row.status === 'inactive') stats.inactive++
    else if (row.status === 'archived') stats.archived++

    // Type counts
    const t = row.offer_type
    stats.by_type[t] = (stats.by_type[t] ?? 0) + 1
  }

  return { data: stats, error: null }
}

/**
 * Returns all offers for a workspace ordered by price ascending.
 * Null-priced offers (free / lead magnets) come first.
 * Useful for building a pricing ladder visualisation.
 */
export async function getPricingLadder(
  client: TypedClient,
  workspaceId: string,
): Promise<{ data: Offer[]; error: string | null }> {
  const { data, error } = await client
    .from('offers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('price_cents', { ascending: true, nullsFirst: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []).map(toOffer), error: null }
}
