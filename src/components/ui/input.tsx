import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    if (leftIcon ?? rightIcon) {
      return (
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              "flex h-9 w-full rounded-[var(--radius)] border border-[var(--border)]",
              "bg-[var(--surface-elevated)] text-[var(--text)]",
              "text-sm placeholder:text-[var(--text-disabled)]",
              "transition-all duration-150",
              "focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              leftIcon ? "pl-9 pr-3" : "px-3",
              rightIcon ? "pr-9" : "",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[var(--text-muted)] pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--radius)] border border-[var(--border)]",
          "bg-[var(--surface-elevated)] text-[var(--text)]",
          "px-3 text-sm placeholder:text-[var(--text-disabled)]",
          "transition-all duration-150",
          "focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
