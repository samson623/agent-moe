import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrowserTaskDetailPage } from '@/features/browser-agent/components/BrowserTaskDetailPage'

export const metadata = { title: 'Browser Task' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  return <BrowserTaskDetailPage taskId={id} />
}
