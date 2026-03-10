import { createClient } from '@/lib/supabase/server'
import { getAsset } from '@/lib/supabase/queries/assets'
import { AssetDetailPage } from '@/features/content-studio/components/AssetDetailPage'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Asset } from '@/lib/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = (await getAsset(supabase as unknown as SupabaseClient<Database>, id)) as { data: Asset | null; error: unknown }
  return { title: data?.title ?? 'Asset Detail' }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: asset, error } = (await getAsset(supabase as unknown as SupabaseClient<Database>, id)) as {
    data: Asset | null
    error: unknown
  }

  if (!asset || error) notFound()

  return <AssetDetailPage initialAsset={asset} />
}
