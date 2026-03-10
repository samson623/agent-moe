import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  getSystemStats,
  getMissionPerformance,
  getContentPerformance,
} from '@/lib/supabase/queries/analytics'

export const dynamic = 'force-dynamic'

export interface FeedbackInsight {
  id: string
  type: 'opportunity' | 'warning' | 'recommendation' | 'success'
  title: string
  body: string
  metric?: string
}

const feedbackSchema = z.object({
  workspace_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { workspace_id } = parsed.data

    // Auth: verify user owns this workspace
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()

    const [systemResult, missionsResult, contentResult] = await Promise.all([
      getSystemStats(adminClient, workspace_id, '30d'),
      getMissionPerformance(adminClient, workspace_id, '30d'),
      getContentPerformance(adminClient, workspace_id, '30d'),
    ])

    const systemStats = systemResult.data
    const missionStats = missionsResult.data
    const contentStats = contentResult.data

    if (!systemStats || !missionStats || !contentStats) {
      return NextResponse.json({ data: [] })
    }

    // Determine top operator team by mission count
    const topTeam = missionStats.by_operator
      ? (Object.entries(missionStats.by_operator) as [string, number][]).sort(
          ([, a], [, b]) => b - a,
        )[0]?.[0] ?? 'none'
      : 'none'

    const prompt = `You are an analytics advisor for an AI operator platform. Analyze these performance stats and generate 3-5 actionable insights.

Stats (last 30 days):
- Missions: ${systemStats.missions_completed} completed, ${systemStats.missions_failed} failed
- Assets: ${systemStats.assets_total} generated, ${systemStats.assets_published} published
- Approval rate: ${systemStats.approval_rate}%
- Publish success rate: ${systemStats.publish_success_rate}%
- Top operator: ${topTeam}

Return a JSON array of insights, each with: id (uuid), type ("opportunity"|"warning"|"recommendation"|"success"), title (short), body (1-2 sentences), metric (optional stat string).
Return ONLY valid JSON array, no markdown.`

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    let insights: FeedbackInsight[] = []

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_NANO_MODEL ?? 'gpt-5-nano',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      })

      const raw = completion.choices[0]?.message?.content ?? '[]'
      insights = JSON.parse(raw) as FeedbackInsight[]
    } catch {
      // Parse errors or API errors: return empty insights gracefully
      insights = []
    }

    return NextResponse.json({ data: insights })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
