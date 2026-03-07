"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Search } from "lucide-react";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketing error:", error);
  }, [error]);

  return (
    <Container className="py-20 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-[var(--color-rejected)]" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Something went wrong
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          We couldn&rsquo;t load this page. Please try again.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/search">
            <Button variant="secondary">
              <Search className="h-4 w-4" />
              Browse Properties
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
