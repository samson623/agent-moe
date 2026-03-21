/**
 * Telegram Command Router — Deterministic routing first, LLM fallback last.
 *
 * 1. Slash commands → deterministic handler
 * 2. Callback queries → callback handler
 * 3. Forwarded messages → summarize handler
 * 4. Freeform text → GPT-5 Nano classification (last resort)
 *
 * Per feedback: NEVER route everything through GPT-5 Nano.
 * Only freeform unstructured text hits the LLM.
 */

import type { TelegramHandlerContext, TelegramCommand, RouteResult } from './types'

// ---------------------------------------------------------------------------
// Route detection
// ---------------------------------------------------------------------------

const COMMANDS: TelegramCommand[] = ['/start', '/mission', '/status', '/approve', '/revise', '/help']

export function detectRoute(text: string, isCallback: boolean, isForwarded: boolean): RouteResult {
  if (isCallback) {
    return { command: 'callback', args: text }
  }

  if (isForwarded) {
    return { command: 'forwarded', args: text }
  }

  const trimmed = text.trim()

  for (const cmd of COMMANDS) {
    if (trimmed === cmd || trimmed.startsWith(cmd + ' ')) {
      const args = trimmed.slice(cmd.length).trim()
      return { command: cmd, args }
    }
    // Handle @botname suffix: /status@AgentMoeBot
    if (trimmed.startsWith(cmd + '@')) {
      const afterAt = trimmed.slice(cmd.length)
      const spaceIdx = afterAt.indexOf(' ')
      const args = spaceIdx >= 0 ? afterAt.slice(spaceIdx + 1).trim() : ''
      return { command: cmd, args }
    }
  }

  return { command: 'freeform', args: text }
}

// ---------------------------------------------------------------------------
// Router — dispatches to handlers, returns response text + optional keyboard
// ---------------------------------------------------------------------------

export interface RouterResponse {
  text: string
  parseMode: 'MarkdownV2'
  inlineKeyboard?: Array<Array<{ text: string; callback_data?: string }>>
  /** For callback queries — the toast answer text */
  callbackAnswer?: string
}

export async function routeMessage(
  ctx: TelegramHandlerContext,
  route: RouteResult,
): Promise<RouterResponse> {
  const handlerCtx: TelegramHandlerContext = { ...ctx, args: route.args }

  switch (route.command) {
    case '/start': {
      const { handleStart } = await import('./handlers/start')
      return { text: await handleStart(handlerCtx), parseMode: 'MarkdownV2' }
    }

    case '/mission': {
      const { handleMission } = await import('./handlers/mission')
      return { text: await handleMission(handlerCtx), parseMode: 'MarkdownV2' }
    }

    case '/status': {
      const { handleStatus } = await import('./handlers/status')
      return { text: await handleStatus(handlerCtx), parseMode: 'MarkdownV2' }
    }

    case '/approve': {
      const { handleApprove } = await import('./handlers/approve')
      const result = await handleApprove(handlerCtx)
      return {
        text: result.text,
        parseMode: 'MarkdownV2',
        inlineKeyboard: result.inlineKeyboard,
      }
    }

    case '/revise': {
      const { handleRevise } = await import('./handlers/revise')
      return { text: await handleRevise(handlerCtx), parseMode: 'MarkdownV2' }
    }

    case '/help': {
      const { formatHelp } = await import('./formatter')
      return { text: formatHelp(), parseMode: 'MarkdownV2' }
    }

    case 'callback': {
      const { handleCallback } = await import('./handlers/callback')
      const result = await handleCallback(handlerCtx)
      return {
        text: result.messageText ?? '',
        parseMode: 'MarkdownV2',
        callbackAnswer: result.answerText,
      }
    }

    case 'forwarded': {
      const { handleForwarded } = await import('./handlers/forwarded')
      const result = await handleForwarded(handlerCtx)
      return {
        text: result.text,
        parseMode: 'MarkdownV2',
        inlineKeyboard: result.inlineKeyboard,
      }
    }

    case 'freeform': {
      const { handleFreeform } = await import('./handlers/freeform')
      return { text: await handleFreeform(handlerCtx), parseMode: 'MarkdownV2' }
    }

    default: {
      const { formatHelp } = await import('./formatter')
      return { text: formatHelp(), parseMode: 'MarkdownV2' }
    }
  }
}
