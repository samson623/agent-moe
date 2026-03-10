/**
 * X (Twitter) Adapter — OAuth 2.0 PKCE
 *
 * API: Twitter API v2
 * Auth: OAuth 2.0 with PKCE
 * Supports: single tweets, threads (sequential with reply chaining)
 */

import { BaseConnectorAdapter } from './base-adapter'
import type { ConnectorCredentials, PublishInput, PublishResult, ConnectionTestResult } from '../types'

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function base64URLEncode(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const verifierBytes = new Uint8Array(32)
  crypto.getRandomValues(verifierBytes)
  const codeVerifier = base64URLEncode(verifierBytes)

  // SHA-256 hash for code challenge
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)

  // Note: We compute this synchronously using Buffer in Node.js
  // In the browser this would need to be async (crypto.subtle.digest)
  // Since this runs server-side (Next.js route handler), we use Node's crypto
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto_node = require('crypto') as typeof import('crypto')
  const hash = crypto_node.createHash('sha256').update(data).digest()
  const codeChallenge = base64URLEncode(new Uint8Array(hash))

  return { codeVerifier, codeChallenge }
}

// ---------------------------------------------------------------------------
// X Adapter
// ---------------------------------------------------------------------------

const X_API_BASE = 'https://api.twitter.com/2'
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'

export class XAdapter extends BaseConnectorAdapter {
  readonly platform = 'x' as const

  constructor(credentials: ConnectorCredentials) {
    super(credentials)
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const start = Date.now()

    try {
      if (input.contentType === 'thread') {
        return await this.publishThread(input)
      }
      return await this.publishTweet(input.content, undefined)
    } catch (err) {
      return this.failPublish(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  private async publishTweet(
    text: string,
    replyToId: string | undefined
  ): Promise<PublishResult> {
    const body: Record<string, unknown> = { text }
    if (replyToId) {
      body.reply = { in_reply_to_tweet_id: replyToId }
    }

    const { response, durationMs } = await this.timedFetch(`${X_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        Authorization: this.bearerAuth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const json = await response.json() as Record<string, unknown>

    if (!response.ok) {
      return this.failPublish(
        `Twitter API ${response.status}: ${JSON.stringify(json)}`,
        durationMs
      )
    }

    const tweetData = json.data as { id: string; text: string } | undefined
    const tweetId = tweetData?.id

    return this.successPublish({
      externalPostId: tweetId,
      externalPostUrl: tweetId
        ? `https://twitter.com/i/web/status/${tweetId}`
        : undefined,
      response: json,
      durationMs,
    })
  }

  private async publishThread(input: PublishInput): Promise<PublishResult> {
    const threadStart = Date.now()
    // Split content by double newlines or treat as single tweet
    const parts = input.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (parts.length === 0) {
      return this.failPublish('Thread content is empty', Date.now() - threadStart)
    }

    let lastTweetId: string | undefined
    let firstResult: PublishResult | null = null

    for (const part of parts) {
      const result = await this.publishTweet(part, lastTweetId)

      if (!result.success) {
        return result
      }

      if (!firstResult) firstResult = result
      lastTweetId = result.externalPostId
    }

    return {
      ...(firstResult ?? this.failPublish('No tweets published', Date.now() - threadStart)),
      durationMs: Date.now() - threadStart,
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now()

    try {
      const { response, durationMs } = await this.timedFetch(`${X_API_BASE}/users/me`, {
        headers: { Authorization: this.bearerAuth() },
      })

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failTest(`Twitter API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      const user = json.data as { id: string; username: string } | undefined

      return this.successTest({
        accountId: user?.id,
        accountHandle: user?.username ? `@${user.username}` : undefined,
        latencyMs: durationMs,
      })
    } catch (err) {
      return this.failTest(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async refreshToken(): Promise<ConnectorCredentials> {
    if (!this.credentials.refresh_token) {
      throw new Error('X adapter: no refresh_token available')
    }

    const clientId = process.env.X_CLIENT_ID
    const clientSecret = process.env.X_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('X adapter: X_CLIENT_ID or X_CLIENT_SECRET not configured')
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.credentials.refresh_token,
      client_id: clientId,
    })

    const response = await fetch(X_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const json = await response.json() as Record<string, unknown>

    if (!response.ok) {
      throw new Error(`X token refresh failed: ${JSON.stringify(json)}`)
    }

    const expiry = new Date(Date.now() + Number(json.expires_in ?? 7200) * 1000).toISOString()

    return {
      ...this.credentials,
      access_token: json.access_token as string,
      refresh_token: (json.refresh_token as string) ?? this.credentials.refresh_token,
      token_expiry: expiry,
      token_type: json.token_type as string,
    }
  }
}
