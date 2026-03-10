/**
 * Webhook Adapter — Generic HMAC-signed webhook
 *
 * Sends a POST request to a configured URL with the asset payload.
 * Signs the request with HMAC-SHA256 using the webhook_secret.
 *
 * The receiving server can verify the signature using the X-MOE-Signature header.
 * Signature format: HMAC-SHA256 hex digest of the raw JSON body.
 */

import { BaseConnectorAdapter } from './base-adapter'
import type { ConnectorCredentials, PublishInput, PublishResult, ConnectionTestResult } from '../types'

export class WebhookAdapter extends BaseConnectorAdapter {
  readonly platform = 'webhook' as const

  constructor(credentials: ConnectorCredentials) {
    super(credentials)
  }

  private get webhookUrl(): string {
    return this.credentials.webhook_url ?? ''
  }

  private async signPayload(body: string): Promise<string> {
    const secret = this.credentials.webhook_secret
    if (!secret) return ''

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto') as typeof import('crypto')
    return crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex')
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const start = Date.now()

    const url = this.webhookUrl
    if (!url) {
      return this.failPublish('Webhook adapter: webhook_url not configured', Date.now() - start)
    }

    try {
      const payload = {
        event: 'moe.asset.publish',
        timestamp: new Date().toISOString(),
        platform: input.platform,
        contentType: input.contentType,
        content: input.content,
        title: input.title,
        hashtags: input.hashtags ?? [],
        mediaUrls: input.mediaUrls ?? [],
        metadata: input.metadata ?? {},
        assetId: input.assetId,
        connectorId: input.connectorId,
      }

      const body = JSON.stringify(payload)
      const signature = await this.signPayload(body)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'MOE-AI-Operator/1.0',
        'X-MOE-Event': 'asset.publish',
        'X-MOE-Timestamp': payload.timestamp,
      }

      if (signature) {
        headers['X-MOE-Signature'] = `sha256=${signature}`
      }

      const { response, durationMs } = await this.timedFetch(url, {
        method: 'POST',
        headers,
        body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body')
        return this.failPublish(`Webhook responded ${response.status}: ${errorText}`, durationMs)
      }

      let responseData: Record<string, unknown> = {}
      try {
        responseData = await response.json() as Record<string, unknown>
      } catch {
        // Non-JSON response is fine for webhooks
      }

      return this.successPublish({
        externalPostId: responseData.id as string | undefined,
        externalPostUrl: responseData.url as string | undefined,
        response: responseData,
        durationMs,
      })
    } catch (err) {
      return this.failPublish(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now()

    const url = this.webhookUrl
    if (!url) {
      return this.failTest('Webhook adapter: webhook_url not configured', Date.now() - start)
    }

    try {
      const testPayload = JSON.stringify({
        event: 'moe.webhook.test',
        timestamp: new Date().toISOString(),
        test: true,
      })

      const signature = await this.signPayload(testPayload)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'MOE-AI-Operator/1.0',
        'X-MOE-Event': 'webhook.test',
      }

      if (signature) {
        headers['X-MOE-Signature'] = `sha256=${signature}`
      }

      const { response, durationMs } = await this.timedFetch(url, {
        method: 'POST',
        headers,
        body: testPayload,
      })

      if (!response.ok) {
        return this.failTest(`Webhook test responded ${response.status}`, durationMs)
      }

      return this.successTest({
        accountHandle: new URL(url).hostname,
        latencyMs: durationMs,
      })
    } catch (err) {
      return this.failTest(err instanceof Error ? err.message : 'Network error — check webhook URL', Date.now() - start)
    }
  }

  async refreshToken(): Promise<ConnectorCredentials> {
    // Webhooks don't have tokens to refresh
    return this.credentials
  }
}
