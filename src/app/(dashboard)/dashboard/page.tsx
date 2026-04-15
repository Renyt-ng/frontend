"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  Bookmark,
  Building2,
  Clock3,
  FileText,
  Gift,
  Heart,
  Mail,
  MessageCircle,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge, buttonVariants } from "@/components/ui";
import {
  DashboardContextualHelp,
  DashboardPanel,
  DashboardSectionHeading,
  DashboardSectionNav,
  MetricCard,
  MiniBarChart,
  StatusPanel,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  useAdminOverview,
  useAdminWhatsAppListingCreationReport,
  useMyProperties,
  useMyPropertyEngagementSummary,
  useReferralDashboard,
} from "@/lib/hooks";
import { formatAuditActor, formatEmailProvider } from "@/lib/adminUtils";
import { summarizeListingHealth } from "@/lib/utils";
import type { AdminOverview } from "@/types/admin";

type DashboardRole = "admin" | "agent" | "tenant";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ActionLink({
  href,
  children,
  variant = "dashboard",
}: {
  href: string;
  children: ReactNode;
  variant?: "dashboard" | "dashboardPrimary" | "dashboardGhost";
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size: "md" }))}>
      {children}
    </Link>
  );
}

function IntroPanel({ role, name }: { role: DashboardRole; name: string }) {
  const copy = {
    admin: {
      eyebrow: "Admin Workspace",
      title: `Welcome back, ${name}`,
      description:
        "Review queues, trust signals, and platform health without the noise.",
      badge: "Operational overview",
    },
    agent: {
      eyebrow: "Agent Workspace",
      title: `Welcome back, ${name}`,
      description:
        "Track listing health, referrals, and outcomes in one glance.",
      badge: "Business overview",
    },
    tenant: {
      eyebrow: "Account Workspace",
      title: `Welcome back, ${name}`,
      description:
        "Keep saved listings, referrals, and contact paths easy to reach.",
      badge: "Personal overview",
    },
  } as const;

  const currentCopy = copy[role];

  return (
    <DashboardPanel padding="lg" className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
            {currentCopy.eyebrow}
          </p>
          <h2 className="mt-3 text-[clamp(2rem,3vw,2.5rem)] font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
            {currentCopy.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--dashboard-text-secondary)]">
            {currentCopy.description}
          </p>
        </div>
        <Badge variant="dashboardAccent" className="w-fit">
          {currentCopy.badge}
        </Badge>
      </div>
    </DashboardPanel>
  );
}

function OverviewShell({
  items,
  children,
}: {
  items: Array<{ id: string; label: string; count?: number | string }>;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
      <DashboardSectionNav items={items} className="order-2 xl:order-1" />
      <div className="order-1 min-w-0 space-y-6 xl:order-2">{children}</div>
    </div>
  );
}

function AdminView({
  overview,
  listingReport,
  isLoading,
  isError,
  isListingReportLoading,
  isListingReportError,
}: {
  overview?: AdminOverview;
  listingReport?: import("@/types/admin").WhatsAppListingCreationReport;
  isLoading: boolean;
  isError: boolean;
  isListingReportLoading: boolean;
  isListingReportError: boolean;
}) {
  const metrics = overview?.metrics;
  const emailHealth = overview?.email_health;
  const activity = overview?.recent_activity ?? [];

  const pendingVerifications = metrics?.pending_verifications ?? 0;
  const degradedProviders = emailHealth?.degraded_count ?? 0;
  const totalListings = metrics?.total_listings ?? 0;
  const suspendedUsers = metrics?.suspended_users ?? 0;
  const sectionItems = [
    {
      id: "admin-priority-queues",
      label: "Priority queues",
      count: pendingVerifications,
    },
    {
      id: "admin-whatsapp-health",
      label: "WhatsApp health",
      count: listingReport?.summary.stale_tasks ?? 0,
    },
    {
      id: "admin-critical-activity",
      label: "Critical activity",
      count: activity.length,
    },
    {
      id: "admin-quick-actions",
      label: "Quick actions",
    },
  ];

  return (
    <OverviewShell items={sectionItems}>
      <section id="admin-priority-queues" className="scroll-mt-28 space-y-4">
        <DashboardPanel padding="lg" className="space-y-6">
          <DashboardSectionHeading
            title="Priority queues"
            description="Start with the queues that can block trust or safety."
            helper={
              <DashboardContextualHelp
                label="More information about admin priority queues"
                title="Why this section comes first"
              >
                This section keeps the most action-sensitive workflow signals together so admins do not need to scan the entire page before deciding what to review.
              </DashboardContextualHelp>
            }
            action={<Badge variant="dashboard">Today</Badge>}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Building2}
              label="Total listings"
              value={isLoading ? "..." : totalListings}
              meta="Listings in scope"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Pending verifications"
              value={isLoading ? "..." : pendingVerifications}
              meta="Top review queue"
              href="/dashboard/verifications"
              emphasis={pendingVerifications > 0 ? "highlight" : "default"}
            />
            <MetricCard
              icon={Mail}
              label="Degraded providers"
              value={isLoading ? "..." : degradedProviders}
              meta="Email paths needing attention"
              href="/dashboard/email-settings"
              emphasis={degradedProviders > 0 ? "warning" : "default"}
            />
            <MetricCard
              icon={Users}
              label="Suspended users"
              value={isLoading ? "..." : suspendedUsers}
              meta="Accounts needing follow-up"
              href="/dashboard/users"
              emphasis={suspendedUsers > 0 ? "warning" : "default"}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <DashboardPanel padding="lg" className="space-y-6">
              <DashboardSectionHeading
                title="Operational volume"
                description="Key counts shaping trust today."
                helper={
                  <DashboardContextualHelp
                    label="More information about operational volume"
                    title="How to read this"
                  >
                    Treat this chart as a directional summary. Queue and incident panels still take priority over passive reporting when choosing what to work on next.
                  </DashboardContextualHelp>
                }
              />
              <MiniBarChart
                ariaLabel="Admin operational metrics chart"
                isLoading={isLoading}
                values={[
                  totalListings,
                  pendingVerifications,
                  degradedProviders,
                  suspendedUsers,
                ]}
                labels={["List", "Verify", "Email", "Safety"]}
                highlightIndex={1}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
                    Primary provider
                  </p>
                  <p className="mt-3 text-base font-semibold text-[var(--dashboard-text-primary)]">
                    {emailHealth?.primary_provider
                      ? formatEmailProvider(emailHealth.primary_provider)
                      : "Not configured"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    {emailHealth?.primary_status?.replace(/_/g, " ") ?? "Unknown"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
                    Fallback readiness
                  </p>
                  <p className="mt-3 text-base font-semibold text-[var(--dashboard-text-primary)]">
                    {emailHealth?.fallback_ready_count ?? 0} provider(s)
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Degraded: {degradedProviders}
                  </p>
                </div>
              </div>
            </DashboardPanel>

            <div className="space-y-4">
              <StatusPanel
                icon={ShieldAlert}
                tone={pendingVerifications > 0 ? "accent" : "default"}
                title="Verification queue"
                badgeLabel={pendingVerifications > 0 ? "Needs review" : "Stable"}
                description={
                  pendingVerifications > 0
                    ? `${pendingVerifications} item(s) are waiting for review.`
                    : "No verification backlog right now."
                }
                action={
                  <ActionLink href="/dashboard/verifications" variant="dashboardPrimary">
                    Review queue
                  </ActionLink>
                }
              />
              <StatusPanel
                icon={Mail}
                tone={degradedProviders > 0 ? "critical" : "default"}
                badgeLabel={degradedProviders > 0 ? "Attention" : "Healthy"}
                title="Email delivery health"
                description={
                  degradedProviders > 0
                    ? `${degradedProviders} provider(s) are degraded. Check routing and fallback.`
                    : "Primary and fallback coverage are stable."
                }
                action={<ActionLink href="/dashboard/email-settings">Open email settings</ActionLink>}
              />
              <StatusPanel
                icon={AlertTriangle}
                tone={suspendedUsers > 0 ? "warning" : "default"}
                badgeLabel={suspendedUsers > 0 ? "Review users" : "No blockers"}
                title="Identity and safety"
                description={
                  suspendedUsers > 0
                    ? `${suspendedUsers} suspended account(s) may need follow-up.`
                    : "No active user safety blockers right now."
                }
                action={<ActionLink href="/dashboard/users">Manage users</ActionLink>}
              />
            </div>
          </div>
        </DashboardPanel>
      </section>

      <section id="admin-whatsapp-health" className="scroll-mt-28 space-y-4">
        <DashboardPanel padding="lg" className="space-y-6">
          <DashboardSectionHeading
            title="WhatsApp listing health"
            description="Stale create-listing drafts, reminder pressure, and publish-ready inventory without leaving the main admin dashboard."
            helper={
              <DashboardContextualHelp
                label="More information about WhatsApp listing health"
                title="Why this belongs here"
              >
                This section surfaces the highest-signal WhatsApp workflow risks early, so admins can spot reminder drift and stuck draft patterns before opening the detailed operations page.
              </DashboardContextualHelp>
            }
            action={<ActionLink href="/dashboard/whatsapp-settings">Open WhatsApp operations</ActionLink>}
          />

          {isListingReportError ? (
            <StatusPanel
              icon={MessageCircle}
              tone="warning"
              title="WhatsApp reporting unavailable"
              badgeLabel="Degraded"
              description="Create-listing reminder health could not be loaded. Open WhatsApp operations to inspect the detailed surface."
              action={<ActionLink href="/dashboard/whatsapp-settings">Inspect WhatsApp operations</ActionLink>}
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={MessageCircle}
                  label="Active create-listing tasks"
                  value={isListingReportLoading ? "..." : listingReport?.summary.active_tasks ?? 0}
                  meta={`${listingReport?.summary.offered_tasks ?? 0} offered`}
                  href="/dashboard/whatsapp-settings#wa-listing-report"
                />
                <MetricCard
                  icon={AlertTriangle}
                  label="Stale drafts"
                  value={isListingReportLoading ? "..." : listingReport?.summary.stale_tasks ?? 0}
                  meta="Need reminder or manual recovery"
                  href="/dashboard/whatsapp-settings#wa-listing-report"
                  emphasis={(listingReport?.summary.stale_tasks ?? 0) > 0 ? "warning" : "default"}
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Publish ready"
                  value={isListingReportLoading ? "..." : listingReport?.summary.publish_ready_drafts ?? 0}
                  meta="Drafts that can move straight into publish"
                  href="/dashboard/whatsapp-settings#wa-listing-report"
                  emphasis={(listingReport?.summary.publish_ready_drafts ?? 0) > 0 ? "highlight" : "default"}
                />
                <MetricCard
                  icon={Clock3}
                  label="Reminders in 24h"
                  value={isListingReportLoading ? "..." : listingReport?.summary.reminders_sent_last_24h ?? 0}
                  meta="Recent reminder volume"
                  href="/dashboard/whatsapp-settings#wa-listing-report"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <DashboardPanel padding="lg" className="space-y-6">
                  <DashboardSectionHeading
                    title="Reminder pressure"
                    description="How current task volume is aging across the create-listing workflow."
                  />
                  <MiniBarChart
                    ariaLabel="Admin WhatsApp create-listing age distribution"
                    isLoading={isListingReportLoading}
                    values={listingReport?.charts.age_buckets.map((item) => item.count) ?? [0, 0, 0, 0]}
                    labels={listingReport?.charts.age_buckets.map((item) => item.label) ?? ["<3h", "3-12h", "12-24h", "24h+"]}
                    highlightIndex={3}
                    emptyMessage="No create-listing activity has accumulated yet."
                  />
                </DashboardPanel>

                <div className="space-y-4">
                  <StatusPanel
                    icon={AlertTriangle}
                    tone={(listingReport?.summary.stale_tasks ?? 0) > 0 ? "warning" : "default"}
                    badgeLabel={(listingReport?.summary.stale_tasks ?? 0) > 0 ? "Watch stale drafts" : "Stable"}
                    title="Stale draft risk"
                    description={
                      (listingReport?.summary.stale_tasks ?? 0) > 0
                        ? `${listingReport?.summary.stale_tasks ?? 0} WhatsApp draft(s) are currently due for recovery or reminder.`
                        : "No stale WhatsApp create-listing drafts are due right now."
                    }
                    action={<ActionLink href="/dashboard/whatsapp-settings#wa-listing-report">Review draft watchlist</ActionLink>}
                  />
                  <StatusPanel
                    icon={FileText}
                    tone="accent"
                    badgeLabel="Top blocker"
                    title="Most common missing field"
                    description={
                      listingReport?.charts.pending_field_hotspots[0]
                        ? `${listingReport.charts.pending_field_hotspots[0].field.replace(/_/g, " ")} appears on ${listingReport.charts.pending_field_hotspots[0].count} active draft(s).`
                        : "No repeated missing-field hotspot is standing out right now."
                    }
                    action={<ActionLink href="/dashboard/whatsapp-settings#wa-listing-report">Open blocker breakdown</ActionLink>}
                  />
                </div>
              </div>
            </>
          )}
        </DashboardPanel>
      </section>

      <section id="admin-critical-activity" className="scroll-mt-28">
        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Recent critical activity"
            description="High-signal actions across admin workflows."
            helper={
              <DashboardContextualHelp
                label="More information about recent critical activity"
                title="What belongs here"
              >
                Show only the actions that help an admin understand trust-impacting changes quickly. Deeper audit detail still lives in the full audit log.
              </DashboardContextualHelp>
            }
            action={<ActionLink href="/dashboard/audit-log">Open audit log</ActionLink>}
          />

          {isError ? (
            <StatusPanel
              icon={AlertTriangle}
              tone="critical"
              title="Overview unavailable"
              description="Admin overview data could not be loaded. Check API health or refresh this page."
            />
          ) : activity.length > 0 ? (
            <div className="space-y-3">
              {activity.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-4"
                >
                  <p className="text-sm font-medium text-[var(--dashboard-text-primary)]">
                    {formatAuditActor(entry)}
                    <span className="font-normal text-[var(--dashboard-text-secondary)]">
                      {" "}
                      {entry.action.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-[var(--dashboard-text-tertiary)]">
                    {entry.entity_type} · {formatTimestamp(entry.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-alt)] px-5 py-8 text-sm text-[var(--dashboard-text-secondary)]">
              No recent admin activity yet.
            </div>
          )}
        </DashboardPanel>
      </section>

      <section id="admin-quick-actions" className="scroll-mt-28">
        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Quick actions"
            description="Go straight to the controls that need repeat attention."
            helper={
              <DashboardContextualHelp
                label="More information about admin quick actions"
                title="How these should behave"
              >
                Quick actions should route into focused workflows, not into long ambiguous surfaces. Keep only the actions admins need repeatedly.
              </DashboardContextualHelp>
            }
          />
          <div className="grid gap-3">
            <ActionLink href="/dashboard/verifications" variant="dashboardPrimary">
              <ShieldCheck className="h-4 w-4" />
              Review verifications
            </ActionLink>
            <ActionLink href="/dashboard/verifications?tab=properties">
              <Building2 className="h-4 w-4" />
              Review property verifications
            </ActionLink>
            <ActionLink href="/dashboard/users">
              <Users className="h-4 w-4" />
              Manage users
            </ActionLink>
            <ActionLink href="/dashboard/email-settings">
              <Mail className="h-4 w-4" />
              Configure email health
            </ActionLink>
            <ActionLink href="/dashboard/email-settings#email-advanced">
              <AlertTriangle className="h-4 w-4" />
              Review queue diagnostics
            </ActionLink>
            <ActionLink href="/dashboard/referrals">
              <Gift className="h-4 w-4" />
              Review referrals
            </ActionLink>
          </div>
        </DashboardPanel>
      </section>
    </OverviewShell>
  );
}

function AgentView() {
  const propertiesQuery = useMyProperties();
  const properties = propertiesQuery.data?.data ?? [];
  const summary = summarizeListingHealth(properties);
  const sectionItems = [
    {
      id: "agent-focus-now",
      label: "Focus now",
      count: summary.needs_confirmation,
    },
    {
      id: "agent-next-steps",
      label: "Next steps",
    },
    {
      id: "agent-quick-actions",
      label: "Quick actions",
    },
  ];

  return (
    <OverviewShell items={sectionItems}>
      <section id="agent-focus-now" className="scroll-mt-28 space-y-4">
        <DashboardPanel padding="lg" className="space-y-6">
          <DashboardSectionHeading
            title="Focus now"
            description="Start with listing health, then keep trust signals visible."
            helper={
              <DashboardContextualHelp
                label="More information about agent focus"
                title="Why these cards come first"
              >
                The overview should help an agent decide what needs attention without scanning a long report. Prioritize freshness, blocked listings, and operational trust cues.
              </DashboardContextualHelp>
            }
            action={<Badge variant="dashboard">This month</Badge>}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Building2}
              label="Active listings"
              value={propertiesQuery.isLoading ? "..." : summary.active}
              meta="Fresh and visible"
              href="/dashboard/properties"
              emphasis="highlight"
            />
            <MetricCard
              icon={Clock3}
              label="Needs confirmation"
              value={propertiesQuery.isLoading ? "..." : summary.needs_confirmation}
              meta="At risk of going stale"
              href="/dashboard/properties"
            />
            <MetricCard
              icon={FileText}
              label="Drafts"
              value={propertiesQuery.isLoading ? "..." : summary.draft}
              meta="Still blocked from publish"
              href="/dashboard/properties"
            />
            <MetricCard
              icon={Archive}
              label="Final outcomes"
              value={propertiesQuery.isLoading ? "..." : summary.final_outcomes}
              meta="Closed with source tracked"
              href="/dashboard/properties"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <DashboardPanel padding="lg" className="space-y-6">
              <DashboardSectionHeading
                title="Business rhythm"
                description="Availability, progress, and closes at a glance."
                helper={
                  <DashboardContextualHelp
                    label="More information about business rhythm"
                    title="How to read this"
                  >
                    This chart is a compact pulse check. Use the listing health page for the full grouped workflow and the exact actions needed for each property.
                  </DashboardContextualHelp>
                }
              />
              <MiniBarChart
                ariaLabel="Agent business metrics chart"
                isLoading={propertiesQuery.isLoading}
                values={[
                  summary.active,
                  summary.needs_confirmation,
                  summary.draft,
                  summary.final_outcomes,
                ]}
                labels={["Active", "Due", "Draft", "Close"]}
                highlightIndex={1}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
                    Listing freshness
                  </p>
                  <p className="mt-3 text-base font-semibold text-[var(--dashboard-text-primary)]">
                    Keep confirmation windows current
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Confirmation matters more than cosmetic recency.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
                    Outcome integrity
                  </p>
                  <p className="mt-3 text-base font-semibold text-[var(--dashboard-text-primary)]">
                    Renyt and off-platform closes stay distinct
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Keep Renyt and off-platform closes separate.
                  </p>
                </div>
              </div>
            </DashboardPanel>

            <div className="space-y-4">
              <StatusPanel
                icon={ShieldCheck}
                tone="accent"
                badgeLabel="Trust cue"
                title="Verification status"
                description="Keep verification and listing evidence complete."
                action={
                  <ActionLink href="/dashboard/agent-verification" variant="dashboardPrimary">
                    View verification
                  </ActionLink>
                }
              />
              <StatusPanel
                icon={TrendingUp}
                title="Listings workflow"
                badgeLabel="Action-ready"
                description="Confirm stale listings and record close source clearly."
                action={<ActionLink href="/dashboard/properties">Open listing health</ActionLink>}
              />
              <StatusPanel
                icon={Gift}
                title="Referral visibility"
                badgeLabel="Keep traceable"
                description="Keep referral performance visible without letting it dominate operations."
                action={<ActionLink href="/dashboard/referrals">Open referrals</ActionLink>}
              />
            </div>
          </div>
        </DashboardPanel>
      </section>

      <section id="agent-next-steps" className="scroll-mt-28">
        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Operational next steps"
            description="Keep attention on action, not vanity metrics."
            helper={
              <DashboardContextualHelp
                label="More information about operational next steps"
                title="What belongs here"
              >
                Keep this list short and action-led. Each item should point the agent toward a concrete operational decision, not toward passive reading.
              </DashboardContextualHelp>
            }
          />
          <div className="space-y-3">
            {[
              "Confirm overdue listings before trust drops.",
              "Finish blocked drafts so they can go live.",
              "Record each close with the right source.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-4"
              >
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--dashboard-accent)]" />
                <p className="text-sm text-[var(--dashboard-text-secondary)]">{item}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </section>

      <section id="agent-quick-actions" className="scroll-mt-28">
        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Quick actions"
            description="Fast paths into listing health, referrals, and settings."
            helper={
              <DashboardContextualHelp
                label="More information about agent quick actions"
                title="How these should feel"
              >
                Quick actions should feel procedural and obvious. Avoid long explanation around them and route into focused dashboard surfaces instead of mixed-purpose pages.
              </DashboardContextualHelp>
            }
          />
          <div className="grid gap-3">
            <ActionLink href="/dashboard/properties/new" variant="dashboardPrimary">
              <Building2 className="h-4 w-4" />
              Add new listing
            </ActionLink>
            <ActionLink href="/dashboard/properties">
              <Clock3 className="h-4 w-4" />
              Review listing health
            </ActionLink>
            <ActionLink href="/dashboard/agent-verification">
              <ShieldCheck className="h-4 w-4" />
              View verification
            </ActionLink>
            <ActionLink href="/dashboard/referrals">
              <Gift className="h-4 w-4" />
              Open referrals
            </ActionLink>
            <ActionLink href="/dashboard/settings">
              <Settings className="h-4 w-4" />
              Account settings
            </ActionLink>
          </div>
        </DashboardPanel>
      </section>
    </OverviewShell>
  );
}

function TenantView() {
  const engagementQuery = useMyPropertyEngagementSummary();
  const referralQuery = useReferralDashboard({ retry: false });
  const engagementSummary = engagementQuery.data?.data ?? {
    wishlist_count: 0,
    like_count: 0,
    total_count: 0,
  };
  const referralSummary = referralQuery.data?.data.summary ?? {
    share_count: 0,
    qualified_referrals: 0,
  };
  const sectionItems = [
    {
      id: "user-activity",
      label: "Activity",
      count: engagementSummary.total_count,
    },
    {
      id: "user-actions",
      label: "Actions",
    },
  ];

  return (
    <OverviewShell items={sectionItems}>
      <section id="user-activity" className="scroll-mt-28 space-y-4">
        <DashboardPanel padding="lg" className="space-y-6">
          <DashboardSectionHeading
            title="Saved and shared activity"
            description="Track browsing engagement and referral momentum."
            action={<Badge variant="dashboard">Live activity</Badge>}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Bookmark}
              label="Saved listings"
              value={engagementQuery.isLoading ? "..." : engagementSummary.wishlist_count}
              meta="Listings to revisit"
              href="/search"
              emphasis="highlight"
            />
            <MetricCard
              icon={Heart}
              label="Liked listings"
              value={engagementQuery.isLoading ? "..." : engagementSummary.like_count}
              meta="Quick reactions while browsing"
              href="/search"
            />
            <MetricCard
              icon={Gift}
              label="Referral shares"
              value={referralQuery.isLoading ? "..." : referralSummary.share_count}
              meta="Links you have shared"
              href="/dashboard/referrals"
            />
            <MetricCard
              icon={TrendingUp}
              label="Qualified referrals"
              value={referralQuery.isLoading ? "..." : referralSummary.qualified_referrals}
              meta="Tracked outcomes from shares"
              href="/dashboard/referrals"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <DashboardPanel padding="lg" className="space-y-6">
              <DashboardSectionHeading
                title="Engagement rhythm"
                description="Saved listings, likes, and referral traction in one scan."
              />
              <MiniBarChart
                ariaLabel="User engagement metrics chart"
                isLoading={engagementQuery.isLoading || referralQuery.isLoading}
                values={[
                  engagementSummary.wishlist_count,
                  engagementSummary.like_count,
                  referralSummary.share_count,
                  referralSummary.qualified_referrals,
                ]}
                labels={["Saved", "Liked", "Shared", "Qualified"]}
                highlightIndex={0}
                emptyMessage="No saved, liked, or shared activity yet. Browse listings to start building a shortlist."
              />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
                    Saved activity
                  </p>
                  <p className="mt-3 text-base font-semibold text-[var(--dashboard-text-primary)]">
                    {engagementQuery.isLoading
                      ? "Loading activity"
                      : `${engagementSummary.total_count} engagement signal(s)`}
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Saves and likes keep promising listings easy to find.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
                    Referral visibility
                  </p>
                  <p className="mt-3 text-base font-semibold text-[var(--dashboard-text-primary)]">
                    {referralQuery.isLoading
                      ? "Loading referrals"
                      : `${referralSummary.qualified_referrals} qualified from ${referralSummary.share_count} share(s)`}
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Referral activity stays visible without overpowering browsing.
                  </p>
                </div>
              </div>
            </DashboardPanel>

            <div className="space-y-4">
              <StatusPanel
                icon={Search}
                tone="accent"
                badgeLabel="Primary"
                title="Browse properties"
                description="Search active listings, save promising ones, and message agents when ready."
                action={
                  <ActionLink href="/search" variant="dashboardPrimary">
                    Browse properties
                  </ActionLink>
                }
              />
              <StatusPanel
                icon={Gift}
                title="Referral activity"
                badgeLabel="Visible"
                description="Keep referral sharing and progress easy to find."
                action={<ActionLink href="/dashboard/referrals">Open referrals</ActionLink>}
              />
              <StatusPanel
                icon={Settings}
                title="Account settings"
                badgeLabel="Manage"
                description="Update profile details and optional email reminders."
                action={<ActionLink href="/dashboard/settings">Open settings</ActionLink>}
              />
            </div>
          </div>
        </DashboardPanel>
      </section>

      <section id="user-actions" className="scroll-mt-28">
        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Quick actions"
            description="Keep browsing, referrals, and settings within reach."
          />
          <div className="grid gap-3">
            <ActionLink href="/search" variant="dashboardPrimary">
              <Search className="h-4 w-4" />
              Browse properties
            </ActionLink>
            <ActionLink href="/dashboard/referrals">
              <Gift className="h-4 w-4" />
              Open referrals
            </ActionLink>
            <ActionLink href="/dashboard/settings">
              <Settings className="h-4 w-4" />
              Account settings
            </ActionLink>
          </div>
        </DashboardPanel>
      </section>
    </OverviewShell>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = (user?.role ?? "tenant") as DashboardRole;
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  const overviewQuery = useAdminOverview({ enabled: role === "admin" });
  const listingReportQuery = useAdminWhatsAppListingCreationReport({ enabled: role === "admin" });
  const adminOverview = overviewQuery.data?.data;
  const listingReport = listingReportQuery.data?.data;

  return (
    <div className="space-y-6">
      <IntroPanel role={role} name={firstName} />

      {role === "admin" ? (
        <AdminView
          overview={adminOverview}
          listingReport={listingReport}
          isLoading={overviewQuery.isLoading}
          isError={overviewQuery.isError}
          isListingReportLoading={listingReportQuery.isLoading}
          isListingReportError={listingReportQuery.isError}
        />
      ) : role === "agent" ? (
        <AgentView />
      ) : (
        <TenantView />
      )}
    </div>
  );
}
