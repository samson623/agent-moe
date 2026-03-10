import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContentStudioPage } from '@/features/content-studio/components/ContentStudioPage'

export const metadata = { title: 'Content Studio' }

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = (await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null }

  return <ContentStudioPage workspaceId={workspace?.id ?? ''} />
}
