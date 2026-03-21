/**
 * Connector Adapters — Barrel export + Factory
 */

export { BaseConnectorAdapter } from './base-adapter'
export { XAdapter, generatePKCE } from './x-adapter'
export { LinkedInAdapter } from './linkedin-adapter'
export { InstagramAdapter } from './instagram-adapter'
export { YouTubeAdapter } from './youtube-adapter'
export { EmailAdapter } from './email-adapter'
export { NotionAdapter } from './notion-adapter'
export { WebhookAdapter } from './webhook-adapter'

import { BaseConnectorAdapter } from './base-adapter'
import { XAdapter } from './x-adapter'
import { LinkedInAdapter } from './linkedin-adapter'
import { InstagramAdapter } from './instagram-adapter'
import { YouTubeAdapter } from './youtube-adapter'
import { EmailAdapter } from './email-adapter'
import { NotionAdapter } from './notion-adapter'
import { WebhookAdapter } from './webhook-adapter'
import type { ConnectorPlatform, ConnectorCredentials } from '../types'

/**
 * Factory function: create the right adapter for a given platform.
 * Throws for platforms that are not yet implemented (TikTok, Airtable).
 */
export function createAdapter(
  platform: ConnectorPlatform,
  credentials: ConnectorCredentials
): BaseConnectorAdapter {
  switch (platform) {
    case 'x':
      return new XAdapter(credentials)
    case 'linkedin':
      return new LinkedInAdapter(credentials)
    case 'instagram':
      return new InstagramAdapter(credentials)
    case 'youtube':
      return new YouTubeAdapter(credentials)
    case 'email':
      return new EmailAdapter(credentials)
    case 'notion':
      return new NotionAdapter(credentials)
    case 'webhook':
      return new WebhookAdapter(credentials)
    case 'tiktok':
      throw new Error('TikTok adapter is not yet implemented. Coming in a future phase.')
    case 'airtable':
      throw new Error('Airtable adapter is not yet implemented. Coming in a future phase.')
    case 'telegram':
      throw new Error('Telegram connector does not support publishing. Use the bot for messaging.')
    default: {
      const _exhaustive: never = platform
      throw new Error(`Unknown connector platform: ${String(_exhaustive)}`)
    }
  }
}
