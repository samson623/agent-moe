'use client'

import { CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PublishingLog } from '@/features/connectors/hooks/use-connector-detail'

interface PublishHistoryPanelProps {
  logs: PublishingLog[]
}

const STATUS_ICON = {
  success: { Icon: CheckCircle2, color: 'var(--success)' },
  failed:  { Icon: XCircle, color: 'var(--danger)' },
  pending: { Icon: Clock, color: 'var(--warning)' },
  cancelled: { Icon: XCircle, color: 'var(--text-muted)' },
}

function formatDate(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function PublishHistoryPanel({ logs }: PublishHistoryPanelProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock size={24} className="text-[var(--text-muted)] mb-2 opacity-40" />
        <p className="text-xs text-[var(--text-muted)]">No publishing history yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const { Icon, color } = STATUS_ICON[log.status] ?? STATUS_ICON.pending

        return (
          <div
            key={log.id}
            className={cn(
              'flex items-start gap-3 px-3 py-2.5 rounded-[var(--radius)]',
              'border border-[var(--border)] bg-[var(--surface)]',
              'hover:bg-[var(--surface-hover)] transition-colors'
            )}
          >
            <Icon size={13} style={{ color }} className="shrink-0 mt-0.5" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-[var(--text)] capitalize">
                  {log.platform}
                </span>
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
                  style={{
                    background: `${color}15`,
                    color,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {log.status}
                </span>
              </div>

              {log.error_message && (
                <p className="text-xs text-[var(--danger)] truncate">{log.error_message}</p>
              )}

              {log.external_post_id && !log.error_message && (
                <p className="text-xs text-[var(--text-muted)] truncate">
                  ID: {log.external_post_id}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[9px] text-[var(--text-muted)]">
                {formatDate(log.published_at ?? log.created_at)}
              </span>
              {log.external_post_url && (
                <a
                  href={log.external_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:text-[var(--primary)]"
                >
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
