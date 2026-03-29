"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { setAuthToken } from "@/lib/api";
import { syncAuthenticatedProfile } from "@/lib/authProfile";
import { buildAuthHref, resolveAuthNavigation, type ResumeAction } from "@/lib/authNavigation";
import { useAuthStore } from "@/stores/authStore";

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  embedded?: boolean;
  redirectTo?: string;
  resumeAction?: ResumeAction | null;
  onSuccess?: () => void | Promise<void>;
  onSwitchMode?: () => void;
}

export function LoginForm({
  embedded = false,
  redirectTo,
  resumeAction,
  onSuccess,
  onSwitchMode,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const authNavigation = resolveAuthNavigation({
    get(key: string) {
      if (key === "redirectTo" || key === "redirect") {
        return redirectTo ?? searchParams.get(key);
      }

      if (key === "resumeAction") {
        return resumeAction ?? searchParams.get(key);
      }

      return searchParams.get(key);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>();

  async function onSubmit(data: LoginValues) {
    setServerError("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (authData.session?.access_token) {
      setAuthToken(authData.session.access_token);
    }

    if (authData.user) {
      try {
        const profile = await syncAuthenticatedProfile(
          authData.session?.access_token ?? "",
          authData.user,
          useAuthStore.getState().user,
        );
        setUser(profile);
      } catch {
        setServerError("Signed in, but failed to load your profile");
        return;
      }
    }

    if (onSuccess) {
      await onSuccess();
      return;
    }

    router.push(authNavigation.destination);
    router.refresh();
  }

  const switchHref = buildAuthHref("register", {
    redirectTo: authNavigation.redirectTo,
    resumeAction: authNavigation.resumeAction,
  });

  const content = (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {embedded ? "Sign in to continue" : "Welcome Back"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {embedded
            ? "Pick up where you left off without leaving this page."
            : "Sign in to your Renyt account"}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-10 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15"
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email", { required: "Email is required" })}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-[var(--color-rejected)]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pl-10 pr-12 text-sm focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15"
              aria-invalid={errors.password ? "true" : "false"}
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-[var(--color-rejected)]">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/20"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Remember me
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[var(--color-deep-slate-blue)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Don&rsquo;t have an account?{" "}
        {onSwitchMode ? (
          <button
            type="button"
            onClick={onSwitchMode}
            className="font-medium text-[var(--color-deep-slate-blue)] hover:underline"
          >
            Create one
          </button>
        ) : (
          <Link
            href={switchHref}
            className="font-medium text-[var(--color-deep-slate-blue)] hover:underline"
          >
            Create one
          </Link>
        )}
      </div>
    </>
  );

  if (embedded) {
    return <div className="p-6 sm:p-7">{content}</div>;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 sm:p-8">{content}</CardContent>
    </Card>
  );
}
