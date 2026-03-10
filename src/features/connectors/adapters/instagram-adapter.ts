/**
 * Instagram Adapter — Meta Graph API
 *
 * API: Meta Graph API v20.0
 * Auth: OAuth 2.0 via Facebook Login
 * Supports: image posts, captions (requires media URL)
 *
 * Publishing is a 2-step process:
 * 1. Create a media container (POST /{page_id}/media)
 * 2. Publish the container  (POST /{page_id}/media_publish)
 */

import { BaseConnectorAdapter } from './base-adapter'
import type { ConnectorCredentials, PublishInput, PublishResult, ConnectionTestResult } from '../types'

const META_GRAPH_BASE = 'https://graph.facebook.com/v20.0'

export class InstagramAdapter extends BaseConnectorAdapter {
  readonly platform = 'instagram' as const

  constructor(credentials: ConnectorCredentials) {
    super(credentials)
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const start = Date.now()

    const pageId = this.credentials.page_id
    if (!pageId) {
      return this.failPublish('Instagram adapter: page_id (Instagram Business Account ID) is required', Date.now() - start)
    }

    const mediaUrl = input.mediaUrls?.[0]
    if (!mediaUrl) {
      return this.failPublish('Instagram adapter: at least one mediaUrl is required to publish', Date.now() - start)
    }

    try {
      // Step 1: Create media container
      const containerParams = new URLSearchParams({
        image_url: mediaUrl,
        caption: input.content,
        access_token: this.credentials.access_token ?? '',
      })

      const { response: containerResponse, durationMs: containerDuration } = await this.timedFetch(
        `${META_GRAPH_BASE}/${pageId}/media?${containerParams}`,
        { method: 'POST' }
      )

      const containerJson = await containerResponse.json() as Record<string, unknown>

      if (!containerResponse.ok || !containerJson.id) {
        return this.failPublish(
          `Instagram container creation failed: ${JSON.stringify(containerJson)}`,
          containerDuration
        )
      }

      const containerId = containerJson.id as string

      // Step 2: Publish the container
      const publishParams = new URLSearchParams({
        creation_id: containerId,
        access_token: this.credentials.access_token ?? '',
      })

      const { response: publishResponse } = await this.timedFetch(
        `${META_GRAPH_BASE}/${pageId}/media_publish?${publishParams}`,
        { method: 'POST' }
      )

      const publishJson = await publishResponse.json() as Record<string, unknown>
      const totalDuration = Date.now() - start

      if (!publishResponse.ok || !publishJson.id) {
        return this.failPublish(
          `Instagram publish failed: ${JSON.stringify(publishJson)}`,
          totalDuration
        )
      }

      const mediaId = publishJson.id as string

      return this.successPublish({
        externalPostId: mediaId,
        externalPostUrl: `https://www.instagram.com/p/${mediaId}/`,
        response: publishJson,
        durationMs: totalDuration,
      })
    } catch (err) {
      return this.failPublish(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now()

    try {
      const params = new URLSearchParams({
        fields: 'id,name,username',
        access_token: this.credentials.access_token ?? '',
      })

      const { response, durationMs } = await this.timedFetch(
        `${META_GRAPH_BASE}/me?${params}`,
        {}
      )

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failTest(`Meta API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      return this.successTest({
        accountId: json.id as string,
        accountHandle: (json.username as string) ?? (json.name as string) ?? undefined,
        latencyMs: durationMs,
      })
    } catch (err) {
      return this.failTest(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async refreshToken(): Promise<ConnectorCredentials> {
    // Meta long-lived tokens (60 days) can be refreshed via the token endpoint
    if (!this.credentials.access_token) {
      throw new Error('Instagram adapter: no access_token available')
    }

    const clientId = process.env.META_CLIENT_ID
    const clientSecret = process.env.META_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Instagram adapter: META_CLIENT_ID or META_CLIENT_SECRET not configured')
    }

    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: this.credentials.access_token,
    })

    const response = await fetch(`${META_GRAPH_BASE}/oauth/access_token?${params}`)
    const json = await response.json() as Record<string, unknown>

    if (!response.ok) {
      throw new Error(`Instagram token refresh failed: ${JSON.stringify(json)}`)
    }

    const expiry = new Date(Date.now() + Number(json.expires_in ?? 5184000) * 1000).toISOString()

    return {
      ...this.credentials,
      access_token: json.access_token as string,
      token_expiry: expiry,
    }
  }
}
