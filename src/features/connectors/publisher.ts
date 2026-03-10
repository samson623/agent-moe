/**
 * ConnectorPublisher — Orchestrates publishing assets to connected platforms.
 *
 * Handles:
 * - Loading connector credentials from DB
 * - Token expiry detection and refresh
 * - Adapter selection and execution
 * - Publishing log creation
 * - Connector status updates on errors
 */

import type { ConnectorPlatform, ConnectorCredentials, PublishInput, PublishResult } from './types'
import { createAdapter } from './adapters'
import {
  getConnector,
  getConnectedConnectors,
  updateConnector,
  updateConnectorCredentials,
  updateConnectorStatus,
  createPublishingLog,
} from '@/lib/supabase/queries/connectors'

export class ConnectorPublisher {
  /**
   * Publish a piece of content to a specific connector.
   * Handles token refresh, logging, and status updates.
   */
  async publishAsset(opts: {
    workspaceId: string
    connectorId: string
    assetId?: string
    content: string
    contentType: PublishInput['contentType']
    platform: ConnectorPlatform
    title?: string
    mediaUrls?: string[]
    hashtags?: string[]
    scheduledAt?: string
    metadata?: Record<string, unknown>
  }): Promise<PublishResult> {
    const connector = await getConnector(opts.connectorId)

    if (!connector) {
      throw new Error(`Connector not found: ${opts.connectorId}`)
    }

    if (connector.status !== 'connected') {
      throw new Error(`Connector ${opts.connectorId} is not connected (status: ${connector.status})`)
    }

    let credentials = connector.credentials as ConnectorCredentials

    // Create the platform adapter
    let adapter = createAdapter(opts.platform, credentials)

    // Refresh token if expired
    if (adapter.isTokenExpired()) {
      try {
        const freshCredentials = await adapter.refreshToken()
        await updateConnectorCredentials(opts.connectorId, freshCredentials as Record<string, unknown>)
        credentials = freshCredentials
        adapter = createAdapter(opts.platform, credentials)
      } catch (refreshErr) {
        await updateConnectorStatus(
          opts.connectorId,
          'error',
          `Token refresh failed: ${refreshErr instanceof Error ? refreshErr.message : 'Unknown'}`
        )
        throw new Error(`Token refresh failed for connector ${opts.connectorId}: ${refreshErr instanceof Error ? refreshErr.message : 'Unknown'}`)
      }
    }

    const publishInput: PublishInput = {
      connectorId: opts.connectorId,
      assetId: opts.assetId,
      content: opts.content,
      contentType: opts.contentType,
      platform: opts.platform,
      title: opts.title,
      mediaUrls: opts.mediaUrls,
      hashtags: opts.hashtags,
      scheduledAt: opts.scheduledAt,
      metadata: opts.metadata,
    }

    // Execute the publish
    const result = await adapter.publish(publishInput)

    // Log the attempt (success or failure)
    await createPublishingLog({
      workspace_id: opts.workspaceId,
      connector_id: opts.connectorId,
      asset_id: opts.assetId,
      platform: opts.platform,
      status: result.success ? 'success' : 'failed',
      external_post_id: result.externalPostId,
      external_post_url: result.externalPostUrl,
      payload: {
        contentType: opts.contentType,
        contentLength: opts.content.length,
        hasMedia: Boolean(opts.mediaUrls?.length),
        hasHashtags: Boolean(opts.hashtags?.length),
      },
      response: result.response ?? {},
      error_message: result.error,
      published_at: result.publishedAt,
    })

    // Update last_sync_at on success, or mark error on repeated failures
    if (result.success) {
      await updateConnector(opts.connectorId, {
        last_sync_at: new Date().toISOString(),
      })
    } else {
      // Check if this looks like an auth error
      const isAuthError = result.error?.includes('401') || result.error?.includes('403') || result.error?.includes('Unauthorized')
      if (isAuthError) {
        await updateConnectorStatus(opts.connectorId, 'error', result.error)
      }
    }

    return result
  }

  /**
   * Publish approved content to ALL connected connectors that match the target platform.
   * Returns an array of results (one per connector).
   */
  async publishToAll(opts: {
    workspaceId: string
    assetId: string
    content: string
    contentType: PublishInput['contentType']
    platform: ConnectorPlatform
    title?: string
    hashtags?: string[]
    mediaUrls?: string[]
  }): Promise<PublishResult[]> {
    const connectors = await getConnectedConnectors(opts.workspaceId)
    const targets = connectors.filter((c) => c.platform === opts.platform)

    if (targets.length === 0) {
      return []
    }

    const results = await Promise.allSettled(
      targets.map((connector) =>
        this.publishAsset({
          workspaceId: opts.workspaceId,
          connectorId: connector.id,
          assetId: opts.assetId,
          content: opts.content,
          contentType: opts.contentType,
          platform: opts.platform,
          title: opts.title,
          hashtags: opts.hashtags,
          mediaUrls: opts.mediaUrls,
        })
      )
    )

    return results.map((r) => {
      if (r.status === 'fulfilled') return r.value
      return {
        success: false,
        platform: opts.platform,
        error: r.reason instanceof Error ? r.reason.message : 'Unknown error',
        durationMs: 0,
      }
    })
  }
}
