import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/supabase/types'

interface RiskBadgeProps {
  risk_level: RiskLevel
  className?: string
}

const RISK_CONFIG: Record<RiskLevel, { label: string; icon: React.ElementType; className: string }> = {
  critical: { label: 'CRITICAL', icon: ShieldAlert, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  high: { label: 'HIGH', icon: AlertTriangle, className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  medium: { label: 'MEDIUM', icon: AlertCircle, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  low: { label: 'LOW', icon: Info, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

export function RiskBadge({ risk_level, className }: RiskBadgeProps) {
  const config = RISK_CONFIG[risk_level]
  if (!config) return null
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn('flex items-center gap-1 text-[10px] font-bold tracking-wide border px-1.5 py-0.5', config.className, className)}
    >
      <Icon size={10} />
      {config.label}
    </Badge>
  )
}
