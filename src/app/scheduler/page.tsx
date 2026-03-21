import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SchedulerPage } from '@/features/scheduler/components/SchedulerPage'

export const metadata = { title: 'Scheduler' }

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
  return <SchedulerPage workspaceId={workspaceId} />
}
