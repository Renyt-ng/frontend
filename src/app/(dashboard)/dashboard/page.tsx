"use client";

import Link from "next/link";
import {
  Building2,
  FileText,
  ScrollText,
  TrendingUp,
  ArrowRight,
  Eye,
  Clock,
  CheckCircle2,
  Mail,
  ShieldAlert,
  Gift,
} from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useAdminOverview } from "@/lib/hooks";
import { formatAuditActor, formatEmailProvider } from "@/lib/adminUtils";

/* ── Stat Card ─────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  href?: string;
}

function StatCard({ icon: Icon, label, value, color, href }: StatCardProps) {
  const content = (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {value}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        </div>
        {href && (
          <ArrowRight className="h-5 w-5 text-[var(--color-text-secondary)]" />
        )}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

/* ── Dashboard Page ────────────────────────────────────── */

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role ?? "tenant";
  const overviewQuery = useAdminOverview({ enabled: role === "admin" });
  const adminOverview = overviewQuery.data?.data;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Welcome back, {user?.full_name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          {role === "agent"
            ? "Manage your property listings and applications."
            : role === "admin"
              ? "Monitor the marketplace and manage users."
              : "Track your applications and leases."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {role === "agent" && (
          <>
            <StatCard
              icon={Building2}
              label="Active Listings"
              value={0}
              color="bg-blue-50 text-[var(--color-deep-slate-blue)]"
              href="/dashboard/properties"
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={0}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              icon={FileText}
              label="Pending Applications"
              value={0}
              color="bg-amber-50 text-[var(--color-pending)]"
              href="/dashboard/applications"
            />
            <StatCard
              icon={ScrollText}
              label="Active Leases"
              value={0}
              color="bg-emerald-50 text-[var(--color-emerald)]"
              href="/dashboard/leases"
            />
          </>
        )}

        {role === "tenant" && (
          <>
            <StatCard
              icon={FileText}
              label="My Applications"
              value={0}
              color="bg-blue-50 text-[var(--color-deep-slate-blue)]"
              href="/dashboard/applications"
            />
            <StatCard
              icon={Clock}
              label="Pending"
              value={0}
              color="bg-amber-50 text-[var(--color-pending)]"
            />
            <StatCard
              icon={CheckCircle2}
              label="Approved"
              value={0}
              color="bg-emerald-50 text-[var(--color-emerald)]"
            />
            <StatCard
              icon={ScrollText}
              label="Active Leases"
              value={0}
              color="bg-purple-50 text-purple-600"
              href="/dashboard/leases"
            />
          </>
        )}

        {role === "admin" && (
          <>
            <StatCard
              icon={Building2}
              label="Total Listings"
              value={adminOverview?.metrics.total_listings ?? 0}
              color="bg-blue-50 text-[var(--color-deep-slate-blue)]"
              href="/dashboard/verifications"
            />
            <StatCard
              icon={TrendingUp}
              label="Pending Verifications"
              value={adminOverview?.metrics.pending_verifications ?? 0}
              color="bg-amber-50 text-[var(--color-pending)]"
              href="/dashboard/verifications"
            />
            <StatCard
              icon={FileText}
              label="Active Applications"
              value={adminOverview?.metrics.active_applications ?? 0}
              color="bg-emerald-50 text-[var(--color-emerald)]"
              href="/dashboard/applications"
            />
            <StatCard
              icon={ScrollText}
              label="Signed Leases"
              value={adminOverview?.metrics.signed_leases ?? 0}
              color="bg-purple-50 text-purple-600"
              href="/dashboard/leases"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {role === "agent" && (
            <>
              <Link href="/dashboard/agent-verification">
                <Button variant="secondary">
                  <TrendingUp className="h-4 w-4" />
                  Verification Status
                </Button>
              </Link>
              <Link href="/dashboard/properties/new">
                <Button>
                  <Building2 className="h-4 w-4" />
                  Add New Listing
                </Button>
              </Link>
              <Link href="/dashboard/applications">
                <Button variant="secondary">
                  <FileText className="h-4 w-4" />
                  Review Applications
                </Button>
              </Link>
              <Link href="/dashboard/referrals">
                <Button variant="secondary">
                  <Gift className="h-4 w-4" />
                  Referral Dashboard
                </Button>
              </Link>
            </>
          )}
          {role === "tenant" && (
            <>
              <Link href="/search">
                <Button>
                  <Building2 className="h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
              <Link href="/dashboard/applications">
                <Button variant="secondary">
                  <FileText className="h-4 w-4" />
                  View Applications
                </Button>
              </Link>
              <Link href="/dashboard/referrals">
                <Button variant="secondary">
                  <Gift className="h-4 w-4" />
                  Referral Dashboard
                </Button>
              </Link>
            </>
          )}
          {role === "admin" && (
            <>
              <Link href="/dashboard/verifications">
                <Button>
                  <TrendingUp className="h-4 w-4" />
                  Review Verifications
                </Button>
              </Link>
              <Link href="/dashboard/users">
                <Button variant="secondary">
                  <ShieldAlert className="h-4 w-4" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/dashboard/email-settings">
                <Button variant="secondary">
                  <Mail className="h-4 w-4" />
                  Email Settings
                </Button>
              </Link>
              <Link href="/dashboard/referrals">
                <Button variant="secondary">
                  <Gift className="h-4 w-4" />
                  Review Referrals
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {role === "admin" && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Recent Activity
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Latest admin and system actions.
                  </p>
                </div>
                <Link href="/dashboard/audit-log" className="text-sm text-[var(--color-deep-slate-blue)]">
                  View all
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {adminOverview?.recent_activity?.length ? (
                  adminOverview.recent_activity.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-[var(--color-border)] px-4 py-3"
                    >
                      <p className="text-sm text-[var(--color-text-primary)]">
                        <span className="font-medium">{formatAuditActor(entry)}</span>{" "}
                        {entry.action.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        {entry.entity_type} · {new Date(entry.created_at).toLocaleString("en-NG")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    No recent admin activity yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Email Health
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Primary provider and fallback readiness.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Primary</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {adminOverview?.email_health.primary_provider
                      ? formatEmailProvider(adminOverview.email_health.primary_provider)
                      : "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Status</span>
                  <span className="font-medium capitalize text-[var(--color-text-primary)]">
                    {adminOverview?.email_health.primary_status?.replace(/_/g, " ") ?? "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Fallbacks ready</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {adminOverview?.email_health.fallback_ready_count ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Degraded providers</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {adminOverview?.email_health.degraded_count ?? 0}
                  </span>
                </div>
                <Link href="/dashboard/email-settings" className="block pt-2">
                  <Button variant="secondary" className="w-full">
                    <Mail className="h-4 w-4" />
                    Open Email Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          {role === "admin" ? "Workspace Notes" : "Recent Activity"}
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Clock className="h-8 w-8 text-[var(--color-text-secondary)]" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              {role === "admin" ? "Dashboard is live" : "No recent activity"}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {role === "admin"
                ? "Use the admin navigation to review verifications, inspect audit logs, manage property types, and configure transactional email."
                : role === "agent"
                ? "Start by listing your first property."
                : "Start by searching for properties."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
