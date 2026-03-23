import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getExperimentRuns } from '@/lib/supabase/queries/experiments'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const client = createAdminClient()
  const { data, error } = await getExperimentRuns(client, id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ runs: data })
}
