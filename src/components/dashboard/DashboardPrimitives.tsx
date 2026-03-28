import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

type DashboardPanelTone = "default" | "accent" | "warning" | "critical";

interface DashboardPanelProps extends HTMLAttributes<HTMLDivElement> {
  tone?: DashboardPanelTone;
  padding?: "md" | "lg";
}

const panelToneStyles: Record<DashboardPanelTone, string> = {
  default:
    "bg-[var(--dashboard-surface)] border-[var(--dashboard-border)] text-[var(--dashboard-text-primary)] shadow-[var(--shadow-dashboard-sm)]",
  accent:
    "bg-[var(--dashboard-surface)] border-[var(--dashboard-border-strong)] text-[var(--dashboard-text-primary)] shadow-[var(--shadow-dashboard-md)]",
  warning:
    "bg-[color:rgba(183,121,31,0.03)] border-[color:rgba(183,121,31,0.18)] text-[var(--dashboard-text-primary)] shadow-[var(--shadow-dashboard-sm)]",
  critical:
    "bg-[color:rgba(192,57,43,0.03)] border-[color:rgba(192,57,43,0.18)] text-[var(--dashboard-text-primary)] shadow-[var(--shadow-dashboard-sm)]",
};

export function DashboardPanel({
  className,
  tone = "default",
  padding = "md",
  ...props
}: DashboardPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border",
        panelToneStyles[tone],
        padding === "lg" ? "p-6" : "p-5",
        className,
      )}
      {...props}
    />
  );
}

interface DashboardSectionHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function DashboardSectionHeading({
  title,
  description,
  action,
}: DashboardSectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  meta?: string;
  href?: string;
  icon: LucideIcon;
  emphasis?: "default" | "highlight" | "warning" | "critical";
}

export function MetricCard({
  label,
  value,
  meta,
  href,
  icon: Icon,
  emphasis = "default",
}: MetricCardProps) {
  const cardClassName = cn(
    "group block rounded-[20px] border bg-[var(--dashboard-surface)] p-5 transition-all duration-200",
    emphasis === "highlight"
      ? "border-[var(--dashboard-border-strong)] shadow-[var(--shadow-dashboard-md)]"
      : emphasis === "warning"
        ? "border-[color:rgba(183,121,31,0.18)] shadow-[var(--shadow-dashboard-sm)]"
        : emphasis === "critical"
          ? "border-[color:rgba(192,57,43,0.18)] shadow-[var(--shadow-dashboard-sm)]"
          : "border-[var(--dashboard-border)] shadow-[var(--shadow-dashboard-sm)]",
    href ? "hover:-translate-y-0.5 hover:border-[var(--dashboard-border-strong)] hover:shadow-[var(--shadow-dashboard-md)]" : "",
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--dashboard-text-secondary)]">
            {label}
          </p>
          <p className="mt-3 text-[clamp(1.875rem,2.2vw,2.25rem)] font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
            {value}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "h-5 w-5",
              emphasis === "warning"
                ? "text-[var(--dashboard-warning)]"
                : emphasis === "critical"
                  ? "text-[var(--dashboard-critical)]"
                  : emphasis === "highlight"
                    ? "text-[var(--dashboard-accent)]"
                    : "text-[var(--dashboard-text-secondary)]",
            )}
          />
          {href ? (
            <ArrowUpRight className="h-4 w-4 text-[var(--dashboard-text-tertiary)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          ) : null}
        </div>
      </div>
      {meta ? (
        <p className="mt-4 text-xs font-medium text-[var(--dashboard-text-tertiary)]">
          {meta}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

interface MiniBarChartProps {
  values: number[];
  labels: string[];
  highlightIndex?: number;
  ariaLabel: string;
}

export function MiniBarChart({
  values,
  labels,
  highlightIndex = values.length - 1,
  ariaLabel,
}: MiniBarChartProps) {
  const maxValue = Math.max(...values, 0);
  const hasData = maxValue > 0;

  return (
    <div role="img" aria-label={ariaLabel} className="space-y-4">
      <div className="flex h-40 items-end gap-3">
        {values.map((value, index) => {
          const rawHeight = hasData ? Math.max((value / maxValue) * 100, 14) : 22 + index * 5;
          return (
            <div key={`${labels[index]}-${index}`} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-full w-full items-end justify-center rounded-[18px] bg-[var(--dashboard-surface-alt)] px-2 py-2">
                <div
                  className={cn(
                    "w-full rounded-[12px] transition-all",
                    index === highlightIndex
                      ? "bg-[var(--dashboard-accent)]"
                      : "bg-[var(--dashboard-border-strong)]",
                  )}
                  style={{ height: `${rawHeight}%` }}
                />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--dashboard-text-tertiary)]">
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>
      {!hasData ? (
        <p className="text-xs text-[var(--dashboard-text-tertiary)]">
          No volume yet. This panel will populate as dashboard activity grows.
        </p>
      ) : null}
    </div>
  );
}

interface StatusPanelProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: DashboardPanelTone;
  badgeLabel?: string;
  action?: ReactNode;
}

export function StatusPanel({
  title,
  description,
  icon: Icon,
  tone = "default",
  badgeLabel,
  action,
}: StatusPanelProps) {
  const badgeVariant =
    tone === "critical"
      ? "dashboardCritical"
      : tone === "warning"
        ? "dashboardWarning"
        : tone === "accent"
          ? "dashboardAccent"
          : "dashboard";

  return (
    <DashboardPanel tone={tone} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon
            className={cn(
              "mt-0.5 h-5 w-5",
              tone === "critical"
                ? "text-[var(--dashboard-critical)]"
                : tone === "warning"
                  ? "text-[var(--dashboard-warning)]"
                  : tone === "accent"
                    ? "text-[var(--dashboard-accent)]"
                    : "text-[var(--dashboard-text-secondary)]",
            )}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--dashboard-text-primary)]">
                {title}
              </h3>
              {badgeLabel ? <Badge variant={badgeVariant}>{badgeLabel}</Badge> : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-secondary)]">
              {description}
            </p>
          </div>
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </DashboardPanel>
  );
}