"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { setAuthToken } from "@/lib/api";
import { syncAuthenticatedProfile } from "@/lib/authProfile";
import { buildAuthHref, resolveAuthNavigation, type ResumeAction } from "@/lib/authNavigation";
import { buildGoogleAuthCallbackUrl } from "@/lib/googleAuth";
import { useAuthStore } from "@/stores/authStore";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
  const oauthError = searchParams.get("error");

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
        const profile = await syncAuthenticatedProfile(
          authData.session?.access_token ?? "",
          authData.user,
          useAuthStore.getState().user,
        );
        setUser(profile);
      } catch {
        setServerError("Account created, but we could not finish loading your profile.");
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

  async function handleGoogleSignUp() {
    setServerError("");
    setIsGoogleLoading(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildGoogleAuthCallbackUrl({
            origin: window.location.origin,
            mode: "register",
            redirectTo: authNavigation.redirectTo,
            resumeAction: authNavigation.resumeAction,
            role: selectedRole,
          }),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setServerError(error.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
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

      {(serverError || oauthError) && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          {serverError || oauthError}
        </div>
      )}

      <div className="space-y-4">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          isLoading={isGoogleLoading}
          onClick={() => void handleGoogleSignUp()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path fill="#4285F4" d="M21.6 12.23c0-.76-.07-1.49-.2-2.18H12v4.13h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.34 2.98-7.47Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.41 13.92A5.98 5.98 0 0 1 6.1 12c0-.67.12-1.31.31-1.92V7.5H3.07A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.5l3.34-2.58Z" />
            <path fill="#EA4335" d="M12 5.96c1.47 0 2.8.5 3.84 1.48l2.88-2.88C16.95 2.91 14.7 2 12 2A10 10 0 0 0 3.07 7.5l3.34 2.58C7.2 7.72 9.4 5.96 12 5.96Z" />
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <span>Email and password</span>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
      </div>

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
