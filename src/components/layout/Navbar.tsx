"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Home,
  Building2,
  User,
  LogIn,
  LayoutDashboard,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildCurrentUrl } from "@/lib/authNavigation";
import { Container } from "./Container";
import { Avatar, Button } from "@/components/ui";
import { useLogout } from "@/lib/hooks";
import { useAuthStore } from "@/stores/authStore";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";

const NAV_LINKS = [
  { href: "/search", label: "Find a Home", icon: Search },
  { href: "/#how-it-works", label: "How it Works", icon: Home },
  { href: "/agents", label: "For Agents", icon: Building2 },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();
  const openOverlay = useAuthOverlayStore((state) => state.openOverlay);
  const currentUrl = buildCurrentUrl(pathname || "/", searchParams);
  const accountLabel = user?.full_name ?? "User";
  const accountSubLabel = user?.email ?? "Renyt account";

  function openAuth(mode: "login" | "register") {
    openOverlay({ mode, redirectTo: currentUrl });
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  async function handleLogout() {
    setAccountMenuOpen(false);
    setMobileOpen(false);
    await logout();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/95 backdrop-blur-sm">
      <Container>
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1">
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

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-gray-100 text-[var(--color-deep-slate-blue)]"
                    : "text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden items-center gap-3 md:flex">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => openAuth("register")}>
                  Get Started
                </Button>
              </>
            ) : (
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-left shadow-sm transition-colors hover:border-[var(--color-deep-slate-blue)]/25 hover:bg-slate-50"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                >
                  <Avatar
                    src={user?.avatar_url}
                    fallback={accountLabel}
                    size="sm"
                  />
                  <div className="min-w-0 pr-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {accountLabel}
                    </p>
                    <p className="max-w-[180px] truncate text-xs text-[var(--color-text-secondary)]">
                      {accountSubLabel}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[var(--color-text-secondary)] transition-transform",
                      accountMenuOpen ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>

                {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.75rem)] w-72 rounded-3xl border border-[var(--color-border)] bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)]"
                  >
                    <div className="mb-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                      <Avatar
                        src={user?.avatar_url}
                        fallback={accountLabel}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                          {accountLabel}
                        </p>
                        <p className="truncate text-xs text-[var(--color-text-secondary)]">
                          {accountSubLabel}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-slate-50"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Account
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-slate-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-gray-100 md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </nav>
      </Container>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--color-border)] bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="space-y-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-gray-100 text-[var(--color-deep-slate-blue)]"
                      : "text-[var(--color-text-secondary)] hover:bg-gray-50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            {!isAuthenticated ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Button variant="secondary" className="w-full" onClick={() => openAuth("login")}>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </div>
                <div className="flex-1">
                  <Button className="w-full" onClick={() => openAuth("register")}>
                    <User className="h-4 w-4" />
                    Get Started
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-slate-50 px-3 py-3">
                  <Avatar
                    src={user?.avatar_url}
                    fallback={accountLabel}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {accountLabel}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-secondary)]">
                      {accountSubLabel}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    <LayoutDashboard className="h-4 w-4" />
                    Account
                  </Button>
                </Link>
                <Button className="w-full" onClick={() => void handleLogout()}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
