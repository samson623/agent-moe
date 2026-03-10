import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-[var(--radius-button)] font-medium text-sm",
    "transition-all duration-150 cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none whitespace-nowrap",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--primary)] text-[var(--text-inverse)] font-semibold",
          "hover:bg-[var(--primary-hover)]",
          "shadow-sm",
        ].join(" "),
        primary: [
          "border border-[rgba(63,224,193,0.14)] bg-[rgba(8,88,71,0.76)] text-[var(--primary)]",
          "hover:bg-[rgba(9,100,81,0.82)]",
          "shadow-[0_14px_30px_rgba(0,0,0,0.14)]",
        ].join(" "),
        accent: [
          "border border-[rgba(217,70,239,0.12)] bg-[rgba(95,31,128,0.7)] text-[#efb1ff]",
          "hover:bg-[rgba(111,40,147,0.76)]",
          "shadow-[0_14px_30px_rgba(0,0,0,0.14)]",
        ].join(" "),
        outline: [
          "border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]",
          "hover:bg-[var(--surface-hover)] hover:text-[var(--text)] hover:border-[var(--border-hover)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--text-secondary)]",
          "hover:bg-[var(--surface-hover)] hover:text-[var(--text)]",
        ].join(" "),
        destructive: [
          "bg-[var(--danger)] text-white",
          "hover:bg-red-600",
          "shadow-[0_0_16px_rgba(248,113,113,0.15)]",
        ].join(" "),
        success: [
          "border border-[rgba(63,224,193,0.14)] bg-[rgba(8,88,71,0.76)] text-[var(--primary)]",
          "hover:bg-[rgba(9,100,81,0.82)]",
          "shadow-[0_14px_30px_rgba(0,0,0,0.14)]",
        ].join(" "),
        link: [
          "bg-transparent p-0 h-auto text-[var(--primary)] underline-offset-4",
          "hover:underline",
        ].join(" "),
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-[var(--radius-sm)]",
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
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
