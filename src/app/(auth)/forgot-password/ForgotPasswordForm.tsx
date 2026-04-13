"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, LifeBuoy } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Button, Card, CardContent, Input } from "@/components/ui";

const RESET_REQUEST_COOLDOWN_MS = 60 * 1000;
const RESET_REQUEST_COOLDOWN_STORAGE_KEY = "renyt-password-reset-cooldown-until";

function getStoredCooldownUntil() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(RESET_REQUEST_COOLDOWN_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  const parsed = Number(storedValue);
  if (!Number.isFinite(parsed) || parsed <= Date.now()) {
    window.localStorage.removeItem(RESET_REQUEST_COOLDOWN_STORAGE_KEY);
    return null;
  }

  return parsed;
}

function storeCooldownUntil(nextValue: number | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!nextValue || nextValue <= Date.now()) {
    window.localStorage.removeItem(RESET_REQUEST_COOLDOWN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(RESET_REQUEST_COOLDOWN_STORAGE_KEY, String(nextValue));
}

function formatCooldown(targetTime: number | null, now: number) {
  if (!targetTime) {
    return null;
  }

  const remainingMs = targetTime - now;
  if (remainingMs <= 0) {
    return null;
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setCooldownUntil(getStoredCooldownUntil());
  }, []);

  useEffect(() => {
    if (!cooldownUntil) {
      return undefined;
    }

    if (cooldownUntil <= Date.now()) {
      setCooldownUntil(null);
      storeCooldownUntil(null);
      return undefined;
    }

    const interval = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (cooldownUntil <= currentTime) {
        setCooldownUntil(null);
        storeCooldownUntil(null);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  const cooldownCountdown = formatCooldown(cooldownUntil, now);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cooldownCountdown) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: new URL("/reset-password", window.location.origin).toString(),
        },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      const nextCooldownUntil = Date.now() + RESET_REQUEST_COOLDOWN_MS;
      setCooldownUntil(nextCooldownUntil);
      setNow(Date.now());
      storeCooldownUntil(nextCooldownUntil);

      setSuccessMessage(
        "If that email exists, we have sent password reset instructions to your inbox.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-deep-slate-blue)]/8 text-[var(--color-deep-slate-blue)]">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reset your password</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Enter the email tied to your Renyt account and we will send you a secure reset link.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {cooldownCountdown ? (
          <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-slate-50 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            You can request another reset email in {cooldownCountdown}.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="recovery-email"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              <Input
                id="recovery-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="pl-10 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            disabled={Boolean(cooldownCountdown)}
          >
            {cooldownCountdown ? `Send again in ${cooldownCountdown}` : "Send reset link"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          <Link href="/login" className="inline-flex items-center gap-2 font-medium text-[var(--color-deep-slate-blue)] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}