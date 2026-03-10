/**
 * Connectors — Phase 9 Domain Types
 *
 * Types for the Connectors feature: platform adapters, OAuth flows,
 * publishing pipeline, and platform capability registry.
 */

// ---------------------------------------------------------------------------
// Core connector enums / union types
// ---------------------------------------------------------------------------

export type ConnectorPlatform =
  | 'x'
  | 'linkedin'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'email'
  | 'notion'
  | 'airtable'
  | 'webhook'

export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'pending'

export type PublishStatus = 'success' | 'failed' | 'pending' | 'cancelled'

// ---------------------------------------------------------------------------
// Credentials — stored encrypted in connectors.credentials (JSONB)
// ---------------------------------------------------------------------------

/** Stored in connectors.credentials — encrypted at application layer before write. */
export interface ConnectorCredentials {
  access_token?: string
  refresh_token?: string
  token_expiry?: string      // ISO timestamp
  token_type?: string
  scopes?: string[]
  api_key?: string           // for API-key-only connectors (Resend, Airtable)
  webhook_url?: string       // for webhook connectors
  webhook_secret?: string    // HMAC signing secret
  account_id?: string        // user ID on the platform
  account_handle?: string    // @handle for X, display name for others
  page_id?: string           // LinkedIn company page / Instagram page / Facebook page ID
  database_id?: string       // Notion database ID
  list_id?: string           // Email list / audience ID
}

// ---------------------------------------------------------------------------
// Connector config (non-sensitive, stored in connectors.config JSONB)
// ---------------------------------------------------------------------------

export interface ConnectorConfig {
  account_id?: string
  account_handle?: string
  page_id?: string
  webhook_url?: string
  webhook_secret?: string
  publish_schedule?: string
  list_id?: string
  database_id?: string       // Notion
  email_from?: string
  email_from_name?: string
  auto_publish?: boolean
  content_filters?: string[]
}

// ---------------------------------------------------------------------------
// Connector entity (as returned by API — credentials STRIPPED)
// ---------------------------------------------------------------------------

export interface Connector {
  id: string
  workspace_id: string
  platform: ConnectorPlatform
  name: string
  status: ConnectorStatus
  config: ConnectorConfig
  last_sync_at: string | null
  created_at: string
  updated_at: string
  // Note: credentials field is NEVER included in API responses
}

// ---------------------------------------------------------------------------
// Publishing input / result
// ---------------------------------------------------------------------------

export interface PublishInput {
  connectorId: string
  assetId?: string
  content: string
  contentType: 'post' | 'thread' | 'script' | 'caption' | 'video_concept' | 'cta'
  platform: ConnectorPlatform
  title?: string           // YouTube, Notion
  mediaUrls?: string[]     // image/video URLs
  hashtags?: string[]
  scheduledAt?: string     // ISO timestamp
  metadata?: Record<string, unknown>
}

export interface PublishResult {
  success: boolean
  platform: ConnectorPlatform
  externalPostId?: string
  externalPostUrl?: string
  publishedAt?: string
  response?: Record<string, unknown>
  error?: string
  durationMs: number
}

// ---------------------------------------------------------------------------
// Connection test result
// ---------------------------------------------------------------------------

export interface ConnectionTestResult {
  success: boolean
  platform: ConnectorPlatform
  accountHandle?: string
  accountId?: string
  scopes?: string[]
  error?: string
  latencyMs: number
}

// ---------------------------------------------------------------------------
// OAuth types
// ---------------------------------------------------------------------------

export interface OAuthStartResult {
  authUrl: string
  state: string          // CSRF token
  codeVerifier?: string  // PKCE verifier (for X)
}

export interface OAuthCallbackResult {
  success: boolean
  credentials: ConnectorCredentials
  error?: string
}

// ---------------------------------------------------------------------------
// Platform capabilities registry
// ---------------------------------------------------------------------------

export interface PlatformCapabilities {
  platform: ConnectorPlatform
  displayName: string
  authType: 'oauth2' | 'api_key' | 'webhook' | 'oauth2_pkce'
  supportedContentTypes: PublishInput['contentType'][]
  maxCharacters?: number
  supportsMedia: boolean
  supportsScheduling: boolean
  supportsThreads: boolean
  color: string
  iconText: string
}

export const PLATFORM_CAPABILITIES: Record<ConnectorPlatform, PlatformCapabilities> = {
  x: {
    platform: 'x',
    displayName: 'X / Twitter',
    authType: 'oauth2_pkce',
    supportedContentTypes: ['post', 'thread', 'cta'],
    maxCharacters: 280,
    supportsMedia: true,
    supportsScheduling: false,
    supportsThreads: true,
    color: '#e2e8f0',
    iconText: 'X',
  },
  linkedin: {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    authType: 'oauth2',
    supportedContentTypes: ['post', 'cta'],
    maxCharacters: 3000,
    supportsMedia: true,
    supportsScheduling: false,
    supportsThreads: false,
    color: '#0077b5',
    iconText: 'in',
  },
  instagram: {
    platform: 'instagram',
    displayName: 'Instagram',
    authType: 'oauth2',
    supportedContentTypes: ['caption', 'cta'],
    maxCharacters: 2200,
    supportsMedia: true,
    supportsScheduling: false,
    supportsThreads: false,
    color: '#e1306c',
    iconText: 'IG',
  },
  tiktok: {
    platform: 'tiktok',
    displayName: 'TikTok',
    authType: 'oauth2',
    supportedContentTypes: ['script', 'caption'],
    supportsMedia: true,
    supportsScheduling: false,
    supportsThreads: false,
    color: '#010101',
    iconText: 'TK',
  },
  youtube: {
    platform: 'youtube',
    displayName: 'YouTube',
    authType: 'oauth2',
    supportedContentTypes: ['script', 'video_concept'],
    supportsMedia: true,
    supportsScheduling: true,
    supportsThreads: false,
    color: '#ff0000',
    iconText: 'YT',
  },
  email: {
    platform: 'email',
    displayName: 'Email / Beehiiv',
    authType: 'api_key',
    supportedContentTypes: ['post', 'cta'],
    supportsMedia: false,
    supportsScheduling: true,
    supportsThreads: false,
    color: '#f59e0b',
    iconText: 'EM',
  },
  notion: {
    platform: 'notion',
    displayName: 'Notion',
    authType: 'oauth2',
    supportedContentTypes: ['post', 'script', 'video_concept'],
    supportsMedia: false,
    supportsScheduling: false,
    supportsThreads: false,
    color: '#000000',
    iconText: 'NO',
  },
  airtable: {
    platform: 'airtable',
    displayName: 'Airtable',
    authType: 'api_key',
    supportedContentTypes: ['post', 'caption', 'cta'],
    supportsMedia: false,
    supportsScheduling: false,
    supportsThreads: false,
    color: '#fcb400',
    iconText: 'AT',
  },
  webhook: {
    platform: 'webhook',
    displayName: 'Webhook',
    authType: 'webhook',
    supportedContentTypes: ['post', 'thread', 'script', 'caption', 'video_concept', 'cta'],
    supportsMedia: false,
    supportsScheduling: false,
    supportsThreads: false,
    color: '#6366f1',
    iconText: 'WH',
  },
}

// ---------------------------------------------------------------------------
// Publishing log (as returned by API)
// ---------------------------------------------------------------------------

export interface PublishingLog {
  id: string
  workspace_id: string
  connector_id: string
  asset_id: string | null
  platform: ConnectorPlatform
  status: PublishStatus
  external_post_id: string | null
  external_post_url: string | null
  payload: Record<string, unknown>
  response: Record<string, unknown>
  error_message: string | null
  published_at: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Connector stats
// ---------------------------------------------------------------------------

export interface ConnectorStats {
  total: number
  connected: number
  disconnected: number
  error: number
  pending: number
  published_today: number
  total_published: number
}
