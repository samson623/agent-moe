import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RevenueLabPage } from '@/features/revenue-lab/components/RevenueLabPage'

export const metadata = { title: 'Revenue Lab' }

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = (await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null }

  const workspaceId = workspace?.id ?? ''
  return <RevenueLabPage workspaceId={workspaceId} />
}
