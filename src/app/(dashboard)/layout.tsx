"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Users,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout";
import { Avatar, Button } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["admin", "agent", "tenant"],
  },
  {
    href: "/dashboard/properties",
    label: "My Properties",
    icon: Building2,
    roles: ["agent", "admin"],
  },
  {
    href: "/dashboard/applications",
    label: "Applications",
    icon: FileText,
    roles: ["tenant", "agent", "admin"],
  },
  {
    href: "/dashboard/leases",
    label: "Leases",
    icon: ScrollText,
    roles: ["tenant", "agent", "admin"],
  },
  {
    href: "/dashboard/users",
    label: "User Management",
    icon: Users,
    roles: ["admin"],
  },
  {
    href: "/dashboard/verifications",
    label: "Verifications",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    href: "/dashboard/audit-log",
    label: "Audit Log",
    icon: ClipboardList,
    roles: ["admin"],
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "agent", "tenant"],
  },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: logoutStore } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = user?.role ?? "tenant";
  const visibleNav = NAV_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(userRole),
  );

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    logoutStore();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)]">
      {/* ─── Desktop Sidebar ─────────────────────── */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-[var(--color-border)] bg-white lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-[var(--color-border)] px-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-primary.png"
                alt="Renyt"
                width={100}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-4">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--color-deep-slate-blue)]/5 text-[var(--color-deep-slate-blue)]"
                      : "text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="border-t border-[var(--color-border)] p-4">
            <div className="mb-3 flex items-center gap-3">
              <Avatar fallback={user?.full_name ?? "User"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {user?.full_name ?? "User"}
                </p>
                <p className="truncate text-xs capitalize text-[var(--color-text-secondary)]">
                  {userRole}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-gray-50 hover:text-[var(--color-rejected)]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile sidebar overlay ──────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-[var(--color-border)] bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo-primary.png"
                  alt="Renyt"
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 p-4">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[var(--color-deep-slate-blue)]/5 text-[var(--color-deep-slate-blue)]"
                        : "text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-[var(--color-border)] p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-gray-50 hover:text-[var(--color-rejected)]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── Main content ────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-4 border-b border-[var(--color-border)] bg-white px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold text-[var(--color-text-primary)]">
            Dashboard
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
