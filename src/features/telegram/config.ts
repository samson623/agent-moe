/**
 * Telegram Integration — Configuration
 *
 * Reads env vars and exports typed config.
 * Throws at import time if critical vars are missing (fail-fast).
 */

// ---------------------------------------------------------------------------
// Env var readers
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[Telegram] Missing required env var: ${name}`)
  }
  return value
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

// ---------------------------------------------------------------------------
// Config object — lazy-initialized to avoid throwing at module load in
// contexts where Telegram isn't needed (e.g., non-Telegram API routes).
// ---------------------------------------------------------------------------

export interface TelegramConfig {
  /** Bot token from BotFather */
  botToken: string
  /** Secret for verifying incoming webhook requests */
  webhookSecret: string
  /** Secret for HMAC account-linking deeplinks */
  linkSecret: string
  /** Public base URL of this app (for deep links in messages) */
  appUrl: string
}

let _config: TelegramConfig | null = null

/**
 * Returns the Telegram config. Throws if required env vars are missing.
 * Safe to call multiple times — memoized.
 */
export function getTelegramConfig(): TelegramConfig {
  if (!_config) {
    _config = {
      botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
      webhookSecret: requireEnv('TELEGRAM_WEBHOOK_SECRET'),
      linkSecret: requireEnv('TELEGRAM_LINK_SECRET'),
      appUrl: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    }
  }
  return _config
}

/**
 * Check if Telegram env vars are configured (non-throwing).
 * Useful for conditional feature gating.
 */
export function isTelegramConfigured(): boolean {
  return !!(
    process.env['TELEGRAM_BOT_TOKEN'] &&
    process.env['TELEGRAM_WEBHOOK_SECRET'] &&
    process.env['TELEGRAM_LINK_SECRET']
  )
}
