/**
 * One-shot script: send a plain Telegram message to the linked account.
 * Run: npx tsx scripts/notify-telegram.ts "Your message here"
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1]!.trim()] = match[2]!.trim()
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']!
const botToken   = env['TELEGRAM_BOT_TOKEN']!

const message = process.argv[2]
if (!message) {
  console.error('Usage: npx tsx scripts/notify-telegram.ts "Your message"')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // Get the first active telegram link
  const { data: link, error } = await supabase
    .from('telegram_links')
    .select('chat_id, username')
    .eq('is_active', true)
    .order('linked_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !link) {
    console.error('No active Telegram link found:', error?.message ?? 'empty result')
    process.exit(1)
  }

  console.log(`Sending to chat_id=${link.chat_id} (${link.username ?? 'unknown'})`)

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: link.chat_id,
      text: message,
      parse_mode: 'HTML',
    }),
  })

  const json = await res.json() as { ok: boolean; description?: string }
  if (!json.ok) {
    console.error('Telegram API error:', json.description)
    process.exit(1)
  }

  console.log('Message sent.')
}

main()
