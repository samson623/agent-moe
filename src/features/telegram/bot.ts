/**
 * Telegram Bot Singleton — Grammy instance.
 *
 * Lazy-initialized from config. Used by:
 * - Webhook route (to send replies)
 * - Notifier (to send outbound messages)
 *
 * We do NOT use Grammy's built-in webhook adapter — we handle the
 * HTTP webhook ourselves in the Next.js API route for full control.
 */

import { Bot } from 'grammy'
import { getTelegramConfig } from './config'

let _bot: Bot | null = null

/**
 * Returns the Grammy Bot singleton.
 * Throws if TELEGRAM_BOT_TOKEN is not set.
 */
export function getBot(): Bot {
  if (!_bot) {
    const { botToken } = getTelegramConfig()
    _bot = new Bot(botToken)
  }
  return _bot
}
