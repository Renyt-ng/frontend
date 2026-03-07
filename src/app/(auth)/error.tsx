"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="w-full max-w-md text-center">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
          <AlertTriangle className="h-7 w-7 text-[var(--color-rejected)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Authentication Error
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Something went wrong. Please try again.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
