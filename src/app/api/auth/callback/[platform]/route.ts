import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OAuthManager } from '@/features/connectors/oauth-manager'
import { getConnectorByPlatform, createConnector, updateConnector, updateConnectorCredentials, updateConnectorStatus } from '@/lib/supabase/queries/connectors'
import type { ConnectorPlatform } from '@/features/connectors/types'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ platform: string }> }

export async function GET(req: Request, { params }: Params) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { platform } = await params

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const oauthError = url.searchParams.get('error')

    // Handle OAuth provider errors
    if (oauthError) {
      return NextResponse.redirect(`${appUrl}/connectors?error=${encodeURIComponent(oauthError)}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${appUrl}/connectors?error=missing_code_or_state`)
    }

    // Verify state matches cookie
    const cookies = req.headers.get('cookie') ?? ''
    const cookieMap: Record<string, string> = Object.fromEntries(
      cookies.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      })
    )

    const storedState = cookieMap['moe_oauth_state']
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${appUrl}/connectors?error=invalid_state`)
    }

    // Get PKCE verifier for X
    const codeVerifier = cookieMap['moe_pkce_verifier']

    // Parse workspaceId and platform from state
    const parsed = OAuthManager.parseState(state)
    if (!parsed) {
      return NextResponse.redirect(`${appUrl}/connectors?error=invalid_state_format`)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(`${appUrl}/login`)
    }

    // Exchange code for tokens
    const manager = new OAuthManager()
    const callbackResult = await manager.exchangeCode(
      platform as ConnectorPlatform,
      code,
      codeVerifier
    )

    if (!callbackResult.success || !callbackResult.credentials.access_token) {
      return NextResponse.redirect(
        `${appUrl}/connectors?error=${encodeURIComponent(callbackResult.error ?? 'token_exchange_failed')}`
      )
    }

    const workspaceId = parsed.workspaceId
    const connectorPlatform = platform as ConnectorPlatform

    // Upsert connector — update if exists, create if not
    const existing = await getConnectorByPlatform(workspaceId, connectorPlatform)

    if (existing) {
      await updateConnectorCredentials(existing.id, callbackResult.credentials as Record<string, unknown>)
      await updateConnectorStatus(existing.id, 'connected')

      // Update account handle if available
      if (callbackResult.credentials.account_handle) {
        await updateConnector(existing.id, {
          config: {
            ...existing.config,
            account_handle: callbackResult.credentials.account_handle,
            account_id: callbackResult.credentials.account_id,
          },
        })
      }
    } else {
      const platformDisplayNames: Partial<Record<ConnectorPlatform, string>> = {
        x: 'X / Twitter',
        linkedin: 'LinkedIn',
        instagram: 'Instagram',
        youtube: 'YouTube',
        notion: 'Notion',
      }

      await createConnector({
        workspace_id: workspaceId,
        platform: connectorPlatform,
        name: platformDisplayNames[connectorPlatform] ?? connectorPlatform,
        status: 'connected',
        credentials: callbackResult.credentials as Record<string, unknown>,
        config: {
          account_handle: callbackResult.credentials.account_handle,
          account_id: callbackResult.credentials.account_id,
        },
      })
    }

    // Clear OAuth cookies and redirect to success
    const response = NextResponse.redirect(
      `${appUrl}/connectors?connected=${encodeURIComponent(platform)}`
    )
    response.cookies.delete('moe_oauth_state')
    response.cookies.delete('moe_pkce_verifier')
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'oauth_callback_error'
    return NextResponse.redirect(`${appUrl}/connectors?error=${encodeURIComponent(msg)}`)
  }
}
