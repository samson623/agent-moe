import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MissionDetailPage } from '@/features/mission-engine/components/MissionDetailPage'
import type { Mission, Job } from '@/lib/supabase/types'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return { title: `Mission ${id.slice(0, 8)} — AGENT MOE` }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: mission, error: missionError } = (await supabase
    .from('missions')
    .select('*')
    .eq('id', id)
    .single()) as { data: Mission | null; error: unknown }

  if (missionError || !mission) notFound()

  const { data: jobs } = (await supabase
    .from('jobs')
    .select('*')
    .eq('mission_id', id)
    .order('created_at', { ascending: true })) as { data: Job[] | null }

  return <MissionDetailPage mission={mission} initialJobs={jobs ?? []} />
}
