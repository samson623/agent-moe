'use client'

import { useState } from 'react'
import { X, Unplug, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePublish } from '@/features/connectors/hooks/use-publish'
import type { Connector } from '@/features/connectors/hooks/use-connectors'

interface DisconnectModalProps {
  open: boolean
  connector: Connector | null
  onClose: () => void
  onSuccess: () => void
}

export function DisconnectModal({ open, connector, onClose, onSuccess }: DisconnectModalProps) {
  const { disconnect, loading } = usePublish()
  const [error, setError] = useState<string | null>(null)

  if (!open || !connector) return null

  const handleDisconnect = async () => {
    setError(null)
    try {
      await disconnect(connector.id)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className={cn(
        'relative z-10 w-full max-w-sm rounded-[var(--radius-lg)]',
        'bg-[var(--surface)] border border-[var(--border)]',
        'shadow-2xl'
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)]">Disconnect {connector.name}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-red-500/5 border border-red-500/15">
            <Unplug size={16} className="text-[var(--danger)] shrink-0" />
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              This will remove your access token for{' '}
              <span className="font-medium text-[var(--text)]">{connector.name}</span>.
              You can reconnect at any time by going through OAuth again.
            </p>
          </div>

          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Unplug size={13} />}
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
