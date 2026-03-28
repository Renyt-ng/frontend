"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, Button } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { applicationsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useUpdateApplicationStatus } from "@/lib/hooks";
import { propertiesApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { Application } from "@/types";

type DashboardApplication = Application & {
  property_title?: string;
  property_area?: string;
};

export default function ApplicationsPage() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<DashboardApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const updateApplicationStatus = useUpdateApplicationStatus();

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        if (active) {
          setApplications([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (user.role === "tenant") {
          const res = await applicationsApi.getMyApplications();
          if (active) {
            setApplications(res.data ?? []);
          }
          return;
        }

        const propertiesRes = await propertiesApi.getMyProperties();
        const properties = propertiesRes.data ?? [];
        const applicationGroups = await Promise.all(
          properties.map(async (property) => {
            const response = await applicationsApi.getPropertyApplications(
              property.id,
            );

            return (response.data ?? []).map((application) => ({
              ...application,
              property_title: property.title,
              property_area: property.area,
            }));
          }),
        );

        if (active) {
          setApplications(applicationGroups.flat());
        }
      } catch {
        if (active) {
          setApplications([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user]);

  async function handleStatusUpdate(
    applicationId: string,
    status: "approved" | "rejected",
  ) {
    await updateApplicationStatus.mutateAsync({ id: applicationId, status });
    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId ? { ...application, status } : application,
      ),
    );
  }

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
                  {app.property_title && (
                    <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">
                      {app.property_title}
                      {app.property_area ? ` · ${app.property_area}` : ""}
                    </p>
                  )}
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                    Applied on {formatDate(app.created_at)}
                  </p>
                  {app.rental_history && (
                    <p className="mt-1 line-clamp-1 text-sm text-[var(--color-text-secondary)]">
                      {app.rental_history}
                    </p>
                  )}
                </div>
                {user?.role === "tenant" ? (
                  <Link href={`/properties/${app.property_id}`}>
                    <Button variant="secondary" size="sm">
                      View Property
                    </Button>
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(app.id, "approved")}
                      disabled={
                        updateApplicationStatus.isPending || app.status !== "pending"
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusUpdate(app.id, "rejected")}
                      disabled={
                        updateApplicationStatus.isPending || app.status !== "pending"
                      }
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
