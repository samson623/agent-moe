/**
 * BaseConnectorAdapter — Abstract base class for all platform adapters.
 *
 * Each platform adapter extends this class and implements:
 * - publish()        — send content to the platform
 * - testConnection() — verify credentials are valid
 * - refreshToken()   — exchange refresh token for new access token
 */

import type { ConnectorPlatform, ConnectorCredentials, PublishInput, PublishResult, ConnectionTestResult } from '../types'

export abstract class BaseConnectorAdapter {
  abstract readonly platform: ConnectorPlatform

  constructor(protected credentials: ConnectorCredentials) {}

  /**
   * Publish an asset to the platform.
   * Never throws — errors are captured in the result object.
   */
  abstract publish(input: PublishInput): Promise<PublishResult>

  /**
   * Test if the connection is valid (lightweight authenticated API call).
   * Never throws — errors captured in result.
   */
  abstract testConnection(): Promise<ConnectionTestResult>

  /**
   * Refresh the access token using the stored refresh token.
   * Returns updated credentials to be stored back to DB.
   * Throws if refresh fails — caller decides how to handle.
   */
  abstract refreshToken(): Promise<ConnectorCredentials>

  /** Check if the current access token is expired based on token_expiry. */
  isTokenExpired(): boolean {
    if (!this.credentials.token_expiry) return false
    return new Date(this.credentials.token_expiry) <= new Date()
  }

  /** Generate a Bearer Authorization header value. */
  protected bearerAuth(): string {
    return `Bearer ${this.credentials.access_token}`
  }

  /**
   * Execute a fetch call and measure duration.
   * Use this for all platform API calls to capture latency.
   */
  protected async timedFetch(
    url: string,
    options: RequestInit
  ): Promise<{ response: Response; durationMs: number }> {
    const start = Date.now()
    const response = await fetch(url, options)
    return { response, durationMs: Date.now() - start }
  }

  /** Build a failed PublishResult. */
  protected failPublish(error: string, durationMs: number): PublishResult {
    return {
      success: false,
      platform: this.platform,
      error,
      durationMs,
    }
  }

  /** Build a successful PublishResult. */
  protected successPublish(opts: {
    externalPostId?: string
    externalPostUrl?: string
    response?: Record<string, unknown>
    durationMs: number
  }): PublishResult {
    return {
      success: true,
      platform: this.platform,
      publishedAt: new Date().toISOString(),
      externalPostId: opts.externalPostId,
      externalPostUrl: opts.externalPostUrl,
      response: opts.response,
      durationMs: opts.durationMs,
    }
  }

  /** Build a failed ConnectionTestResult. */
  protected failTest(error: string, latencyMs: number): ConnectionTestResult {
    return {
      success: false,
      platform: this.platform,
      error,
      latencyMs,
    }
  }

  /** Build a successful ConnectionTestResult. */
  protected successTest(opts: {
    accountHandle?: string
    accountId?: string
    scopes?: string[]
    latencyMs: number
  }): ConnectionTestResult {
    return {
      success: true,
      platform: this.platform,
      ...opts,
    }
  }
}
