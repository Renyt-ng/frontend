"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-[var(--color-rejected)]" />
        </div>

        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          Dashboard Error
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Something went wrong loading this section. Your data is safe.
        </p>

        <div className="mt-6">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
