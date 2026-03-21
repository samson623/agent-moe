/**
 * Lightweight inline keyboard types for handler return values.
 * We use these instead of importing deep grammy types in every handler.
 */

export interface InlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
}
