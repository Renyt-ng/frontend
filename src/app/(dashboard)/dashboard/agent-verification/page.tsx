"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Building2, FileBadge2, ShieldCheck } from "lucide-react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { EmptyState, StatusBadge } from "@/components/shared";
import { useCreateAgent, useMyAgent } from "@/lib/hooks";
import { useAuthStore } from "@/stores/authStore";

const agentApplicationSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  business_address: z.string().min(5, "Business address is required"),
  id_document_url: z.url("Enter a valid document URL").optional().or(z.literal("")),
});

type AgentApplicationValues = z.infer<typeof agentApplicationSchema>;

export default function AgentVerificationPage() {
  const { user } = useAuthStore();
  const myAgentQuery = useMyAgent({
    enabled: user?.role === "agent",
    retry: false,
  });
  const createAgent = useCreateAgent();
  const [serverError, setServerError] = useState("");
  const missingHeadshot = !user?.avatar_url;
  const flaggedHeadshot = user?.avatar_review_status === "flagged";
  const blockedByHeadshot = missingHeadshot || flaggedHeadshot;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgentApplicationValues>({
    resolver: zodResolver(agentApplicationSchema),
    defaultValues: {
      business_name: "",
      business_address: "",
      id_document_url: "",
    },
  });

  const existingAgent = myAgentQuery.data?.data ?? null;
  const agentNotFound =
    axios.isAxiosError(myAgentQuery.error) &&
    myAgentQuery.error.response?.status === 404;

  async function onSubmit(values: AgentApplicationValues) {
    setServerError("");

    try {
      await createAgent.mutateAsync({
        business_name: values.business_name,
        business_address: values.business_address,
        id_document_url: values.id_document_url || "",
      });
      await myAgentQuery.refetch();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setServerError(
          error.response?.data?.error?.message ??
            error.message ??
            "Could not submit verification application",
        );
        return;
      }

      setServerError("Could not submit verification application");
    }
  }

  if (user?.role !== "agent") {
    return (
      <EmptyState
        icon={<ShieldCheck size={28} />}
        title="Agent Access Required"
        description="Only agent accounts can submit verification applications."
      />
    );
  }

  if (myAgentQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-80 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (existingAgent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Agent Verification
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Track the current review status of your agent application.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {existingAgent.business_name}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {existingAgent.business_address}
                </p>
              </div>
              <StatusBadge status={existingAgent.verification_status} size="sm" />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-gray-50 p-4 text-sm text-[var(--color-text-secondary)]">
              {existingAgent.verification_status === "approved"
                ? "Your account is approved. You can now publish listings and receive tenant applications."
                : existingAgent.verification_status === "rejected"
                  ? "Your previous application was rejected. Review your submission details and contact an admin before resubmitting."
                  : "Your application is under review."}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/properties/new">
                <Button>
                  <Building2 className="h-4 w-4" />
                  Create Listing
                </Button>
              </Link>
              <Link href="/dashboard/properties">
                <Button variant="secondary">
                  View My Properties
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myAgentQuery.isError && !agentNotFound) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
        Could not load your verification status. Confirm the backend is running and try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Submit Agent Verification
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Apply once with your business details so an admin can approve your account for listing creation.
        </p>
      </div>

      {missingHeadshot && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Upload a professional headshot on a plain white background in your profile settings before submitting verification.
        </div>
      )}

      {flaggedHeadshot && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          <p className="font-medium">Your current headshot needs to be replaced.</p>
          {user?.avatar_review_note && <p className="mt-1">{user.avatar_review_note}</p>}
        </div>
      )}

      {serverError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5 p-6">
            <Input
              id="business_name"
              label="Business Name"
              placeholder="Renyt Homes Ltd"
              error={errors.business_name?.message}
              {...register("business_name")}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="business_address"
                className="block text-sm font-medium text-[var(--color-text-primary)]"
              >
                Business Address
              </label>
              <textarea
                id="business_address"
                rows={4}
                placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
                className="flex w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/20"
                {...register("business_address")}
              />
              {errors.business_address && (
                <p className="text-sm text-[var(--color-rejected)]">
                  {errors.business_address.message}
                </p>
              )}
            </div>

            <Input
              id="id_document_url"
              label="ID Document URL"
              placeholder="https://example.com/id-card.jpg"
              error={errors.id_document_url?.message}
              {...register("id_document_url")}
            />

            <div className="rounded-2xl border border-[var(--color-border)] bg-gray-50 p-4 text-sm text-[var(--color-text-secondary)]">
              Admins will review this submission from the dashboard and can approve or reject it immediately.
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" isLoading={createAgent.isPending} disabled={blockedByHeadshot}>
                <FileBadge2 className="h-4 w-4" />
                Submit Verification
              </Button>
              {blockedByHeadshot && (
                <Link href="/dashboard/settings">
                  <Button variant="secondary" type="button">
                    Upload Headshot First
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="secondary" type="button">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}