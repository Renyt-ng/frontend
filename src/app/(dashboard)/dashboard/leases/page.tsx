"use client";

import { useState, useEffect } from "react";
import { ScrollText, FileSignature } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { leasesApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Lease } from "@/types";

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await leasesApi.getMyLeases();
        setLeases(res.data ?? []);
      } catch {
        setLeases([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Leases
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          View and manage your lease agreements.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : leases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
              <ScrollText className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              No leases yet
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Leases will appear here after an application is approved.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leases.map((lease) => (
            <Card key={lease.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50">
                  <FileSignature className="h-6 w-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-[var(--color-text-primary)]">
                      Lease #{lease.id.slice(0, 8)}
                    </h3>
                    <StatusBadge status={lease.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                    {formatDate(lease.lease_start_date)} &mdash;{" "}
                    {formatDate(lease.lease_end_date)} &middot;{" "}
                    {formatCurrency(lease.rent_amount)}/yr
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  <FileSignature className="h-4 w-4" />
                  {lease.status === "draft" ? "Sign Lease" : "View"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
