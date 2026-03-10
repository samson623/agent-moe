/**
 * Email Adapter — Resend API
 *
 * API: Resend (resend.com)
 * Auth: API Key (no OAuth)
 * Supports: Sending email content as HTML/text messages
 */

import { BaseConnectorAdapter } from './base-adapter'
import type { ConnectorCredentials, PublishInput, PublishResult, ConnectionTestResult } from '../types'

const RESEND_API_BASE = 'https://api.resend.com'

export class EmailAdapter extends BaseConnectorAdapter {
  readonly platform = 'email' as const

  constructor(credentials: ConnectorCredentials) {
    super(credentials)
  }

  private get apiKey(): string {
    return (this.credentials.api_key ?? process.env.RESEND_API_KEY) ?? ''
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const start = Date.now()

    const apiKey = this.apiKey
    if (!apiKey) {
      return this.failPublish('Email adapter: RESEND_API_KEY not configured', Date.now() - start)
    }

    const to = this.credentials.list_id ?? this.credentials.account_id
    const from = this.credentials.account_handle ?? process.env.EMAIL_FROM ?? 'noreply@example.com'

    if (!to) {
      return this.failPublish('Email adapter: no recipient (list_id or account_id) configured', Date.now() - start)
    }

    try {
      const subject = input.title ?? `New Content — ${new Date().toLocaleDateString()}`

      // Convert plain text to basic HTML
      const html = `<!DOCTYPE html><html><body>${input.content.replace(/\n/g, '<br/>')}</body></html>`

      const body = {
        from,
        to: [to],
        subject,
        html,
        text: input.content,
      }

      const { response, durationMs } = await this.timedFetch(`${RESEND_API_BASE}/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failPublish(`Resend API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      return this.successPublish({
        externalPostId: json.id as string,
        response: json,
        durationMs,
      })
    } catch (err) {
      return this.failPublish(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now()

    const apiKey = this.apiKey
    if (!apiKey) {
      return this.failTest('Email adapter: RESEND_API_KEY not configured', Date.now() - start)
    }

    try {
      const { response, durationMs } = await this.timedFetch(`${RESEND_API_BASE}/domains`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failTest(`Resend API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      const domains = json.data as Array<{ name: string }> | undefined
      const firstDomain = domains?.[0]?.name

      return this.successTest({
        accountHandle: firstDomain ?? 'API key valid',
        latencyMs: durationMs,
      })
    } catch (err) {
      return this.failTest(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async refreshToken(): Promise<ConnectorCredentials> {
    // API key auth — no token refresh needed
    return this.credentials
  }
}
