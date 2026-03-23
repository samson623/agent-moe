/**
 * Telegram query helpers.
 *
 * All functions use the admin client (service role) because Telegram
 * webhook requests have no Supabase session cookies.
 *
 * Error handling: every function returns `{ data, error }` — callers decide
 * how to surface errors rather than this layer throwing.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'
import type {
  TelegramLink,
  TelegramLinkInsert,
  TelegramSession,
  TelegramSessionState,
} from '@/features/telegram/types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Account linking
// ---------------------------------------------------------------------------

/**
 * Link a Telegram chat to an Agent MOE user/workspace.
 * Upserts on chat_id so re-linking replaces the old link.
 */
export async function linkTelegramAccount(
  client: TypedClient,
  link: TelegramLinkInsert,
): Promise<{ data: TelegramLink | null; error: string | null }> {
  const { data, error } = await client
    .from('telegram_links')
    .upsert(
      {
        user_id: link.user_id,
        workspace_id: link.workspace_id,
        chat_id: link.chat_id,
        username: link.username ?? null,
        is_active: link.is_active ?? true,
        linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'chat_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('[Telegram] linkTelegramAccount failed:', error.message)
    return { data: null, error: error.message }
  }

  return { data: data as unknown as TelegramLink, error: null }
}

/**
 * Unlink a Telegram chat (soft-delete: sets is_active = false).
 */
export async function unlinkTelegramAccount(
  client: TypedClient,
  chatId: number,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('telegram_links')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('chat_id', chatId)

  if (error) {
    console.error('[Telegram] unlinkTelegramAccount failed:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Look up a linked account by Telegram chat_id.
 * This is the webhook hot-path query — indexed.
 */
export async function getTelegramLinkByChatId(
  client: TypedClient,
  chatId: number,
): Promise<{ data: TelegramLink | null; error: string | null }> {
  const { data, error } = await client
    .from('telegram_links')
    .select('*')
    .eq('chat_id', chatId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[Telegram] getTelegramLinkByChatId failed:', error.message)
    return { data: null, error: error.message }
  }

  return { data: data as unknown as TelegramLink | null, error: null }
}

/**
 * Look up a linked account by Agent MOE user_id.
 * Used for outbound notifications (find their chat_id to send messages).
 */
export async function getTelegramLinkByUserId(
  client: TypedClient,
  userId: string,
): Promise<{ data: TelegramLink | null; error: string | null }> {
  const { data, error } = await client
    .from('telegram_links')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('linked_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[Telegram] getTelegramLinkByUserId failed:', error.message)
    return { data: null, error: error.message }
  }

  return { data: data as unknown as TelegramLink | null, error: null }
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Get the current session state for a chat.
 */
export async function getTelegramSession(
  client: TypedClient,
  chatId: number,
): Promise<{ data: TelegramSession | null; error: string | null }> {
  const { data, error } = await client
    .from('telegram_sessions')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle()

  if (error) {
    console.error('[Telegram] getTelegramSession failed:', error.message)
    return { data: null, error: error.message }
  }

  return { data: data as unknown as TelegramSession | null, error: null }
}

/**
 * Create or update a session for a chat.
 * Merges the provided state into the existing state (shallow merge).
 */
export async function upsertTelegramSession(
  client: TypedClient,
  chatId: number,
  userId: string,
  workspaceId: string,
  state: TelegramSessionState,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('telegram_sessions')
    .upsert(
      {
        chat_id: chatId,
        user_id: userId,
        workspace_id: workspaceId,
        state: state as unknown as Database['public']['Tables']['telegram_sessions']['Insert']['state'],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'chat_id' },
    )

  if (error) {
    console.error('[Telegram] upsertTelegramSession failed:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Clear (delete) a session for a chat.
 * Called after a conversational flow completes.
 */
export async function clearTelegramSession(
  client: TypedClient,
  chatId: number,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('telegram_sessions')
    .delete()
    .eq('chat_id', chatId)

  if (error) {
    console.error('[Telegram] clearTelegramSession failed:', error.message)
    return { error: error.message }
  }

  return { error: null }
}
