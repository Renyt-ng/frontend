"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Gift,
  Mail,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  MessagesSquare,
} from "lucide-react";
import { Badge, buttonVariants } from "@/components/ui";
import {
  DashboardPanel,
  DashboardSectionHeading,
  MetricCard,
  MiniBarChart,
  StatusPanel,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAdminOverview, useAgentPropertyInquiries, useMyProperties } from "@/lib/hooks";
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
        "Review queues, monitor trust operations, and keep the marketplace procedurally calm.",
      badge: "Operational overview",
    },
    agent: {
      eyebrow: "Agent Workspace",
      title: `Welcome back, ${name}`,
      description:
        "Track listings, applications, leases, referrals, and commissions without dashboard clutter.",
      badge: "Business overview",
    },
    tenant: {
      eyebrow: "Account Workspace",
      title: `Welcome back, ${name}`,
      description:
        "Keep your property search, request progress, and lease steps in one clear place.",
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

function AdminView({
  overview,
  isLoading,
  isError,
}: {
  overview?: AdminOverview;
  isLoading: boolean;
  isError: boolean;
}) {
  const metrics = overview?.metrics;
  const emailHealth = overview?.email_health;
  const activity = overview?.recent_activity ?? [];

  const pendingVerifications = metrics?.pending_verifications ?? 0;
  const degradedProviders = emailHealth?.degraded_count ?? 0;
  const suspendedUsers = metrics?.suspended_users ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ShieldCheck}
          label="Pending verifications"
          value={isLoading ? "..." : pendingVerifications}
          meta="Highest-priority review queue"
          href="/dashboard/verifications"
          emphasis={pendingVerifications > 0 ? "highlight" : "default"}
        />
        <MetricCard
          icon={FileText}
          label="Active applications"
          value={isLoading ? "..." : metrics?.active_applications ?? 0}
          meta="Pipeline currently in motion"
          href="/dashboard/applications"
        />
        <MetricCard
          icon={ScrollText}
          label="Signed leases"
          value={isLoading ? "..." : metrics?.signed_leases ?? 0}
          meta="Completed agreements on record"
          href="/dashboard/leases"
        />
        <MetricCard
          icon={Users}
          label="Suspended users"
          value={isLoading ? "..." : suspendedUsers}
          meta="Accounts requiring caution or follow-up"
          href="/dashboard/users"
          emphasis={suspendedUsers > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <DashboardPanel padding="lg" className="space-y-6">
          <DashboardSectionHeading
            title="Operational volume"
            description="A quick read of the queues and outcomes currently shaping marketplace trust."
            action={<Badge variant="dashboard">Today</Badge>}
          />
          <MiniBarChart
            ariaLabel="Admin operational metrics chart"
            values={[
              metrics?.total_listings ?? 0,
              pendingVerifications,
              metrics?.active_applications ?? 0,
              metrics?.signed_leases ?? 0,
            ]}
            labels={["List", "Verify", "Apply", "Lease"]}
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
                ? `${pendingVerifications} verification item(s) are waiting for admin action.`
                : "No verification backlog right now. Audit history and provider health remain available below."
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
                ? `${degradedProviders} provider(s) are degraded. Check routing and fallback coverage.`
                : "Transactional email routing is calm. Primary and fallback coverage are currently stable."
            }
            action={
              <ActionLink href="/dashboard/email-settings">
                Open email settings
              </ActionLink>
            }
          />
          <StatusPanel
            icon={AlertTriangle}
            tone={suspendedUsers > 0 ? "warning" : "default"}
            badgeLabel={suspendedUsers > 0 ? "Review users" : "No blockers"}
            title="Identity and safety"
            description={
              suspendedUsers > 0
                ? `${suspendedUsers} suspended account(s) remain in the system and may require follow-up.`
                : "User safety actions are quiet. Continue monitoring audit history for unusual activity."
            }
            action={
              <ActionLink href="/dashboard/users">
                Manage users
              </ActionLink>
            }
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Recent critical activity"
            description="High-signal actions across admin workflows and system operations."
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
              No recent admin activity yet. This panel will summarize approvals, suspensions, rejections, and provider changes once actions occur.
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Quick actions"
            description="Jump directly into the queues and controls that keep the platform accountable."
          />
          <div className="grid gap-3">
            <ActionLink href="/dashboard/verifications" variant="dashboardPrimary">
              <ShieldCheck className="h-4 w-4" />
              Review verifications
            </ActionLink>
            <ActionLink href="/dashboard/users">
              <Users className="h-4 w-4" />
              Manage users
            </ActionLink>
            <ActionLink href="/dashboard/email-settings">
              <Mail className="h-4 w-4" />
              Configure email health
            </ActionLink>
            <ActionLink href="/dashboard/referrals">
              <Gift className="h-4 w-4" />
              Review referrals
            </ActionLink>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

function AgentView() {
  const propertiesQuery = useMyProperties();
  const inquiriesQuery = useAgentPropertyInquiries();
  const properties = propertiesQuery.data?.data ?? [];
  const inquiries = inquiriesQuery.data?.data ?? [];
  const summary = summarizeListingHealth(properties);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Active listings"
          value={propertiesQuery.isLoading ? "..." : summary.active}
          meta="Fresh, discovery-ready listings"
          href="/dashboard/properties"
          emphasis="highlight"
        />
        <MetricCard
          icon={Clock3}
          label="Needs confirmation"
          value={propertiesQuery.isLoading ? "..." : summary.needs_confirmation}
          meta="Listings at risk of going stale"
          href="/dashboard/properties"
        />
        <MetricCard
          icon={MessagesSquare}
          label="Inquiries"
          value={inquiriesQuery.isLoading ? "..." : inquiries.length}
          meta="Qualified demand awaiting follow-up"
          href="/dashboard/inquiries"
        />
        <MetricCard
          icon={Archive}
          label="Final outcomes"
          value={propertiesQuery.isLoading ? "..." : summary.final_outcomes}
          meta="Renyt-close and off-platform closes tracked separately"
          href="/dashboard/properties"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <DashboardPanel padding="lg" className="space-y-6">
          <DashboardSectionHeading
            title="Business rhythm"
            description="Availability health, inquiry flow, and final outcomes at a glance."
            action={<Badge variant="dashboard">This month</Badge>}
          />
          <MiniBarChart
            ariaLabel="Agent business metrics chart"
            values={[
              summary.active,
              summary.needs_confirmation,
              inquiries.length,
              summary.final_outcomes,
            ]}
            labels={["Active", "Due", "Inquire", "Close"]}
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
                Availability confirmation now drives trust more than cosmetic edits or recency tricks.
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
                Final outcomes need explicit source tracking so referral review and lifecycle reporting remain defensible.
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
            description="Keep your agent verification and listing evidence complete so tenants can trust what they see."
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
            description="Confirm availability before listings drift stale, and record whether closings happened through Renyt or off-platform."
            action={<ActionLink href="/dashboard/properties">Open listing health</ActionLink>}
          />
          <StatusPanel
            icon={MessagesSquare}
            title="Inquiry follow-up"
            badgeLabel={inquiries.length > 0 ? "Active" : "Quiet"}
            description={
              inquiries.length > 0
                ? `${inquiries.length} inquiry record(s) are available for follow-up across your listings.`
                : "No inquiry backlog right now. New inquiry records will appear here as qualified demand arrives."
            }
            action={<ActionLink href="/dashboard/inquiries">Open inquiries</ActionLink>}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Operational next steps"
            description="The dashboard stays calm by focusing on what needs action, not on vanity metrics."
          />
          <div className="space-y-3">
            {[
              "Confirm overdue listings before they fall out of trusted discovery.",
              "Review fresh inquiries while intent is still warm.",
              "Record final outcomes with the correct Renyt or off-platform source.",
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

        <DashboardPanel padding="lg" className="space-y-5">
          <DashboardSectionHeading
            title="Quick actions"
            description="Direct paths into listing health, inquiry follow-up, and account maintenance."
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
            <ActionLink href="/dashboard/inquiries">
              <MessagesSquare className="h-4 w-4" />
              Open inquiries
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
      </div>
    </div>
  );
}

function TenantView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={FileText}
          label="Requests"
          value={0}
          meta="Current housing requests"
          href="/dashboard/applications"
          emphasis="highlight"
        />
        <MetricCard
          icon={Clock3}
          label="Pending"
          value={0}
          meta="Responses you are waiting on"
          href="/dashboard/applications"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Approved"
          value={0}
          meta="Requests that can progress to lease"
          href="/dashboard/applications"
        />
        <MetricCard
          icon={ScrollText}
          label="Leases"
          value={0}
          meta="Signed and active lease records"
          href="/dashboard/leases"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <DashboardPanel padding="lg" className="space-y-6">
          <DashboardSectionHeading
            title="Request progress"
            description="A calm view of where your housing journey currently stands."
            action={<Badge variant="dashboard">Summary</Badge>}
          />
          <MiniBarChart
            ariaLabel="Tenant request progress chart"
            values={[0, 0, 0, 0]}
            labels={["Request", "Wait", "Approve", "Lease"]}
            highlightIndex={2}
          />
        </DashboardPanel>

        <div className="space-y-4">
          <StatusPanel
            icon={Search}
            tone="accent"
            badgeLabel="Next step"
            title="Continue browsing"
            description="Search, save, and compare listings while keeping your request progress visible in the same account space."
            action={
              <ActionLink href="/search" variant="dashboardPrimary">
                Browse properties
              </ActionLink>
            }
          />
          <StatusPanel
            icon={FileText}
            title="Request status"
            badgeLabel="Trackable"
            description="Pending, approved, and lease-ready states should remain easy to scan without visual overload."
            action={<ActionLink href="/dashboard/applications">View requests</ActionLink>}
          />
          <StatusPanel
            icon={Gift}
            title="Referral activity"
            badgeLabel="Optional"
            description="Referral history stays visible, but the interface avoids incentives feeling louder than core housing tasks."
            action={<ActionLink href="/dashboard/referrals">Open referrals</ActionLink>}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = (user?.role ?? "tenant") as DashboardRole;
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  const overviewQuery = useAdminOverview({ enabled: role === "admin" });
  const adminOverview = overviewQuery.data?.data;

  return (
    <div className="space-y-6">
      <IntroPanel role={role} name={firstName} />

      {role === "admin" ? (
        <AdminView
          overview={adminOverview}
          isLoading={overviewQuery.isLoading}
          isError={overviewQuery.isError}
        />
      ) : role === "agent" ? (
        <AgentView />
      ) : (
        <TenantView />
      )}
    </div>
  );
}
