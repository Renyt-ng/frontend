"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";

function hasRecoveryTokenInUrl() {
  if (typeof window === "undefined") {
    return false;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return hashParams.get("type") === "recovery" || Boolean(hashParams.get("access_token"));
}

export function ResetPasswordForm() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    let isActive = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) {
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryReady(true);
        setIsCheckingRecovery(false);
        return;
      }

      if (event === "SIGNED_IN" && (session || hasRecoveryTokenInUrl())) {
        setIsRecoveryReady(true);
        setIsCheckingRecovery(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isActive) {
          return;
        }

        setIsRecoveryReady(Boolean(session) || hasRecoveryTokenInUrl());
      })
      .finally(() => {
        if (isActive) {
          setIsCheckingRecovery(false);
        }
      });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      logoutStore();
      router.push(
        "/login?message=" + encodeURIComponent("Password reset successful. Sign in with your new password."),
      );
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-deep-slate-blue)]/8 text-[var(--color-deep-slate-blue)]">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Choose a new password</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Set a new password for your Renyt account, then sign in again to continue.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
            {error}
          </div>
        ) : null}

        {isCheckingRecovery ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-slate-50 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Validating your recovery link...
          </div>
        ) : null}

        {!isCheckingRecovery && !isRecoveryReady ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This recovery link is invalid or has expired. Request a fresh password reset email.
            </div>
            <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-deep-slate-blue)] hover:underline">
              Request another reset link
            </Link>
          </div>
        ) : null}

        {isRecoveryReady ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a new password"
                  className="pr-12 text-sm focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                  aria-label={showPassword ? "Hide new password" : "Show new password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  className="pr-12 text-sm focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Save new password
            </Button>
          </form>
        ) : null}

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