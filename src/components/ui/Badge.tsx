import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700",
        verified: "bg-emerald-50 text-emerald-700",
        pending: "bg-amber-50 text-amber-700",
        rejected: "bg-red-50 text-red-700",
        archived: "bg-gray-100 text-gray-500",
        active: "bg-blue-50 text-blue-700",
        info: "bg-sky-50 text-sky-700",
        dashboard:
          "border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] text-[var(--dashboard-text-secondary)]",
        dashboardAccent:
          "border border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface)] text-[var(--dashboard-accent)]",
        dashboardSuccess:
          "border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.08)] text-[var(--dashboard-success)]",
        dashboardWarning:
          "border border-[color:rgba(183,121,31,0.18)] bg-[color:rgba(183,121,31,0.08)] text-[var(--dashboard-warning)]",
        dashboardCritical:
          "border border-[color:rgba(192,57,43,0.18)] bg-[color:rgba(192,57,43,0.08)] text-[var(--dashboard-critical)]",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}
