import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { StatusBadge } from '@/components/nebula'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/supabase/types'

interface RiskBadgeProps {
  risk_level: RiskLevel
  className?: string
}

const RISK_CONFIG: Record<RiskLevel, { label: string; icon: React.ElementType; variant: 'danger' | 'warning' | 'accent' | 'info' }> = {
  critical: { label: 'CRITICAL', icon: ShieldAlert, variant: 'danger' },
  high: { label: 'HIGH', icon: AlertTriangle, variant: 'warning' },
  medium: { label: 'MEDIUM', icon: AlertCircle, variant: 'accent' },
  low: { label: 'LOW', icon: Info, variant: 'info' },
}

export function RiskBadge({ risk_level, className }: RiskBadgeProps) {
  const config = RISK_CONFIG[risk_level]
  if (!config) return null
  return (
    <StatusBadge
      label={config.label}
      variant={config.variant}
      size="sm"
      className={cn('gap-1', className)}
    />
  )
}
