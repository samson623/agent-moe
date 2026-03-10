import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  /** Optional element rendered to the right of the title row */
  action?: React.ReactNode;
}

/**
 * Canvas-grade section wrapper.
 * Translucent glass card with title + optional subtitle + children.
 */
const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border)]",
        "bg-[var(--surface)] p-5",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
);
Section.displayName = "Section";

export { Section };
