import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5",
    "rounded-full px-2.5 py-1",
    "text-xs font-medium",
    "select-none whitespace-nowrap",
    "transition-colors duration-150",
  ].join(" "),
  {
    variants: {
      tone: {
        default:
          "bg-[rgba(255,255,255,0.08)] text-[var(--text-muted)]",
        dark:
          "bg-[rgba(255,255,255,0.10)] text-[var(--text-secondary)]",
        success:
          "bg-[var(--success-muted)] text-[var(--success)]",
        warning:
          "bg-[var(--warning-muted)] text-[var(--warning)]",
        danger:
          "bg-[var(--danger-muted)] text-[var(--danger)]",
        royal:
          "bg-[var(--accent-muted)] text-[var(--accent)]",
        info:
          "bg-[var(--info-muted)] text-[var(--info)]",
        primary:
          "bg-[var(--primary-muted)] text-[var(--primary)]",
        /** Solid white pill — for primary CTAs and highlights */
        solid:
          "bg-[var(--text)] text-[var(--text-inverse)] font-semibold",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
);

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

function Pill({ className, tone, ...props }: PillProps) {
  return (
    <span className={cn(pillVariants({ tone }), className)} {...props} />
  );
}

export { Pill, pillVariants };
