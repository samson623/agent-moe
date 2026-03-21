'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Clock, Loader2, Zap, Unplug, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePublish } from '@/features/connectors/hooks/use-publish'
import type { Connector, ConnectorPlatform } from '@/features/connectors/hooks/use-connectors'

const PLATFORM_META: Record<ConnectorPlatform, { displayName: string; color: string; iconText: string }> = {
  x:         { displayName: 'X / Twitter',    color: '#e2e8f0', iconText: 'X'  },
  linkedin:  { displayName: 'LinkedIn',        color: '#0077b5', iconText: 'in' },
  instagram: { displayName: 'Instagram',       color: '#e1306c', iconText: 'IG' },
  tiktok:    { displayName: 'TikTok',          color: '#010101', iconText: 'TK' },
  youtube:   { displayName: 'YouTube',         color: '#ff0000', iconText: 'YT' },
  email:     { displayName: 'Email / Beehiiv', color: '#f59e0b', iconText: 'EM' },
  notion:    { displayName: 'Notion',          color: '#000000', iconText: 'NO' },
  airtable:  { displayName: 'Airtable',        color: '#fcb400', iconText: 'AT' },
  webhook:   { displayName: 'Webhook',         color: '#6366f1', iconText: 'WH' },
  telegram:  { displayName: 'Telegram',        color: '#229ed9', iconText: 'TG' },
}

const STATUS_CONFIG = {
  connected: {
    Icon: CheckCircle2,
    label: 'Connected',
    color: 'var(--success)',
    border: 'border-[rgba(62,207,142,0.25)] bg-[rgba(62,207,142,0.03)]',
  },
  disconnected: {
    Icon: XCircle,
    label: 'Disconnected',
    color: 'var(--text-muted)',
    border: '',
  },
  error: {
    Icon: AlertCircle,
    label: 'Error',
    color: 'var(--danger)',
    border: 'border-red-500/20 bg-red-500/[0.02]',
  },
  pending: {
    Icon: Clock,
    label: 'Pending',
    color: 'var(--warning)',
    border: 'border-yellow-500/20 bg-yellow-500/[0.02]',
  },
}

function formatLastSync(ts: string | null): string {
  if (!ts) return 'Never synced'
  const diff = Date.now() - new Date(ts).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just synced'
  if (minutes < 60) return `Last sync: ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Last sync: ${hours}h ago`
  return `Last sync: ${Math.floor(hours / 24)}d ago`
}

interface ConnectorCardProps {
  connector: Connector
  onRefetch: () => void
}

export function ConnectorCard({ connector, onRefetch }: ConnectorCardProps) {
  const { testConnection, disconnect, loading } = usePublish()
  const [testResult, setTestResult] = useState<string | null>(null)

  const meta = PLATFORM_META[connector.platform]
  const statusCfg = STATUS_CONFIG[connector.status]
  const StatusIcon = statusCfg.Icon
  const handle = connector.config?.account_handle as string | undefined

  const handleTest = async () => {
    setTestResult(null)
    const result = await testConnection(connector.id)
    setTestResult(result.success ? `✓ ${result.accountHandle ?? 'Connected'}` : `✗ ${result.error}`)
    onRefetch()
  }

  const handleDisconnect = async () => {
    await disconnect(connector.id)
    onRefetch()
  }

  const handleConnect = () => {
    window.location.href = `/api/connectors/oauth/${connector.platform}`
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-[var(--radius-lg)]',
        'border border-[var(--border)] bg-[var(--surface)]',
        'hover:bg-[var(--surface-hover)] transition-all duration-150',
        statusCfg.border
      )}
    >
      {/* Platform icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-[var(--radius)] shrink-0 text-xs font-bold"
        style={{
          background: `${meta.color}18`,
          border: `1px solid ${meta.color}35`,
          color: meta.color === '#010101' ? '#aaa' : meta.color,
        }}
      >
        {meta.iconText}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text)] truncate">{meta.displayName}</p>
            {handle && (
              <p className="text-xs text-[var(--text-muted)] truncate">{handle}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {connector.status === 'connected' && (
              <span className="relative flex h-1.5 w-1.5 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--success)' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--success)' }} />
              </span>
            )}
            <StatusIcon size={11} style={{ color: statusCfg.color }} />
            <span className="text-xs font-medium" style={{ color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Last sync */}
        <p className="text-xs text-[var(--text-muted)] mb-2">
          {formatLastSync(connector.last_sync_at)}
        </p>

        {/* Test result feedback */}
        {testResult && (
          <p className={cn('text-xs mb-2 font-medium', testResult.startsWith('✓') ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
            {testResult}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {connector.status === 'connected' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6 px-2 gap-1"
                onClick={handleTest}
                disabled={loading}
              >
                {loading ? <Loader2 size={9} className="animate-spin" /> : <Zap size={9} />}
                Test
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6 px-2 gap-1 text-[var(--danger)] hover:text-[var(--danger)]"
                onClick={handleDisconnect}
                disabled={loading}
              >
                <Unplug size={9} />
                Disconnect
              </Button>
            </>
          ) : connector.status === 'error' ? (
            <Button
              size="sm"
              className="text-xs h-6 px-2 gap-1"
              onClick={handleConnect}
            >
              <AlertCircle size={9} />
              Reconnect
            </Button>
          ) : connector.status === 'pending' ? (
            <Button variant="outline" size="sm" className="text-xs h-6 px-2 gap-1" disabled>
              <Loader2 size={9} className="animate-spin" />
              Completing auth...
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-xs h-6 px-2 gap-1"
              onClick={handleConnect}
            >
              <Send size={9} />
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
