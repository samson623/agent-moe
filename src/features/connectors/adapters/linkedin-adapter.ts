/**
 * LinkedIn Adapter — OAuth 2.0
 *
 * API: LinkedIn Marketing / UGC Posts API v2
 * Auth: OAuth 2.0 (standard, no PKCE)
 * Supports: posts (text + optional media), articles
 */

import { BaseConnectorAdapter } from './base-adapter'
import type { ConnectorCredentials, PublishInput, PublishResult, ConnectionTestResult } from '../types'

const LI_API_BASE = 'https://api.linkedin.com/v2'
const LI_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'

export class LinkedInAdapter extends BaseConnectorAdapter {
  readonly platform = 'linkedin' as const

  constructor(credentials: ConnectorCredentials) {
    super(credentials)
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const start = Date.now()

    try {
      // Determine author URN: person or organization
      const authorUrn = this.credentials.page_id
        ? `urn:li:organization:${this.credentials.page_id}`
        : `urn:li:person:${this.credentials.account_id}`

      const body = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: input.content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }

      const { response, durationMs } = await this.timedFetch(`${LI_API_BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          Authorization: this.bearerAuth(),
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return this.failPublish(`LinkedIn API ${response.status}: ${errorText}`, durationMs)
      }

      // LinkedIn returns the post URN in the X-RestLi-Id header
      const postUrn = response.headers.get('x-restli-id') ?? response.headers.get('X-RestLi-Id')
      const postId = postUrn?.split(':').pop()

      return this.successPublish({
        externalPostId: postUrn ?? undefined,
        externalPostUrl: postId
          ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn ?? '')}`
          : undefined,
        response: { urn: postUrn },
        durationMs,
      })
    } catch (err) {
      return this.failPublish(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now()

    try {
      const { response, durationMs } = await this.timedFetch(`${LI_API_BASE}/me`, {
        headers: {
          Authorization: this.bearerAuth(),
          'X-Restli-Protocol-Version': '2.0.0',
        },
      })

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failTest(`LinkedIn API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      const firstName = (json.localizedFirstName as string) ?? ''
      const lastName = (json.localizedLastName as string) ?? ''
      const displayName = `${firstName} ${lastName}`.trim()

      return this.successTest({
        accountId: json.id as string,
        accountHandle: displayName || undefined,
        latencyMs: durationMs,
      })
    } catch (err) {
      return this.failTest(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async refreshToken(): Promise<ConnectorCredentials> {
    if (!this.credentials.refresh_token) {
      throw new Error('LinkedIn adapter: no refresh_token available')
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn adapter: LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not configured')
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.credentials.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const response = await fetch(LI_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const json = await response.json() as Record<string, unknown>

    if (!response.ok) {
      throw new Error(`LinkedIn token refresh failed: ${JSON.stringify(json)}`)
    }

    const expiry = new Date(Date.now() + Number(json.expires_in ?? 5183999) * 1000).toISOString()

    return {
      ...this.credentials,
      access_token: json.access_token as string,
      refresh_token: (json.refresh_token as string) ?? this.credentials.refresh_token,
      token_expiry: expiry,
    }
  }
}
