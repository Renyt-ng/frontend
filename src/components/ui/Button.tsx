import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-deep-slate-blue)]/20 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-deep-slate-blue)] text-white hover:bg-[#162d4a] shadow-sm",
        secondary:
          "border border-[var(--color-deep-slate-blue)] text-[var(--color-deep-slate-blue)] bg-white hover:bg-gray-50",
        dashboardPrimary:
          "border border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white hover:bg-[var(--color-deep-slate-blue-hover)] hover:border-[var(--color-deep-slate-blue-hover)] shadow-sm",
        dashboard:
          "border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] text-[var(--dashboard-text-primary)] hover:border-[var(--dashboard-border-strong)] hover:bg-[var(--dashboard-surface-alt)]",
        success:
          "bg-[var(--color-emerald)] text-white hover:bg-emerald-600 shadow-sm",
        danger:
          "bg-[var(--color-rejected)] text-white hover:bg-red-600 shadow-sm",
        ghost:
          "bg-transparent text-[var(--color-text-secondary)] hover:bg-transparent hover:text-[var(--color-text-primary)]",
        dashboardGhost:
          "bg-transparent text-[var(--dashboard-text-secondary)] hover:bg-[var(--dashboard-surface-alt)] hover:text-[var(--dashboard-text-primary)]",
        link: "text-[var(--color-deep-slate-blue)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 rounded-lg px-3 text-sm",
        md: "h-11 rounded-xl px-5 text-sm",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, isLoading, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
