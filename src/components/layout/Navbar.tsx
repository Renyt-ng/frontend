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
  const searchParamsString = searchParams?.toString() ?? "";
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
    setMobileOpen(false);
  }, [pathname, searchParamsString]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
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
          <div className="flex items-center gap-2 md:hidden">
            {!isAuthenticated ? (
              <Button
                variant="secondary"
                size="sm"
                className="px-4"
                onClick={() => openAuth("login")}
              >
                Sign In
              </Button>
            ) : null}
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-xl border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-gray-100"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls="mobile-navigation-drawer"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </Container>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 md:hidden"
        >
          <button
            type="button"
            aria-label="Dismiss navigation menu"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
            onPointerDown={() => setMobileOpen(false)}
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="mobile-navigation-drawer"
            className="absolute right-0 top-0 flex h-dvh w-[75vw] max-w-[24rem] flex-col overflow-hidden border-l border-[var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-white/90 px-5 py-4 backdrop-blur-sm">
              <Link href="/" className="flex items-center gap-1" onClick={() => setMobileOpen(false)}>
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
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-[var(--color-deep-slate-blue)] p-3 text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-gray-100"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <p className="px-3 pb-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]/80">
                Explore
              </p>
              <div className="space-y-2">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl border px-3 py-3.5 text-base font-medium transition-[border-color,background-color,color,transform,box-shadow]",
                        pathname === link.href
                          ? "border-[var(--color-deep-slate-blue)]/15 bg-[var(--color-deep-slate-blue)]/6 text-[var(--color-deep-slate-blue)] shadow-sm"
                          : "border-transparent bg-white/70 text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-white hover:text-[var(--color-text-primary)] hover:shadow-sm",
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-[var(--color-text-secondary)] transition-colors group-hover:bg-slate-200 group-hover:text-[var(--color-text-primary)] group-[.bg-[var(--color-deep-slate-blue)]/6]:bg-[var(--color-deep-slate-blue)]/10 group-[.bg-[var(--color-deep-slate-blue)]/6]:text-[var(--color-deep-slate-blue)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] bg-white/92 px-4 py-4 backdrop-blur-sm">
              {!isAuthenticated ? (
                <div className="space-y-3 rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Continue with your account</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                      Sign in to save homes, track listings, and pick up where you left off.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <Button variant="secondary" className="w-full" onClick={() => openAuth("login")}>
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </Button>
                    </div>
                    <div>
                      <Button className="w-full" onClick={() => openAuth("register")}>
                        <User className="h-4 w-4" />
                        Get Started
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                  <div className="rounded-3xl border border-[var(--color-border)] bg-white px-3 py-3 shadow-sm">
                    <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]/80">
                      Signed In
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user?.avatar_url}
                        fallback={accountLabel}
                        size="sm"
                        className="ring-2 ring-white shadow-sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                          {accountLabel}
                        </p>
                        <p className="truncate text-sm text-[var(--color-text-secondary)]">
                          {accountSubLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button variant="secondary" className="w-full justify-center rounded-2xl">
                        <LayoutDashboard className="h-4 w-4" />
                        Account
                      </Button>
                    </Link>
                    <div className="border-t border-[var(--color-border)] pt-3">
                      <Button className="w-full justify-center rounded-2xl" onClick={() => void handleLogout()}>
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
