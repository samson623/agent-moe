/**
 * YouTube Adapter — Google OAuth 2.0
 *
 * API: YouTube Data API v3
 * Auth: Google OAuth 2.0
 *
 * For video_concept content type: creates a private draft video in YouTube
 * with the title + description filled in from the generated content.
 * This serves as a storyboard / brief stored directly in YouTube Studio.
 *
 * Note: We do NOT upload video files. We create video metadata placeholders
 * (private drafts) that the user can later attach video files to manually.
 */

import { BaseConnectorAdapter } from './base-adapter'
import type { ConnectorCredentials, PublishInput, PublishResult, ConnectionTestResult } from '../types'

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export class YouTubeAdapter extends BaseConnectorAdapter {
  readonly platform = 'youtube' as const

  constructor(credentials: ConnectorCredentials) {
    super(credentials)
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const start = Date.now()

    try {
      const title = input.title ?? `Video Brief — ${new Date().toLocaleDateString()}`
      const description = input.content

      const body = {
        snippet: {
          title,
          description,
          tags: input.hashtags ?? [],
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'private', // Always private draft
          selfDeclaredMadeForKids: false,
        },
      }

      const { response, durationMs } = await this.timedFetch(
        `${YT_API_BASE}/videos?part=snippet,status`,
        {
          method: 'POST',
          headers: {
            Authorization: this.bearerAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failPublish(`YouTube API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      const videoId = json.id as string

      return this.successPublish({
        externalPostId: videoId,
        externalPostUrl: `https://studio.youtube.com/video/${videoId}/edit`,
        response: json,
        durationMs,
      })
    } catch (err) {
      return this.failPublish(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now()

    try {
      const { response, durationMs } = await this.timedFetch(
        `${YT_API_BASE}/channels?part=id,snippet&mine=true`,
        {
          headers: { Authorization: this.bearerAuth() },
        }
      )

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failTest(`YouTube API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      const items = json.items as Array<{ id: string; snippet: { title: string } }> | undefined
      const channel = items?.[0]

      return this.successTest({
        accountId: channel?.id,
        accountHandle: channel?.snippet?.title,
        latencyMs: durationMs,
      })
    } catch (err) {
      return this.failTest(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async refreshToken(): Promise<ConnectorCredentials> {
    if (!this.credentials.refresh_token) {
      throw new Error('YouTube adapter: no refresh_token available')
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('YouTube adapter: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured')
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.credentials.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const json = await response.json() as Record<string, unknown>

    if (!response.ok) {
      throw new Error(`Google token refresh failed: ${JSON.stringify(json)}`)
    }

    const expiry = new Date(Date.now() + Number(json.expires_in ?? 3600) * 1000).toISOString()

    return {
      ...this.credentials,
      access_token: json.access_token as string,
      token_expiry: expiry,
      token_type: json.token_type as string,
    }
  }
}
