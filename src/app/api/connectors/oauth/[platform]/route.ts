import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OAuthManager } from '@/features/connectors/oauth-manager'
import type { ConnectorPlatform } from '@/features/connectors/types'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ platform: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { platform } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: workspace } = (await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null }
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const supportedPlatforms: ConnectorPlatform[] = ['x', 'linkedin', 'instagram', 'youtube', 'notion']
    if (!supportedPlatforms.includes(platform as ConnectorPlatform)) {
      return NextResponse.json({ error: `OAuth not supported for platform: ${platform}` }, { status: 400 })
    }

    const manager = new OAuthManager()
    const result = manager.initiateOAuth(platform as ConnectorPlatform, workspace.id)

    // Set OAuth cookies for state verification and PKCE
    const response = NextResponse.redirect(result.authUrl)
    response.cookies.set('moe_oauth_state', result.state, {
      httpOnly: true,
      path: '/',
      maxAge: 600, // 10 minutes
      sameSite: 'lax',
    })

    if (result.codeVerifier) {
      response.cookies.set('moe_pkce_verifier', result.codeVerifier, {
        httpOnly: true,
        path: '/',
        maxAge: 600,
        sameSite: 'lax',
      })
    }

    return response
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
