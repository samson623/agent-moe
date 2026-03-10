"use client"

import { useState, useCallback } from "react"
import { Link as LinkIcon, Plus, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useConnectors, useConnectorStats, useRealtimeConnectors, usePublish } from "@/features/connectors/hooks"
import { ConnectorCard } from "@/features/connectors/components/ConnectorCard"
import { ConnectModal } from "@/features/connectors/components/ConnectModal"
import { DisconnectModal } from "@/features/connectors/components/DisconnectModal"
import { PublishModal } from "@/features/connectors/components/PublishModal"
import { ConnectorStats } from "@/features/connectors/components/ConnectorStats"
import { ConnectorFilters } from "@/features/connectors/components/ConnectorFilters"

type ConnectorPlatform = 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube' | 'email' | 'notion' | 'airtable' | 'webhook'
type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'pending'

interface Connector {
  id: string
  workspace_id: string
  platform: ConnectorPlatform
  name: string
  status: ConnectorStatus
  config: Record<string, unknown>
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

function SkeletonCard() {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-[var(--radius-lg)]",
        "border border-[var(--border)] bg-[var(--surface-solid)]",
        "animate-pulse"
      )}
    >
      <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--surface-elevated)] shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-[var(--surface-elevated)] rounded w-1/2" />
        <div className="h-3 bg-[var(--surface-elevated)] rounded w-3/4" />
        <div className="flex gap-2 mt-2">
          <div className="h-4 w-14 bg-[var(--surface-elevated)] rounded" />
          <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>
    </div>
  )
}

export function ConnectorsPage({ workspaceId }: { workspaceId: string }) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [disconnectTarget, setDisconnectTarget] = useState<Connector | null>(null)
  const [publishTarget, setPublishTarget] = useState<Connector | null>(null)

  const { connectors: rawConnectors, loading, error, refetch } = useConnectors()
  const { stats, loading: statsLoading } = useConnectorStats()
  const { loading: publishLoading } = usePublish()

  const [realtimeConnectors, setRealtimeConnectors] = useState<Connector[] | null>(null)

  useRealtimeConnectors(workspaceId, (fresh: Connector[]) => {
    setRealtimeConnectors(fresh)
  })

  const connectors: Connector[] = (realtimeConnectors ?? rawConnectors ?? []) as Connector[]

  const filteredConnectors = connectors.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter
    return matchesStatus && matchesPlatform
  })

  const connectedCount = connectors.filter((c) => c.status === 'connected').length

  const handleConnectSuccess = useCallback(() => {
    setConnectModalOpen(false)
    refetch()
  }, [refetch])

  const handleDisconnectSuccess = useCallback(() => {
    setDisconnectTarget(null)
    refetch()
  }, [refetch])

  const handlePublishSuccess = useCallback(() => {
    setPublishTarget(null)
    refetch()
  }, [refetch])

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header row */}
      <div className="flex items-center justify-end gap-2">
        {loading ? (
          <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
        ) : error ? (
          <Badge variant="danger">
            <AlertCircle size={10} className="mr-1" />
            Error
          </Badge>
        ) : (
          <Badge variant="success">
            <CheckCircle2 size={10} className="mr-1" />
            {connectedCount} Connected
          </Badge>
        )}
        <Button size="sm" onClick={() => setConnectModalOpen(true)} className="gap-1.5">
          <Plus size={14} />
          Add Connector
        </Button>
      </div>

      {/* Stats row */}
      <ConnectorStats stats={stats} loading={statsLoading} />

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <ConnectorFilters
            statusFilter={statusFilter}
            platformFilter={platformFilter}
            onStatusChange={setStatusFilter}
            onPlatformChange={setPlatformFilter}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
          className="gap-1.5 shrink-0"
        >
          <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Connector grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {statusFilter !== 'all' || platformFilter !== 'all'
              ? 'Filtered Connectors'
              : 'All Connectors'}
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            {loading ? '...' : `${filteredConnectors.length} of ${connectors.length}`}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredConnectors.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-16 rounded-[var(--radius-lg)]",
              "border border-dashed border-[var(--border)] bg-[var(--surface-solid)]"
            )}
          >
            <LinkIcon size={32} className="text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
              No connectors found
            </p>
            <p className="text-xs text-[var(--text-muted)] opacity-60 mb-4">
              {statusFilter !== 'all' || platformFilter !== 'all'
                ? 'Try adjusting the filters above'
                : 'Connect your first platform to start publishing'}
            </p>
            <Button size="sm" onClick={() => setConnectModalOpen(true)} className="gap-1.5">
              <Plus size={13} />
              Add your first connector
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredConnectors.map((c) => (
              <ConnectorCard
                key={c.id}
                connector={c}
                onRefetch={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConnectModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onSuccess={handleConnectSuccess}
      />

      <DisconnectModal
        connector={disconnectTarget}
        open={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onSuccess={handleDisconnectSuccess}
      />

      <PublishModal
        connector={publishTarget}
        open={!!publishTarget}
        onClose={() => setPublishTarget(null)}
        onSuccess={handlePublishSuccess}
        loading={publishLoading}
      />
    </div>
  )
}
