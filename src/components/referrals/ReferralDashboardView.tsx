"use client";

import Link from "next/link";
import { Gift, Share2, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { EmptyState } from "@/components/shared/EmptyState";
import { useReferralDashboard } from "@/lib/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  ReferralDashboardActivity,
  ReferralDashboardSummary,
  ReferralEventStatus,
  ReferralPropertyPerformance,
} from "@/types";

function statusVariant(status: ReferralEventStatus) {
  switch (status) {
    case "potential":
      return "pending" as const;
    case "under_review":
      return "info" as const;
    case "confirmed":
      return "verified" as const;
    case "paid":
      return "active" as const;
    case "rejected":
      return "rejected" as const;
  }
}

function statusLabel(status: ReferralEventStatus) {
  if (status === "under_review") {
    return "Under review";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function summaryCards(summary: ReferralDashboardSummary) {
  return [
    {
      key: "potential",
      label: "Potential earnings",
      value: formatCurrency(summary.potential_earnings),
      color: "bg-amber-50 text-[var(--color-pending)]",
      icon: Wallet,
    },
    {
      key: "confirmed",
      label: "Confirmed earnings",
      value: formatCurrency(summary.confirmed_earnings),
      color: "bg-emerald-50 text-[var(--color-emerald)]",
      icon: TrendingUp,
    },
    {
      key: "paid",
      label: "Paid out",
      value: formatCurrency(summary.paid_earnings),
      color: "bg-blue-50 text-[var(--color-deep-slate-blue)]",
      icon: Gift,
    },
    {
      key: "qualified",
      label: "Qualified referrals",
      value: summary.qualified_referrals,
      color: "bg-sky-50 text-sky-700",
      icon: Share2,
    },
  ];
}

function ProgressRail({ summary }: { summary: ReferralDashboardSummary }) {
  const segments = [
    { key: "potential", label: "Potential", amount: summary.potential_earnings, color: "bg-amber-200" },
    { key: "under_review", label: "Review", amount: summary.under_review_earnings, color: "bg-sky-200" },
    { key: "confirmed", label: "Confirmed", amount: summary.confirmed_earnings, color: "bg-emerald-300" },
    { key: "paid", label: "Paid", amount: summary.paid_earnings, color: "bg-[var(--color-emerald)]" },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.amount, 0) || 1;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Earnings progress
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            See how your referral earnings are moving from potential to paid.
          </p>
        </div>
        <div className="overflow-hidden rounded-full bg-gray-100">
          <div className="flex h-3 w-full">
            {segments.map((segment) => (
              <div
                key={segment.key}
                className={segment.color}
                style={{ width: `${(segment.amount / total) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((segment) => (
            <div key={segment.key} className="rounded-2xl border border-[var(--color-border)] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                {segment.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                {formatCurrency(segment.amount)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityList({ activities }: { activities: ReferralDashboardActivity[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<Gift className="h-7 w-7" />}
            title="No referral activity yet"
            description="Share a property from any detail page to start tracking visits and qualified messages."
            action={
              <Link href="/search">
                <Button>Browse properties</Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Every earning item shows status, trigger, and calculation details.
          </p>
        </div>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-2xl border border-[var(--color-border)] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {activity.property_title}
                    </p>
                    {activity.property_is_verified ? <Badge variant="verified">Verified</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {activity.property_area} · {formatDate(activity.event_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(activity.amount)}
                  </p>
                  <Badge variant={statusVariant(activity.status)}>
                    {statusLabel(activity.status)}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 grid gap-3 text-sm text-[var(--color-text-secondary)] sm:grid-cols-2">
                <p>
                  {activity.commission_type === "percentage"
                    ? `${activity.commission_value}% of ${activity.commission_basis_label ?? "eligible amount"}`
                    : "Fixed referral earning"}
                </p>
                <p className="sm:text-right">Source: {activity.source_channel.replace(/_/g, " ")}</p>
              </div>

              {activity.campaign_name ? (
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                  Campaign: {activity.campaign_name}
                </p>
              ) : null}

              {activity.rejection_reason ? (
                <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                  {activity.rejection_reason}
                </div>
              ) : null}

              {activity.admin_note ? (
                <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  {activity.admin_note}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PropertyPerformanceList({
  properties,
}: {
  properties: ReferralPropertyPerformance[];
}) {
  if (properties.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<Share2 className="h-7 w-7" />}
            title="No shared properties yet"
            description="Your best-performing shared listings will appear here once you start using Share and Earn."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Top shared properties
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Compare which listings are generating the most shares, qualified messages, and earnings.
          </p>
        </div>
        <div className="space-y-3">
          {properties.map((property) => (
            <div
              key={property.property_id}
              className="rounded-2xl border border-[var(--color-border)] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {property.property_title}
                    </p>
                    {property.property_is_verified ? (
                      <Badge variant="verified">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {property.property_area} · {property.property_status}
                  </p>
                </div>
                <Link href={`/properties/${property.property_id}`}>
                  <Button variant="secondary" size="sm">
                    Share again
                  </Button>
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Shares
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                    {property.share_count}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Qualified messages
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                    {property.qualified_messages}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Potential
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(property.potential_earnings)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Confirmed + Paid
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(property.confirmed_earnings + property.paid_earnings)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReferralDashboardView() {
  const dashboardQuery = useReferralDashboard();

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-64 animate-pulse rounded bg-gray-100" />
            <div className="flex gap-2">
              <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />
              <div className="h-6 w-28 animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
          <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-100" />
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-[var(--color-rejected)]">
          Could not load your referral dashboard right now.
        </CardContent>
      </Card>
    );
  }

  const dashboard = dashboardQuery.data?.data;

  if (!dashboard?.profile) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<Gift className="h-7 w-7" />}
            title="Start earning by sharing"
            description="Open any property detail page and use Share and Earn to join the referral program, generate your link, and track qualified messages here."
            action={
              <Link href="/search">
                <Button>Browse properties</Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const summary = summaryCards(dashboard.summary);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
            Referral dashboard
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--color-text-primary)]">
            Share properties and track earnings clearly
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="info">Code: {dashboard.profile.referral_code}</Badge>
            <Badge variant="verified">Transparent tracking</Badge>
          </div>
        </div>
        <Link href="/search">
          <Button>
            <Share2 className="h-4 w-4" />
            Share a property
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {summary.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{card.label}</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-2 p-5">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            How rent referral earnings are reviewed
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Potential earnings for rent listings are examples, not final payouts.
            For apartments, final earnings can increase when the confirmed lease duration is longer.
            For shortlets, final earnings can increase when the confirmed stay runs for more nights.
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Renyt reviews the final payout after the booking or lease duration is recorded.
          </p>
        </CardContent>
      </Card>

      <ProgressRail summary={dashboard.summary} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ActivityList activities={dashboard.recent_activity} />
        <PropertyPerformanceList properties={dashboard.property_performance} />
      </div>
    </div>
  );
}