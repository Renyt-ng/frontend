"use client";

import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { applicationsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { Application } from "@/types";

export default function ApplicationsPage() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await applicationsApi.getMyApplications();
        setApplications(res.data ?? []);
      } catch {
        setApplications([]);
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
          Applications
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {user?.role === "agent"
            ? "Review and manage applications for your properties."
            : "Track the status of your rental applications."}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <FileText className="h-8 w-8 text-[var(--color-deep-slate-blue)]" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              No applications yet
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {user?.role === "agent"
                ? "Applications from tenants will appear here."
                : "Browse properties and submit your first application."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-[var(--color-text-primary)]">
                      Application #{app.id.slice(0, 8)}
                    </h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                    Applied on {formatDate(app.created_at)}
                  </p>
                  {app.rental_history && (
                    <p className="mt-1 line-clamp-1 text-sm text-[var(--color-text-secondary)]">
                      {app.rental_history}
                    </p>
                  )}
                </div>
                <Button variant="secondary" size="sm">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
