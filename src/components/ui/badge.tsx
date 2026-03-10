import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-full px-2.5 py-0.5",
    "text-xs font-medium",
    "transition-colors duration-150",
    "select-none whitespace-nowrap",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(8,88,71,0.72)] text-[var(--primary)] border border-[rgba(63,224,193,0.14)]",
        accent:
          "bg-[rgba(95,31,128,0.7)] text-[#efb1ff] border border-[rgba(217,70,239,0.14)]",
        success:
          "bg-[var(--success-muted)] text-[var(--success)] border border-[rgba(74,222,128,0.15)]",
        warning:
          "bg-[var(--warning-muted)] text-[var(--warning)] border border-[rgba(244,200,78,0.15)]",
        danger:
          "bg-[var(--danger-muted)] text-[var(--danger)] border border-[rgba(251,113,133,0.15)]",
        info:
          "bg-[var(--info-muted)] text-[var(--info)] border border-[rgba(103,232,249,0.15)]",
        outline:
          "bg-transparent text-[var(--text-secondary)] border border-[var(--border)]",
        muted:
          "bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]",
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
