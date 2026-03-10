/**
 * Notion Adapter — Notion API v1
 *
 * API: Notion API (notion.so)
 * Auth: OAuth 2.0 (internal integration token or OAuth app)
 * Supports: Creating pages in a configured Notion database
 *
 * Each published asset becomes a new page in the user's content database.
 * Page properties: Name (title), Content (rich_text), Status (select),
 *                  Platform (select), Content Type (select), Published Date (date)
 */

import { BaseConnectorAdapter } from './base-adapter'
import type { ConnectorCredentials, PublishInput, PublishResult, ConnectionTestResult } from '../types'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export class NotionAdapter extends BaseConnectorAdapter {
  readonly platform = 'notion' as const

  constructor(credentials: ConnectorCredentials) {
    super(credentials)
  }

  private notionHeaders(): Record<string, string> {
    return {
      Authorization: this.bearerAuth(),
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    }
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const start = Date.now()

    const databaseId = this.credentials.database_id
    if (!databaseId) {
      return this.failPublish('Notion adapter: database_id not configured in credentials', Date.now() - start)
    }

    try {
      const title = input.title ?? `${input.contentType} — ${new Date().toLocaleDateString()}`

      // Truncate content for rich_text (Notion limit: 2000 chars per block)
      const contentChunks = this.chunkText(input.content, 2000)

      const body = {
        parent: { database_id: databaseId },
        properties: {
          Name: {
            title: [{ text: { content: title } }],
          },
          Status: {
            select: { name: 'Draft' },
          },
          Platform: {
            select: { name: input.platform.toUpperCase() },
          },
          'Content Type': {
            select: { name: input.contentType },
          },
          'Published Date': {
            date: { start: new Date().toISOString() },
          },
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: title } }],
            },
          },
          ...contentChunks.map((chunk) => ({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: chunk } }],
            },
          })),
        ],
      }

      const { response, durationMs } = await this.timedFetch(`${NOTION_API_BASE}/pages`, {
        method: 'POST',
        headers: this.notionHeaders(),
        body: JSON.stringify(body),
      })

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failPublish(`Notion API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      const pageId = json.id as string
      const pageUrl = json.url as string

      return this.successPublish({
        externalPostId: pageId,
        externalPostUrl: pageUrl,
        response: { id: pageId, url: pageUrl },
        durationMs,
      })
    } catch (err) {
      return this.failPublish(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  private chunkText(text: string, maxLength: number): string[] {
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += maxLength) {
      chunks.push(text.slice(i, i + maxLength))
    }
    return chunks.length > 0 ? chunks : ['']
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now()

    try {
      const { response, durationMs } = await this.timedFetch(`${NOTION_API_BASE}/users/me`, {
        headers: this.notionHeaders(),
      })

      const json = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return this.failTest(`Notion API ${response.status}: ${JSON.stringify(json)}`, durationMs)
      }

      const name = json.name as string | undefined
      const botOwner = (json.bot as Record<string, unknown> | undefined)?.owner
      const ownerName = (botOwner as Record<string, unknown> | undefined)?.name as string | undefined

      return this.successTest({
        accountId: json.id as string,
        accountHandle: name ?? ownerName ?? 'Notion integration',
        latencyMs: durationMs,
      })
    } catch (err) {
      return this.failTest(err instanceof Error ? err.message : 'Unknown error', Date.now() - start)
    }
  }

  async refreshToken(): Promise<ConnectorCredentials> {
    // Notion OAuth tokens do not expire (internal integration tokens are permanent)
    // OAuth app tokens: Notion does not support refresh tokens currently
    return this.credentials
  }
}
