import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LaunchpadPage } from '@/features/launchpad/components/LaunchpadPage'

export const metadata = { title: 'Launchpad' }

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
  return <LaunchpadPage workspaceId={workspaceId} />
}
