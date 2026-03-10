/**
 * OAuthManager — Manages OAuth 2.0 flows for all connector platforms.
 *
 * Supports:
 * - X (Twitter): OAuth 2.0 with PKCE
 * - LinkedIn: OAuth 2.0
 * - Instagram (Meta): OAuth 2.0 via Facebook Login
 * - YouTube (Google): OAuth 2.0 with offline access
 * - Notion: OAuth 2.0
 *
 * State format: base64("platform:workspaceId:nonce")
 * PKCE verifiers are stored in-memory (keyed by state) — suitable for
 * a single-user private system. Does not survive server restarts.
 */

import type { ConnectorPlatform, OAuthStartResult, OAuthCallbackResult } from './types'
import { generatePKCE } from './adapters/x-adapter'

// In-memory PKCE verifier store (single-user system)
const pkceStore = new Map<string, string>()

export class OAuthManager {
  private getRedirectUri(platform: ConnectorPlatform): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    return `${appUrl}/api/auth/callback/${platform}`
  }

  private encodeState(platform: ConnectorPlatform, workspaceId: string): string {
    const nonce = crypto.randomUUID()
    const raw = `${platform}:${workspaceId}:${nonce}`
    return Buffer.from(raw).toString('base64url')
  }

  /** Parse state back to { platform, workspaceId } */
  static parseState(state: string): { platform: ConnectorPlatform; workspaceId: string } | null {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf-8')
      const parts = decoded.split(':')
      if (parts.length < 3) return null
      return {
        platform: parts[0] as ConnectorPlatform,
        workspaceId: parts[1] ?? '',
      }
    } catch {
      return null
    }
  }

  /** Generate the OAuth authorization URL and state for a given platform. */
  initiateOAuth(platform: ConnectorPlatform, workspaceId: string): OAuthStartResult {
    const state = this.encodeState(platform, workspaceId)
    const redirectUri = this.getRedirectUri(platform)

    switch (platform) {
      case 'x': {
        const clientId = process.env.X_CLIENT_ID ?? ''
        const { codeVerifier, codeChallenge } = generatePKCE()
        pkceStore.set(state, codeVerifier)

        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: 'tweet.read tweet.write users.read offline.access',
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        })

        return {
          authUrl: `https://twitter.com/i/oauth2/authorize?${params}`,
          state,
          codeVerifier,
        }
      }

      case 'linkedin': {
        const clientId = process.env.LINKEDIN_CLIENT_ID ?? ''

        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: 'r_liteprofile r_emailaddress w_member_social',
          state,
        })

        return {
          authUrl: `https://www.linkedin.com/oauth/v2/authorization?${params}`,
          state,
        }
      }

      case 'instagram': {
        const clientId = process.env.META_CLIENT_ID ?? ''

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: 'instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list',
          response_type: 'code',
          state,
        })

        return {
          authUrl: `https://www.facebook.com/v20.0/dialog/oauth?${params}`,
          state,
        }
      }

      case 'youtube': {
        const clientId = process.env.GOOGLE_CLIENT_ID ?? ''

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload',
          access_type: 'offline',
          prompt: 'consent',
          state,
        })

        return {
          authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
          state,
        }
      }

      case 'notion': {
        const clientId = process.env.NOTION_CLIENT_ID ?? ''

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          owner: 'user',
          state,
        })

        return {
          authUrl: `https://api.notion.com/v1/oauth/authorize?${params}`,
          state,
        }
      }

      default:
        throw new Error(`OAuth not supported for platform: ${platform}`)
    }
  }

  /** Exchange an authorization code for access + refresh tokens. */
  async exchangeCode(
    platform: ConnectorPlatform,
    code: string,
    codeVerifier?: string
  ): Promise<OAuthCallbackResult> {
    const redirectUri = this.getRedirectUri(platform)

    try {
      switch (platform) {
        case 'x':
          return await this.exchangeX(code, codeVerifier ?? '', redirectUri)
        case 'linkedin':
          return await this.exchangeLinkedIn(code, redirectUri)
        case 'instagram':
          return await this.exchangeMeta(code, redirectUri)
        case 'youtube':
          return await this.exchangeGoogle(code, redirectUri)
        case 'notion':
          return await this.exchangeNotion(code, redirectUri)
        default:
          return { success: false, credentials: {}, error: `OAuth exchange not supported for: ${platform}` }
      }
    } catch (err) {
      return {
        success: false,
        credentials: {},
        error: err instanceof Error ? err.message : 'Token exchange failed',
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Per-platform token exchange implementations
  // ---------------------------------------------------------------------------

  private async exchangeX(code: string, codeVerifier: string, redirectUri: string): Promise<OAuthCallbackResult> {
    const clientId = process.env.X_CLIENT_ID ?? ''
    const clientSecret = process.env.X_CLIENT_SECRET ?? ''
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: clientId,
    })

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const json = await response.json() as Record<string, unknown>
    if (!response.ok) throw new Error(`X token exchange failed: ${JSON.stringify(json)}`)

    const expiry = new Date(Date.now() + Number(json.expires_in ?? 7200) * 1000).toISOString()

    return {
      success: true,
      credentials: {
        access_token: json.access_token as string,
        refresh_token: json.refresh_token as string,
        token_expiry: expiry,
        token_type: json.token_type as string,
        scopes: (json.scope as string)?.split(' '),
      },
    }
  }

  private async exchangeLinkedIn(code: string, redirectUri: string): Promise<OAuthCallbackResult> {
    const clientId = process.env.LINKEDIN_CLIENT_ID ?? ''
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? ''

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const json = await response.json() as Record<string, unknown>
    if (!response.ok) throw new Error(`LinkedIn token exchange failed: ${JSON.stringify(json)}`)

    const expiry = new Date(Date.now() + Number(json.expires_in ?? 5183999) * 1000).toISOString()

    return {
      success: true,
      credentials: {
        access_token: json.access_token as string,
        refresh_token: json.refresh_token as string | undefined,
        token_expiry: expiry,
        scopes: (json.scope as string)?.split(','),
      },
    }
  }

  private async exchangeMeta(code: string, redirectUri: string): Promise<OAuthCallbackResult> {
    const clientId = process.env.META_CLIENT_ID ?? ''
    const clientSecret = process.env.META_CLIENT_SECRET ?? ''

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    })

    const response = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${params}`)
    const json = await response.json() as Record<string, unknown>
    if (!response.ok) throw new Error(`Meta token exchange failed: ${JSON.stringify(json)}`)

    // Exchange short-lived for long-lived token
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: json.access_token as string,
    })

    const longResponse = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${longLivedParams}`)
    const longJson = await longResponse.json() as Record<string, unknown>

    const accessToken = longResponse.ok ? (longJson.access_token as string) : (json.access_token as string)
    const expiresIn = longResponse.ok ? Number(longJson.expires_in ?? 5184000) : Number(json.expires_in ?? 3600)
    const expiry = new Date(Date.now() + expiresIn * 1000).toISOString()

    return {
      success: true,
      credentials: {
        access_token: accessToken,
        token_expiry: expiry,
      },
    }
  }

  private async exchangeGoogle(code: string, redirectUri: string): Promise<OAuthCallbackResult> {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? ''
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ''

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const json = await response.json() as Record<string, unknown>
    if (!response.ok) throw new Error(`Google token exchange failed: ${JSON.stringify(json)}`)

    const expiry = new Date(Date.now() + Number(json.expires_in ?? 3600) * 1000).toISOString()

    return {
      success: true,
      credentials: {
        access_token: json.access_token as string,
        refresh_token: json.refresh_token as string | undefined,
        token_expiry: expiry,
        token_type: json.token_type as string,
        scopes: (json.scope as string)?.split(' '),
      },
    }
  }

  private async exchangeNotion(code: string, redirectUri: string): Promise<OAuthCallbackResult> {
    const clientId = process.env.NOTION_CLIENT_ID ?? ''
    const clientSecret = process.env.NOTION_CLIENT_SECRET ?? ''
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    const json = await response.json() as Record<string, unknown>
    if (!response.ok) throw new Error(`Notion token exchange failed: ${JSON.stringify(json)}`)

    // Notion tokens don't expire — no token_expiry
    const owner = json.owner as Record<string, unknown> | undefined
    const workspace = json.workspace_name as string | undefined

    return {
      success: true,
      credentials: {
        access_token: json.access_token as string,
        account_id: owner?.id as string | undefined,
        account_handle: workspace ?? 'Notion workspace',
        database_id: json.duplicated_template_id as string | undefined,
      },
    }
  }

  /** Retrieve and clear the stored PKCE verifier for a given state. */
  static consumePkceVerifier(state: string): string | undefined {
    const verifier = pkceStore.get(state)
    pkceStore.delete(state)
    return verifier
  }
}
