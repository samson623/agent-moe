import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-[var(--radius)] font-medium text-sm",
    "transition-all duration-150 cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none whitespace-nowrap",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--primary)] text-white",
          "hover:bg-[var(--primary-hover)]",
          "shadow-[0_0_16px_rgba(59,130,246,0.25)]",
          "hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]",
        ].join(" "),
        accent: [
          "bg-[var(--accent)] text-white",
          "hover:bg-[var(--accent-hover)]",
          "shadow-[0_0_16px_rgba(124,58,237,0.25)]",
          "hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]",
        ].join(" "),
        outline: [
          "border border-[var(--border)] bg-transparent text-[var(--text)]",
          "hover:bg-[var(--surface-hover)] hover:border-[var(--primary)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--text-secondary)]",
          "hover:bg-[var(--surface-hover)] hover:text-[var(--text)]",
        ].join(" "),
        destructive: [
          "bg-[var(--danger)] text-white",
          "hover:bg-red-600",
          "shadow-[0_0_16px_rgba(239,68,68,0.2)]",
        ].join(" "),
        success: [
          "bg-[var(--success)] text-white",
          "hover:bg-emerald-600",
          "shadow-[0_0_16px_rgba(16,185,129,0.2)]",
        ].join(" "),
        link: [
          "bg-transparent text-[var(--primary)] underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ].join(" "),
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-[var(--radius-sm)]",
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
        "icon-lg": "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
