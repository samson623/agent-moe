import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, sub, icon: Icon, accent, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border)]",
        "bg-[var(--surface-solid)] p-4 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)] mb-1.5">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-[var(--text)] tabular-nums">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              {sub}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] shrink-0",
              "bg-[var(--surface-elevated)]",
              accent ?? "text-[var(--text-muted)]"
            )}
          >
            <Icon size={16} />
          </div>
        )}
      </div>
    </div>
  )
);
StatCard.displayName = "StatCard";

export { StatCard };
