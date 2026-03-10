import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ApprovalDetailPage } from '@/features/approval-queue/components/ApprovalDetailPage'
import type { Approval } from '@/lib/supabase/types'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Approval ${id.slice(0, 8)} — AGENT MOE` }
}

export default async function ApprovalDetailRoute({ params }: PageProps) {
  const { id } = await params
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
        No workspace found.
      </div>
    )
  }

  const { data: approval, error } = await supabase
    .from('approvals')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !approval) notFound()

  return <ApprovalDetailPage approval={approval as unknown as Approval} />
}
