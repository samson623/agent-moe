/**
 * POST /api/telegram/webhook — Telegram bot webhook endpoint.
 *
 * Flow:
 * 1. Verify webhook secret header
 * 2. Reject non-private chats (v1: private chats only)
 * 3. Look up linked account by chat_id
 * 4. Route through deterministic command router
 * 5. Send reply via Grammy bot API
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getTelegramConfig, isTelegramConfigured } from '@/features/telegram/config'
import { getTelegramLinkByChatId } from '@/lib/supabase/queries/telegram'
import { detectRoute, routeMessage } from '@/features/telegram/command-router'
import { getBot } from '@/features/telegram/bot'
import { formatUnlinked, formatPrivateChatOnly, formatError } from '@/features/telegram/formatter'
import type { TelegramHandlerContext } from '@/features/telegram/types'

// ---------------------------------------------------------------------------
// Webhook secret verification
// ---------------------------------------------------------------------------

function verifyWebhookSecret(req: NextRequest): boolean {
  const { webhookSecret } = getTelegramConfig()
  const header = req.headers.get('x-telegram-bot-api-secret-token')
  return header === webhookSecret
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: false, error: 'Telegram not configured' }, { status: 503 })
  }

  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    await processUpdate(body)
  } catch (err) {
    console.error('[Telegram webhook] Unhandled error:', err instanceof Error ? err.message : err)
  }

  // Always return 200 to Telegram — never let errors cause retries
  return NextResponse.json({ ok: true })
}

// ---------------------------------------------------------------------------
// Update processor
// ---------------------------------------------------------------------------

async function processUpdate(update: Record<string, unknown>) {
  const bot = getBot()
  const db = createAdminClient()

  // ── Extract chat info ──────────────────────────────────────────────────
  const message = update.message as Record<string, unknown> | undefined
  const callbackQuery = update.callback_query as Record<string, unknown> | undefined

  const chat = (message?.chat ?? (callbackQuery?.message as Record<string, unknown>)?.chat) as
    | Record<string, unknown>
    | undefined

  if (!chat) return // No chat info — skip

  const chatId = chat.id as number

  const chatType = chat.type as string

  // ── Private chat guard (v1) ────────────────────────────────────────────
  if (chatType !== 'private') {
    await bot.api
      .sendMessage(chatId, formatPrivateChatOnly(), { parse_mode: 'MarkdownV2' })
      .catch((err) => console.error('[Telegram] private-chat reply failed:', err))
    return
  }

  // ── Extract message text / callback data ───────────────────────────────
  const isCallback = !!callbackQuery
  const isForwarded = !!(message?.forward_date || message?.forward_origin)
  const text = isCallback
    ? ((callbackQuery.data as string) ?? '')
    : ((message?.text as string) ?? '')
  const username = isCallback
    ? ((callbackQuery.from as Record<string, unknown>)?.username as string | undefined) ?? null
    : ((message?.from as Record<string, unknown>)?.username as string | undefined) ?? null

  // ── Auth lookup ────────────────────────────────────────────────────────
  const { data: link } = await getTelegramLinkByChatId(db, chatId)

  // /start is the only command allowed without a linked account
  const route = detectRoute(text, isCallback, isForwarded)

  if (!link && route.command !== '/start') {
    await bot.api
      .sendMessage(chatId, formatUnlinked(), { parse_mode: 'MarkdownV2' })
      .catch((err) => console.error('[Telegram] unlinked reply failed:', err))
    return
  }

  // ── Build handler context ──────────────────────────────────────────────
  const ctx: TelegramHandlerContext = {
    db,
    link,
    chatId,
    text,
    args: route.args,
    username,
  }

  // ── Route and respond ──────────────────────────────────────────────────
  const response = await routeMessage(ctx, route)

  // Answer callback query toast (must be answered to dismiss the spinner)
  if (isCallback && callbackQuery) {
    await bot.api
      .answerCallbackQuery(callbackQuery.id as string, {
        text: response.callbackAnswer,
      })
      .catch((err) => console.error('[Telegram] answerCallbackQuery failed:', err))
  }

  // Send or edit message
  if (response.text) {
    const replyOptions: Record<string, unknown> = {
      parse_mode: response.parseMode,
    }

    if (response.inlineKeyboard) {
      replyOptions.reply_markup = {
        inline_keyboard: response.inlineKeyboard,
      }
    }

    await bot.api
      .sendMessage(chatId, response.text, replyOptions)
      .catch((err) => console.error('[Telegram] sendMessage failed:', err))
  }
}
