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
} from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";

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
              value={0}
              color="bg-blue-50 text-[var(--color-deep-slate-blue)]"
            />
            <StatCard
              icon={TrendingUp}
              label="Pending Verifications"
              value={0}
              color="bg-amber-50 text-[var(--color-pending)]"
            />
            <StatCard
              icon={FileText}
              label="Active Applications"
              value={0}
              color="bg-emerald-50 text-[var(--color-emerald)]"
            />
            <StatCard
              icon={ScrollText}
              label="Signed Leases"
              value={0}
              color="bg-purple-50 text-purple-600"
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
            </>
          )}
          {role === "admin" && (
            <>
              <Button>
                <TrendingUp className="h-4 w-4" />
                Review Verifications
              </Button>
              <Button variant="secondary">
                <FileText className="h-4 w-4" />
                View Audit Log
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Recent Activity
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Clock className="h-8 w-8 text-[var(--color-text-secondary)]" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              No recent activity
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {role === "agent"
                ? "Start by listing your first property."
                : "Start by searching for properties."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
