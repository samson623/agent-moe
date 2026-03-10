import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-full px-3 py-1",
    "text-[13px] font-medium",
    "transition-colors duration-150",
    "select-none whitespace-nowrap",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-[var(--primary-muted)] text-[var(--primary)] border border-[rgba(59,130,246,0.2)]",
        accent: "bg-[var(--accent-muted)] text-[#a78bfa] border border-[rgba(124,58,237,0.2)]",
        success: "bg-[var(--success-muted)] text-[var(--success)] border border-[rgba(16,185,129,0.2)]",
        warning: "bg-[var(--warning-muted)] text-[var(--warning)] border border-[rgba(245,158,11,0.2)]",
        danger: "bg-[var(--danger-muted)] text-[var(--danger)] border border-[rgba(239,68,68,0.2)]",
        info: "bg-[var(--info-muted)] text-[var(--info)] border border-[rgba(6,182,212,0.2)]",
        outline: "bg-transparent text-[var(--text-secondary)] border border-[var(--border)]",
        muted: "bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
