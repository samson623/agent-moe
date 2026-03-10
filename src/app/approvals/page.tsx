import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApprovalQueuePage from '@/features/approval-queue/components/ApprovalQueuePage'

export const metadata = { title: 'Approval Queue — AGENT MOE' }

export default async function ApprovalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null }

  if (!workspace) {
    return (
      <div className="p-8 text-[var(--text-muted)] text-sm">
        No workspace found. Please complete setup.
      </div>
    )
  }

  return <ApprovalQueuePage workspaceId={workspace.id} />
}
