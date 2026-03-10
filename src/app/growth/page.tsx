import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GrowthEnginePage } from '@/features/growth-engine/components/GrowthEnginePage'

export const metadata = { title: 'Growth Engine' }

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = (await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null }

  return <GrowthEnginePage workspaceId={workspace?.id ?? ''} />
}
