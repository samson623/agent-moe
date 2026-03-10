import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VideoPackageDetailPage } from '@/features/video-packaging/components/VideoPackageDetailPage'
import type { Metadata } from 'next'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data } = (await supabase
    .from('video_packages')
    .select('title')
    .eq('id', id)
    .single()) as { data: { title: string } | null }

  return {
    title: data?.title ? `${data.title} | Video Studio` : 'Video Package | Video Studio',
  }
}

export default async function VideoPackageDetailRoute({ params }: PageProps) {
  const { id } = await params
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

  const { data: pkg } = (await supabase
    .from('video_packages')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single()) as { data: { id: string } | null }

  if (!pkg) notFound()

  return <VideoPackageDetailPage id={id} workspaceId={workspace.id} />
}
