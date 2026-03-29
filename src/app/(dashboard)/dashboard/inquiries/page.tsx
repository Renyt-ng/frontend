"use client";

import Link from "next/link";
import { FileText, MessageSquareMore } from "lucide-react";
import { Button, Card, CardContent, Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { useAgentPropertyInquiries } from "@/lib/hooks";
import { formatDate, getPropertyFreshnessLabel } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

export default function InquiriesPage() {
  const { user } = useAuthStore();
  const inquiriesQuery = useAgentPropertyInquiries(Boolean(user));
  const inquiries = inquiriesQuery.data?.data ?? [];
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Inquiries
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {isAdmin
            ? "Monitor inquiry demand across active inventory and track property context."
            : "Review inquiry demand and follow up while listing intent is still warm."}
        </p>
      </div>

      {inquiriesQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <MessageSquareMore className="h-8 w-8 text-[var(--color-deep-slate-blue)]" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              No inquiries yet
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Inquiry records will appear here when users send qualified listing inquiries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                      {inquiry.full_name}
                    </h3>
                    <StatusBadge status={inquiry.status} />
                    {inquiry.property ? <StatusBadge status={inquiry.property.status} /> : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                    {inquiry.property?.title ?? "Property unavailable"}
                    {inquiry.property?.area ? ` · ${inquiry.property.area}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Sent {formatDate(inquiry.created_at)} · {inquiry.email} · {inquiry.phone}
                  </p>
                  {inquiry.property ? (
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {getPropertyFreshnessLabel(inquiry.property)}
                    </p>
                  ) : null}
                  {inquiry.note ? (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                      {inquiry.note}
                    </p>
                  ) : null}
                  {inquiry.referral_code ? (
                    <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                      Referral code: {inquiry.referral_code}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 lg:justify-end">
                  {inquiry.property ? (
                    <Link href={`/properties/${inquiry.property.id}`}>
                      <Button variant="secondary" size="sm">
                        <FileText className="h-4 w-4" />
                        View listing
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}