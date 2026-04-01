"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, CircleAlert } from "lucide-react";
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
  helper?: ReactNode;
  action?: ReactNode;
}

export function DashboardSectionHeading({
  title,
  description,
  helper,
  action,
}: DashboardSectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-start gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
            {title}
          </h2>
          {helper ? <div className="pt-0.5">{helper}</div> : null}
        </div>
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

export interface DashboardSectionNavItem {
  id: string;
  label: string;
  count?: number | string;
}

interface DashboardSectionNavProps {
  items: DashboardSectionNavItem[];
  ariaLabel?: string;
  className?: string;
}

export function DashboardSectionNav({
  items,
  ariaLabel = "Page sections",
  className,
}: DashboardSectionNavProps) {
  const sectionIds = useMemo(
    () => items.map((item) => item.id).join("|"),
    [items],
  );
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    setActiveId(items[0]?.id ?? "");
  }, [sectionIds, items]);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.2, 0.5, 0.8],
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [sectionIds, items]);

  if (!items.length) {
    return null;
  }

  return (
    <nav
      aria-label={ariaLabel}
      className={cn("xl:sticky xl:top-24", className)}
    >
      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-col xl:gap-1 xl:overflow-visible xl:px-0">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveId(item.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex min-h-11 snap-start items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium whitespace-nowrap transition-all",
                isActive
                  ? "border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface)] text-[var(--dashboard-text-primary)] shadow-[var(--shadow-dashboard-sm)]"
                  : "border-transparent bg-[var(--dashboard-surface-alt)] text-[var(--dashboard-text-secondary)] hover:border-[var(--dashboard-border)] hover:text-[var(--dashboard-text-primary)]",
              )}
            >
              <span>{item.label}</span>
              {item.count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    isActive
                      ? "bg-[var(--dashboard-surface-alt)] text-[var(--dashboard-text-primary)]"
                      : "bg-[var(--dashboard-surface)] text-[var(--dashboard-text-tertiary)]",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

interface DashboardContextualHelpProps {
  label: string;
  title?: string;
  children: ReactNode;
  align?: "start" | "end";
}

export function DashboardContextualHelp({
  label,
  title,
  children,
  align = "start",
}: DashboardContextualHelpProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--dashboard-text-tertiary)] transition-colors hover:bg-[var(--dashboard-surface-alt)] hover:text-[var(--dashboard-accent)] focus-visible:bg-[var(--dashboard-surface-alt)] focus-visible:text-[var(--dashboard-accent)]"
      >
        <CircleAlert className="h-4 w-4" />
      </button>

      {open ? (
        <span
          role="tooltip"
          className={cn(
            "absolute top-full z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-[18px] border border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface)] p-4 text-left shadow-[var(--shadow-dashboard-md)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {title ? (
            <span className="block text-sm font-semibold text-[var(--dashboard-text-primary)]">
              {title}
            </span>
          ) : null}
          <span className="mt-1 block text-sm leading-6 text-[var(--dashboard-text-secondary)]">
            {children}
          </span>
        </span>
      ) : null}
    </span>
  );
}

interface MiniBarChartProps {
  values: number[];
  labels: string[];
  highlightIndex?: number;
  ariaLabel: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function MiniBarChart({
  values,
  labels,
  highlightIndex = values.length - 1,
  ariaLabel,
  isLoading = false,
  emptyMessage = "No volume yet. This panel will populate as dashboard activity grows.",
}: MiniBarChartProps) {
  const maxValue = Math.max(...values, 0);
  const hasData = maxValue > 0;

  return (
    <div role="img" aria-label={ariaLabel} className="space-y-4">
      <div className="flex min-h-48 items-end gap-3">
        {values.map((value, index) => {
          const rawHeight = isLoading
            ? 22 + index * 5
            : hasData
              ? Math.max((value / maxValue) * 100, 14)
              : 18;

          return (
            <div key={`${labels[index]}-${index}`} className="flex flex-1 flex-col items-center gap-3">
              <span className="min-h-6 text-sm font-semibold text-[var(--dashboard-text-primary)]">
                {isLoading ? "..." : value}
              </span>
              <div className="flex h-32 w-full items-end justify-center rounded-[18px] bg-[var(--dashboard-surface-alt)] px-2 py-2">
                <div
                  data-bar-state={value > 0 ? "value" : "empty"}
                  data-highlighted={index === highlightIndex ? "true" : "false"}
                  className={cn(
                    "w-full rounded-[12px] transition-all",
                    isLoading
                      ? "animate-pulse bg-[var(--dashboard-border-strong)]"
                      : value > 0
                        ? "bg-[var(--dashboard-accent)]"
                        : "bg-[color:rgba(30,58,95,0.28)]",
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
      {!isLoading && !hasData ? (
        <p className="text-xs text-[var(--dashboard-text-tertiary)]">
          {emptyMessage}
        </p>
      ) : null}
      {isLoading ? (
        <p className="text-xs text-[var(--dashboard-text-tertiary)]">
          Loading current volume.
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