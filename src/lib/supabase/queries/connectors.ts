/**
 * Supabase query helpers for Connectors + PublishingLogs (Phase 9)
 *
 * SECURITY: The `credentials` column in the connectors table stores encrypted
 * OAuth tokens and API keys. These helpers return it as raw JSONB. API route
 * handlers MUST strip this field before returning connector data to the client.
 * Never expose credentials in responses.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type {
  ConnectorPlatform, ConnectorStatus, Database,
  ConnectorInsert, ConnectorUpdate,
  PublishingLogInsert, PublishingLogUpdate,
} from '@/lib/supabase/types'

export type { ConnectorPlatform, ConnectorStatus }

// createClient() from @supabase/ssr mis-maps type params vs supabase-js v2.98.0,
// causing Schema=never in the postgrest query builder. Casting to SupabaseClient<Database>
// (single type param) correctly resolves Schema=Database['public'].
async function getTypedClient(): Promise<SupabaseClient<Database>> {
  return createClient() as unknown as SupabaseClient<Database>
}

export interface ConnectorConfig {
  account_id?: string
  account_handle?: string
  page_id?: string
  webhook_url?: string
  webhook_secret?: string
  publish_schedule?: string
  list_id?: string
  database_id?: string
  email_from?: string
  email_from_name?: string
  auto_publish?: boolean
  content_filters?: string[]
}

/** Full connector including encrypted credentials (server-side only). */
export interface Connector {
  id: string
  workspace_id: string
  platform: ConnectorPlatform
  name: string
  status: ConnectorStatus
  credentials: Record<string, unknown> // ENCRYPTED — never expose in API responses
  config: ConnectorConfig
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface ConnectorStats {
  total: number
  connected: number
  disconnected: number
  error: number
  pending: number
  published_today: number
  total_published: number
}

export interface CreateConnectorInput {
  workspace_id: string
  platform: ConnectorPlatform
  name: string
  status?: ConnectorStatus
  credentials?: Record<string, unknown>
  config?: ConnectorConfig
}

export interface UpdateConnectorInput {
  name?: string
  status?: ConnectorStatus
  credentials?: Record<string, unknown>
  config?: ConnectorConfig
  last_sync_at?: string
}

export type PublishLogStatus = 'success' | 'failed' | 'pending' | 'cancelled'

export interface PublishingLog {
  id: string
  workspace_id: string
  connector_id: string
  asset_id: string | null
  platform: ConnectorPlatform
  status: PublishLogStatus
  external_post_id: string | null
  external_post_url: string | null
  payload: Record<string, unknown>
  response: Record<string, unknown>
  error_message: string | null
  published_at: string | null
  created_at: string
}

export interface CreatePublishingLogInput {
  workspace_id: string
  connector_id: string
  asset_id?: string
  platform: ConnectorPlatform
  status: PublishLogStatus
  external_post_id?: string
  external_post_url?: string
  payload?: Record<string, unknown>
  response?: Record<string, unknown>
  error_message?: string
  published_at?: string
}

// ---------------------------------------------------------------------------
// Connector queries
// ---------------------------------------------------------------------------

/** List all connectors for a workspace. Includes credentials (server-side only). */
export async function getConnectors(workspaceId: string): Promise<Connector[]> {
  const supabase = await getTypedClient()
  const { data, error } = await supabase
    .from('connectors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getConnectors: ${error.message}`)
  return (data ?? []) as Connector[]
}

/** Get a single connector by ID. Includes credentials (server-side only). */
export async function getConnector(id: string): Promise<Connector | null> {
  const supabase = await getTypedClient()
  const { data, error } = await supabase
    .from('connectors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getConnector: ${error.message}`)
  }
  return data as Connector
}

/** Get a connector by platform for a given workspace. Returns null if not found. */
export async function getConnectorByPlatform(
  workspaceId: string,
  platform: ConnectorPlatform
): Promise<Connector | null> {
  const supabase = await getTypedClient()
  const { data, error } = await supabase
    .from('connectors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform', platform)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getConnectorByPlatform: ${error.message}`)
  }
  return data as Connector
}

/** Create a new connector. */
export async function createConnector(input: CreateConnectorInput): Promise<Connector> {
  const supabase = await getTypedClient()
  const { data, error } = await supabase
    .from('connectors')
    .insert({
      workspace_id: input.workspace_id,
      platform: input.platform,
      name: input.name,
      status: input.status ?? 'pending',
      credentials: input.credentials ?? {},
      config: input.config ?? {},
    } as unknown as ConnectorInsert)
    .select('*')
    .single()

  if (error) throw new Error(`createConnector: ${error.message}`)
  return data as Connector
}

/** Update a connector's name, status, config, or last_sync_at. */
export async function updateConnector(id: string, updates: UpdateConnectorInput): Promise<Connector> {
  const supabase = await getTypedClient()
  const { data, error } = await supabase
    .from('connectors')
    .update({ ...updates, updated_at: new Date().toISOString() } as unknown as ConnectorUpdate)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`updateConnector: ${error.message}`)
  return data as Connector
}

/** Delete a connector and cascade its publishing logs. */
export async function deleteConnector(id: string): Promise<void> {
  const supabase = await getTypedClient()
  const { error } = await supabase
    .from('connectors')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteConnector: ${error.message}`)
}

/** Update the connector's status (and optionally set an error message in config). */
export async function updateConnectorStatus(
  id: string,
  status: ConnectorStatus,
  errorNote?: string
): Promise<void> {
  const supabase = await getTypedClient()
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }

  if (errorNote) {
    // Store error note in config (non-sensitive)
    const { data: existing } = await supabase
      .from('connectors')
      .select('config')
      .eq('id', id)
      .single()

    const currentConfig = (existing?.config as Record<string, unknown>) ?? {}
    updates.config = { ...currentConfig, last_error: errorNote }
  }

  const { error } = await supabase
    .from('connectors')
    .update(updates as unknown as ConnectorUpdate)
    .eq('id', id)

  if (error) throw new Error(`updateConnectorStatus: ${error.message}`)
}

/** Replace the connector's encrypted credentials. */
export async function updateConnectorCredentials(
  id: string,
  credentials: Record<string, unknown>
): Promise<void> {
  const supabase = await getTypedClient()
  const { error } = await supabase
    .from('connectors')
    .update({ credentials, updated_at: new Date().toISOString() } as unknown as ConnectorUpdate)
    .eq('id', id)

  if (error) throw new Error(`updateConnectorCredentials: ${error.message}`)
}

/** Get only connectors with status = 'connected' for a workspace. */
export async function getConnectedConnectors(workspaceId: string): Promise<Connector[]> {
  const supabase = await getTypedClient()
  const { data, error } = await supabase
    .from('connectors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'connected')
    .order('platform')

  if (error) throw new Error(`getConnectedConnectors: ${error.message}`)
  return (data ?? []) as Connector[]
}

/** Aggregate connector stats for a workspace. */
export async function getConnectorStats(workspaceId: string): Promise<ConnectorStats> {
  const supabase = await getTypedClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [connectorsResult, todayResult, totalResult] = await Promise.all([
    supabase
      .from('connectors')
      .select('status')
      .eq('workspace_id', workspaceId),
    supabase
      .from('publishing_logs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'success')
      .gte('published_at', todayStart.toISOString()),
    supabase
      .from('publishing_logs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'success'),
  ])

  if (connectorsResult.error) throw new Error(`getConnectorStats connectors: ${connectorsResult.error.message}`)

  const connectors = connectorsResult.data ?? []
  const stats: ConnectorStats = {
    total: connectors.length,
    connected: connectors.filter((c) => c.status === 'connected').length,
    disconnected: connectors.filter((c) => c.status === 'disconnected').length,
    error: connectors.filter((c) => c.status === 'error').length,
    pending: connectors.filter((c) => c.status === 'pending').length,
    published_today: todayResult.count ?? 0,
    total_published: totalResult.count ?? 0,
  }

  return stats
}

// ---------------------------------------------------------------------------
// Publishing log queries
// ---------------------------------------------------------------------------

/** List publishing logs for a workspace, with optional filtering. */
export async function getPublishingLogs(
  workspaceId: string,
  options: { connectorId?: string; assetId?: string; limit?: number } = {}
): Promise<PublishingLog[]> {
  const supabase = await getTypedClient()
  let query = supabase
    .from('publishing_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50)

  if (options.connectorId) {
    query = query.eq('connector_id', options.connectorId)
  }
  if (options.assetId) {
    query = query.eq('asset_id', options.assetId)
  }

  const { data, error } = await query
  if (error) throw new Error(`getPublishingLogs: ${error.message}`)
  return (data ?? []) as PublishingLog[]
}

/** Insert a new publishing log entry. */
export async function createPublishingLog(input: CreatePublishingLogInput): Promise<PublishingLog> {
  const supabase = await getTypedClient()
  const { data, error } = await supabase
    .from('publishing_logs')
    .insert({
      workspace_id: input.workspace_id,
      connector_id: input.connector_id,
      asset_id: input.asset_id ?? null,
      platform: input.platform,
      status: input.status,
      external_post_id: input.external_post_id ?? null,
      external_post_url: input.external_post_url ?? null,
      payload: input.payload ?? {},
      response: input.response ?? {},
      error_message: input.error_message ?? null,
      published_at: input.published_at ?? null,
    } as unknown as PublishingLogInsert)
    .select('*')
    .single()

  if (error) throw new Error(`createPublishingLog: ${error.message}`)
  return data as PublishingLog
}

/** Update a publishing log (e.g. from pending → success after async confirmation). */
export async function updatePublishingLog(
  id: string,
  updates: Partial<Pick<PublishingLog, 'status' | 'external_post_id' | 'external_post_url' | 'error_message' | 'published_at' | 'response'>>
): Promise<PublishingLog> {
  const supabase = await getTypedClient()
  const { data, error } = await supabase
    .from('publishing_logs')
    .update(updates as unknown as PublishingLogUpdate)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`updatePublishingLog: ${error.message}`)
  return data as PublishingLog
}
