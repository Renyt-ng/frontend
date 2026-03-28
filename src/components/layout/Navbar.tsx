"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildCurrentUrl } from "@/lib/authNavigation";
import { Container } from "./Container";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";

const NAV_LINKS = [
  { href: "/search", label: "Find a Home", icon: Search },
  { href: "/how-it-works", label: "How it Works", icon: Home },
  { href: "/agents", label: "For Agents", icon: Building2 },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const openOverlay = useAuthOverlayStore((state) => state.openOverlay);
  const currentUrl = buildCurrentUrl(pathname || "/", searchParams);
  const showDashboard = isAuthenticated && (user?.role === "admin" || user?.role === "agent");

  function openAuth(mode: "login" | "register") {
    openOverlay({ mode, redirectTo: currentUrl });
    setMobileOpen(false);
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
              width={110}
              height={36}
              className="h-9 w-auto"
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
            {showDashboard ? (
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : !isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => openAuth("register")}>
                  Get Started
                </Button>
              </>
            ) : null}
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
            {showDashboard ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" className="w-full">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : !isAuthenticated ? (
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
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
