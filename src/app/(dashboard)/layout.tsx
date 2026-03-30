"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Building2,
  FileText,
  ScrollText,
  Settings,
  Mail,
  LogOut,
  Menu,
  X,
  Users,
  ShieldCheck,
  ClipboardList,
  Shapes,
  MapPinned,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useLogout } from "@/lib/hooks";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["admin", "agent", "tenant"],
    section: "Workspace",
  },
  {
    href: "/dashboard/properties",
    label: "Listing Health",
    icon: Building2,
    roles: ["agent", "admin"],
    section: "Workspace",
  },
  {
    href: "/dashboard/applications",
    label: "Applications",
    icon: FileText,
    roles: ["admin"],
    section: "Workspace",
  },
  {
    href: "/dashboard/agent-verification",
    label: "Agent Verification",
    icon: ShieldCheck,
    roles: ["agent"],
    section: "Workspace",
  },
  {
    href: "/dashboard/leases",
    label: "Leases",
    icon: ScrollText,
    roles: ["admin"],
    section: "Workspace",
  },
  {
    href: "/dashboard/referrals",
    label: "Referrals",
    icon: Gift,
    roles: ["tenant", "agent", "admin"],
    section: "Workspace",
  },
  {
    href: "/dashboard/users",
    label: "User Management",
    icon: Users,
    roles: ["admin"],
    section: "Operations",
  },
  {
    href: "/dashboard/verifications",
    label: "Verifications",
    icon: ShieldCheck,
    roles: ["admin"],
    section: "Operations",
  },
  {
    href: "/dashboard/audit-log",
    label: "Audit Log",
    icon: ClipboardList,
    roles: ["admin"],
    section: "Operations",
  },
  {
    href: "/dashboard/property-types",
    label: "Property Types",
    icon: Shapes,
    roles: ["admin"],
    section: "Operations",
  },
  {
    href: "/dashboard/locations",
    label: "Locations",
    icon: MapPinned,
    roles: ["admin"],
    section: "Operations",
  },
  {
    href: "/dashboard/email-settings",
    label: "Email Settings",
    icon: Mail,
    roles: ["admin"],
    section: "Operations",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "agent", "tenant"],
    section: "Account",
  },
] as const;

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

function getCurrentPageLabel(pathname: string) {
  return (
    NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href))?.label ??
    "Dashboard"
  );
}

function getRoleSubtitle(role: string) {
  switch (role) {
    case "admin":
      return "Trust operations, moderation, and platform oversight.";
    case "agent":
      return "Listing health, referrals, and operational outcomes.";
    default:
      return "Saved activity, agent contact, and account updates.";
  }
}

function getRoleBadgeLabel(role: string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "agent":
      return "Agent";
    default:
      return "User";
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = user?.role ?? "tenant";
  const visibleNav = NAV_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(userRole),
  );
  const navSections = Array.from(new Set(visibleNav.map((item) => item.section)));
  const pageLabel = getCurrentPageLabel(pathname);
  const dateLabel = new Intl.DateTimeFormat("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--dashboard-bg)] text-[var(--dashboard-text-primary)]">
      {/* ─── Desktop Sidebar ─────────────────────── */}
      <aside className="hidden h-dvh w-64 flex-shrink-0 overflow-hidden border-r border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-18 items-center border-b border-[var(--dashboard-border)] px-5">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-primary.png"
                alt="Renyt"
                width={176}
                height={40}
                className="h-auto w-[68px]"
                unoptimized
                priority
              />
            </Link>
          </div>

          {/* Nav */}
          <nav
            className="dashboard-sidebar-scroll flex-1 overflow-y-auto px-4 py-5"
            aria-label="Dashboard navigation"
          >
            <div className="space-y-6">
              {navSections.map((section) => (
                <div key={section} className="space-y-2">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
                    {section}
                  </p>
                  <div className="space-y-1">
                    {visibleNav
                      .filter((item) => item.section === section)
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = isNavItemActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
                              isActive
                                ? "bg-[var(--dashboard-surface-alt)] text-[var(--dashboard-text-primary)] ring-1 ring-[var(--dashboard-border-strong)]"
                                : "text-[var(--dashboard-text-secondary)] hover:bg-[var(--dashboard-surface-alt)] hover:text-[var(--dashboard-text-primary)]",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full transition-colors",
                                isActive
                                  ? "bg-[var(--dashboard-accent)]"
                                  : "bg-[var(--dashboard-border-strong)]",
                              )}
                            />
                            <Icon className="h-4.5 w-4.5" />
                            <span className="flex-1">{item.label}</span>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* User footer */}
          <div className="border-t border-[var(--dashboard-border)] p-4">
            <div className="rounded-[20px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
              <div className="mb-4 flex items-center gap-3">
                <Avatar src={user?.avatar_url} fallback={user?.full_name ?? "User"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--dashboard-text-primary)]">
                    {user?.full_name ?? "User"}
                  </p>
                  <p className="truncate text-xs text-[var(--dashboard-text-secondary)]">
                    {getRoleBadgeLabel(userRole)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 text-sm font-medium text-[var(--dashboard-text-secondary)] transition-colors hover:border-[color:rgba(192,57,43,0.18)] hover:text-[var(--dashboard-critical)]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Mobile sidebar overlay ──────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/18 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] shadow-[var(--shadow-dashboard-md)]">
            <div className="flex h-18 items-center justify-between border-b border-[var(--dashboard-border)] px-5">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo-primary.png"
                  alt="Renyt"
                  width={176}
                  height={40}
                  className="h-auto w-[64px]"
                  unoptimized
                />
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-2xl p-2 text-[var(--dashboard-text-secondary)] hover:bg-[var(--dashboard-surface-alt)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-6 overflow-y-auto p-4" aria-label="Dashboard navigation">
              {navSections.map((section) => (
                <div key={section} className="space-y-2">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
                    {section}
                  </p>
                  <div className="space-y-1">
                    {visibleNav
                      .filter((item) => item.section === section)
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = isNavItemActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
                              isActive
                                ? "bg-[var(--dashboard-surface-alt)] text-[var(--dashboard-text-primary)] ring-1 ring-[var(--dashboard-border-strong)]"
                                : "text-[var(--dashboard-text-secondary)] hover:bg-[var(--dashboard-surface-alt)] hover:text-[var(--dashboard-text-primary)]",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                isActive
                                  ? "bg-[var(--dashboard-accent)]"
                                  : "bg-[var(--dashboard-border-strong)]",
                              )}
                            />
                            <Icon className="h-4.5 w-4.5" />
                            <span className="flex-1">{item.label}</span>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-[var(--dashboard-border)] p-4">
              <button
                onClick={handleLogout}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-3 text-sm font-medium text-[var(--dashboard-text-secondary)] transition-colors hover:border-[color:rgba(192,57,43,0.18)] hover:text-[var(--dashboard-critical)]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── Main content ────────────────────────── */}
      <div className="flex h-dvh flex-1 flex-col overflow-hidden">
        <header className="hidden h-18 items-center justify-between border-b border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] px-8 lg:flex">
          {/* <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
              {pageLabel}
            </h1>
            <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
              {getRoleSubtitle(userRole)}
            </p>
          </div> */}
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 py-2 text-xs font-medium text-[var(--dashboard-text-secondary)]">
              <span className="text-[var(--dashboard-text-primary)]">
                {getRoleBadgeLabel(userRole)}
              </span>
            </div>
            <div className="rounded-full border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 py-2 text-xs font-medium text-[var(--dashboard-text-secondary)]">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                {dateLabel}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile header */}
        <header className="flex h-18 items-center gap-4 border-b border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-4 py-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-2xl border border-[var(--dashboard-border)] p-2 text-[var(--dashboard-text-secondary)] hover:bg-[var(--dashboard-surface-alt)]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
              {getRoleBadgeLabel(userRole)}
            </p>
            <span className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
              {pageLabel}
            </span>
          </div>
        </header>

        <main className="dashboard-content-scroll flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
