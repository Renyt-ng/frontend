"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-bg)] px-4 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-[var(--color-rejected)]" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Something went wrong
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          An unexpected error occurred. Please try again or go back to the
          homepage.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="secondary">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-[var(--color-text-secondary)]">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
