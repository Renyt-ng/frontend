import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            "flex h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/20 disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-[var(--color-rejected)] focus:ring-[var(--color-rejected)]/20",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--color-rejected)]">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
