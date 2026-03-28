"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { authApi, setAuthToken } from "@/lib/api";
import { buildAuthHref, resolveAuthNavigation, type ResumeAction } from "@/lib/authNavigation";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    role: z.enum(["tenant", "agent"]),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  embedded?: boolean;
  redirectTo?: string;
  resumeAction?: ResumeAction | null;
  onSuccess?: () => void | Promise<void>;
  onSwitchMode?: () => void;
}

export function RegisterForm({
  embedded = false,
  redirectTo,
  resumeAction,
  onSuccess,
  onSwitchMode,
}: RegisterFormProps) {
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    defaultValues: { role: "tenant" },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: RegisterValues) {
    setServerError("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
        },
      },
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
        const profile = await authApi.getProfile();
        setUser(profile.data);
      } catch {
        setUser({
          id: authData.user.id,
          email: authData.user.email ?? "",
          full_name: data.full_name,
          role: data.role as UserRole,
          phone: null,
          avatar_url: null,
          avatar_review_status: "pending",
          avatar_review_note: null,
          created_at: authData.user.created_at,
        });
      }
    }

    if (onSuccess) {
      await onSuccess();
      return;
    }

    router.push(authNavigation.destination);
    router.refresh();
  }

  const switchHref = buildAuthHref("login", {
    redirectTo: authNavigation.redirectTo,
    resumeAction: authNavigation.resumeAction,
  });

  const content = (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {embedded ? "Create your account" : "Create Your Account"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {embedded
            ? "Join Renyt and keep browsing without losing your place."
            : "Join Lagos&rsquo; most trusted rental marketplace"}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            I want to&hellip;
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["tenant", "agent"] as const).map((role) => (
              <label
                key={role}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${
                  selectedRole === role
                    ? "border-[var(--color-deep-slate-blue)] text-[var(--color-deep-slate-blue)] shadow-[0_0_0_1px_rgba(30,58,95,0.16)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-deep-slate-blue)]/30"
                }`}
              >
                <input
                  type="radio"
                  value={role}
                  className="hidden"
                  {...register("role")}
                />
                {role === "tenant" ? "Find a Home" : "List Properties"}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="full_name"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              className="pl-10 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15"
              aria-invalid={errors.full_name ? "true" : "false"}
              {...register("full_name", { required: "Name is required" })}
            />
          </div>
          {errors.full_name && (
            <p className="mt-1 text-xs text-[var(--color-rejected)]">
              {errors.full_name.message}
            </p>
          )}
        </div>

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
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
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

        <div>
          <label
            htmlFor="confirm_password"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              id="confirm_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="pl-10 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15"
              aria-invalid={errors.confirm_password ? "true" : "false"}
              {...register("confirm_password", {
                required: "Please confirm your password",
              })}
            />
          </div>
          {errors.confirm_password && (
            <p className="mt-1 text-xs text-[var(--color-rejected)]">
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
        >
          <UserPlus className="h-4 w-4" />
          Create Account
        </Button>

        <p className="text-center text-xs text-[var(--color-text-secondary)]">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms"
            className="text-[var(--color-deep-slate-blue)] hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-[var(--color-deep-slate-blue)] hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Already have an account?{" "}
        {onSwitchMode ? (
          <button
            type="button"
            onClick={onSwitchMode}
            className="font-medium text-[var(--color-deep-slate-blue)] hover:underline"
          >
            Sign in
          </button>
        ) : (
          <Link
            href={switchHref}
            className="font-medium text-[var(--color-deep-slate-blue)] hover:underline"
          >
            Sign in
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
