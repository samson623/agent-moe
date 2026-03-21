/**
 * Telegram Integration — Type Definitions
 *
 * Types for the Telegram bot: account linking, sessions, handler context,
 * and command routing.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export interface TelegramLink {
  id: string
  user_id: string
  workspace_id: string
  chat_id: number
  username: string | null
  is_active: boolean
  linked_at: string
  updated_at: string
}

export interface TelegramLinkInsert {
  user_id: string
  workspace_id: string
  chat_id: number
  username?: string | null
  is_active?: boolean
}

export interface TelegramSession {
  chat_id: number
  user_id: string
  workspace_id: string
  state: TelegramSessionState
  updated_at: string
}

// ---------------------------------------------------------------------------
// Session state — extensible JSONB payload
// ---------------------------------------------------------------------------

export interface TelegramSessionState {
  /** Current conversational flow, if any */
  flow?: 'awaiting_revision_notes' | 'awaiting_mission_confirm' | null
  /** Approval ID being revised */
  pending_approval_id?: string | null
  /** Forwarded message summary waiting for confirmation */
  pending_summary?: string | null
  /** Extra context */
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Handler context — passed to every command handler
// ---------------------------------------------------------------------------

export interface TelegramHandlerContext {
  /** Authenticated Supabase admin client (bypasses RLS) */
  db: SupabaseClient<Database>
  /** The linked account — null only for /start (linking flow) */
  link: TelegramLink | null
  /** Telegram chat ID from the incoming message */
  chatId: number
  /** Raw message text (empty string for callbacks) */
  text: string
  /** Extracted argument text after the command (e.g., instruction after /mission) */
  args: string
  /** Telegram username, if available */
  username: string | null
}

// ---------------------------------------------------------------------------
// Command routing
// ---------------------------------------------------------------------------

/** Known slash commands the bot responds to */
export type TelegramCommand =
  | '/start'
  | '/mission'
  | '/status'
  | '/approve'
  | '/revise'
  | '/help'

/** Result of the deterministic router */
export interface RouteResult {
  command: TelegramCommand | 'callback' | 'forwarded' | 'freeform'
  /** Extracted argument text (e.g., mission instruction after /mission) */
  args: string
}

// ---------------------------------------------------------------------------
// Notification types (used by notifier.ts later)
// ---------------------------------------------------------------------------

export type MissionNotificationStage =
  | 'received'
  | 'planning'
  | 'working'
  | 'job_progress'
  | 'completed'
  | 'paused'
  | 'failed'
