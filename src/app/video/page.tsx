import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VideoPackagePage } from '@/features/video-packaging/components/VideoPackagePage'

export const metadata = { title: 'Video Studio — AGENT MOE' }

export default async function VideoPage() {
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

  if (!workspace) {
    return (
      <div className="p-8 text-[var(--text-muted)] text-sm">
        No workspace found. Please complete setup.
      </div>
    )
  }

  return <VideoPackagePage workspaceId={workspace.id} />
}
