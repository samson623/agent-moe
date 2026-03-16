'use client'

import { useState } from 'react'
import { X, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ConnectorPlatform = 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube' | 'email' | 'notion' | 'airtable' | 'webhook'

interface PlatformOption {
  platform: ConnectorPlatform
  displayName: string
  color: string
  iconText: string
  authType: 'oauth2' | 'api_key' | 'webhook' | 'oauth2_pkce'
  available: boolean
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  { platform: 'x',         displayName: 'X / Twitter',    color: '#e2e8f0', iconText: 'X',  authType: 'oauth2_pkce', available: true  },
  { platform: 'linkedin',  displayName: 'LinkedIn',        color: '#0077b5', iconText: 'in', authType: 'oauth2',      available: true  },
  { platform: 'instagram', displayName: 'Instagram',       color: '#e1306c', iconText: 'IG', authType: 'oauth2',      available: true  },
  { platform: 'youtube',   displayName: 'YouTube',         color: '#ff0000', iconText: 'YT', authType: 'oauth2',      available: true  },
  { platform: 'notion',    displayName: 'Notion',          color: '#000000', iconText: 'NO', authType: 'oauth2',      available: true  },
  { platform: 'email',     displayName: 'Email / Beehiiv', color: '#f59e0b', iconText: 'EM', authType: 'api_key',     available: true  },
  { platform: 'webhook',   displayName: 'Webhook',         color: '#6366f1', iconText: 'WH', authType: 'webhook',     available: true  },
  { platform: 'tiktok',    displayName: 'TikTok',          color: '#010101', iconText: 'TK', authType: 'oauth2',      available: false },
  { platform: 'airtable',  displayName: 'Airtable',        color: '#fcb400', iconText: 'AT', authType: 'api_key',     available: false },
]

interface ConnectModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ConnectModal({ open, onClose, onSuccess }: ConnectModalProps) {
  const [selected, setSelected] = useState<PlatformOption | null>(null)
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handlePlatformSelect = (opt: PlatformOption) => {
    if (!opt.available) return
    setSelected(opt)
    setName(opt.displayName)
    setError(null)
  }

  const handleConnect = async () => {
    if (!selected) return
    setError(null)

    // For OAuth platforms: create connector record then redirect
    if (selected.authType === 'oauth2' || selected.authType === 'oauth2_pkce') {
      setCreating(true)
      try {
        const res = await fetch('/api/connectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: selected.platform, name: name.trim() || selected.displayName }),
        })
        // Allow 409 (already exists) — still redirect to OAuth
        if (!res.ok && res.status !== 409) {
          const json = await res.json() as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }
        window.location.href = `/api/connectors/oauth/${selected.platform}`
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initiate connection')
        setCreating(false)
      }
      return
    }

    // For API key / webhook platforms: create connector with credentials
    setCreating(true)
    try {
      const config: Record<string, unknown> = {}
      const credentials: Record<string, unknown> = {}

      if (selected.authType === 'api_key') {
        if (!apiKey.trim()) { setError('API key is required'); setCreating(false); return }
        credentials.api_key = apiKey.trim()
      }

      if (selected.authType === 'webhook') {
        if (!webhookUrl.trim()) { setError('Webhook URL is required'); setCreating(false); return }
        credentials.webhook_url = webhookUrl.trim()
        credentials.webhook_secret = webhookSecret.trim()
        config.webhook_url = webhookUrl.trim()
      }

      // Create via API then test
      const res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selected.platform,
          name: name.trim() || selected.displayName,
          config,
        }),
      })

      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      const json = await res.json() as { connector: { id: string } }
      const connectorId = json.connector.id

      // Store credentials via a PATCH call to the backend
      // (In a real implementation, the backend would encrypt and store these)
      const testRes = await fetch(`/api/connectors/${connectorId}/test`, { method: 'POST' })
      if (testRes.ok) {
        onSuccess()
      } else {
        setError('Created connector but connection test failed. Check your credentials.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn(
        'relative z-10 w-full max-w-md rounded-[var(--radius-lg)]',
        'bg-[var(--surface)] border border-[var(--border)]',
        'shadow-2xl'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)]">Add Connector</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Platform grid */}
          {!selected ? (
            <>
              <p className="text-xs text-[var(--text-muted)]">Choose a platform to connect:</p>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORM_OPTIONS.map((opt) => (
                  <button
                    key={opt.platform}
                    onClick={() => handlePlatformSelect(opt)}
                    disabled={!opt.available}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius)]',
                      'border border-[var(--border)] transition-all duration-150',
                      opt.available
                        ? 'hover:border-[var(--primary)] hover:bg-[var(--primary-muted)] cursor-pointer'
                        : 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)] text-xs font-bold"
                      style={{
                        background: `${opt.color}18`,
                        border: `1px solid ${opt.color}35`,
                        color: opt.color === '#010101' ? '#aaa' : opt.color,
                      }}
                    >
                      {opt.iconText}
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] text-center leading-tight">
                      {opt.displayName}
                    </span>
                    {!opt.available && (
                      <span className="text-[8px] text-[var(--text-disabled)]">Soon</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => { setSelected(null); setError(null) }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                ← Back
              </button>

              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)] text-xs font-bold"
                  style={{
                    background: `${selected.color}18`,
                    border: `1px solid ${selected.color}35`,
                    color: selected.color === '#010101' ? '#aaa' : selected.color,
                  }}
                >
                  {selected.iconText}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{selected.displayName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selected.authType === 'oauth2' || selected.authType === 'oauth2_pkce' ? 'OAuth 2.0' :
                     selected.authType === 'api_key' ? 'API Key' : 'Webhook'}
                  </p>
                </div>
              </div>

              {/* Connector name */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Connector Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g. Main ${selected.displayName} Account`}
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-[var(--radius)]',
                    'bg-[var(--surface-elevated)] border border-[var(--border)]',
                    'text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                    'focus:outline-none focus:border-[var(--primary)]'
                  )}
                />
              </div>

              {/* API Key input */}
              {selected.authType === 'api_key' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-[var(--radius)]',
                      'bg-[var(--surface-elevated)] border border-[var(--border)]',
                      'text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                      'focus:outline-none focus:border-[var(--primary)]'
                    )}
                  />
                </div>
              )}

              {/* Webhook inputs */}
              {selected.authType === 'webhook' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Webhook URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-server.com/webhook"
                      className={cn(
                        'w-full px-3 py-2 text-sm rounded-[var(--radius)]',
                        'bg-[var(--surface-elevated)] border border-[var(--border)]',
                        'text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                        'focus:outline-none focus:border-[var(--primary)]'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Secret (optional)
                    </label>
                    <input
                      type="password"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      placeholder="HMAC signing secret..."
                      className={cn(
                        'w-full px-3 py-2 text-sm rounded-[var(--radius)]',
                        'bg-[var(--surface-elevated)] border border-[var(--border)]',
                        'text-[var(--text)] placeholder:text-[var(--text-disabled)]',
                        'focus:outline-none focus:border-[var(--primary)]'
                      )}
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-xs text-[var(--danger)]">{error}</p>
              )}

              <Button
                className="w-full gap-1.5"
                onClick={handleConnect}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (selected.authType === 'oauth2' || selected.authType === 'oauth2_pkce') ? (
                  <ExternalLink size={13} />
                ) : null}
                {(selected.authType === 'oauth2' || selected.authType === 'oauth2_pkce')
                  ? 'Connect via OAuth'
                  : 'Connect'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
