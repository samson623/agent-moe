import { createClient } from '@/lib/supabase/server'
import { CommandCenterPage } from '@/features/command-center/components/CommandCenterPage'
import type { Workspace } from '@/lib/supabase/types'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let workspaceId: string | null = null

  if (user) {
    const { data } = (await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .single()) as { data: Workspace | null }
    workspaceId = data?.id ?? null
  }

  return <CommandCenterPage workspaceId={workspaceId} />
}
