/**
 * Telegram Integration — Barrel Export
 */

// Config
export { getTelegramConfig, isTelegramConfigured } from './config'

// Bot
export { getBot } from './bot'

// Notifier — the main integration point for the rest of the app
export { notifyMissionStage } from './notifier'

// Types
export type {
  TelegramLink,
  TelegramSession,
  TelegramHandlerContext,
  MissionNotificationStage,
} from './types'
