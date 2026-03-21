import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getTelegramConfig } from '@/features/telegram/config'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: workspace } = await admin
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const { linkSecret } = getTelegramConfig()

  const payload = Buffer.from(`${user.id}:${workspace.id}:${Date.now()}`).toString('base64')
  const signature = crypto.createHmac('sha256', linkSecret).update(payload).digest('hex')
  const linkCode = `${payload}:${signature}`

  return NextResponse.json({ linkCode, botUsername: 'agentmoe_bot' })
}
