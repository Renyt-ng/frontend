"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { EmptyState, StatusBadge } from "@/components/shared";
import {
  useAdminAgents,
  useAdminProperties,
  useUpdateAgentStatus,
  useVerifyProperty,
} from "@/lib/hooks";
import { formatCurrency, formatPropertyType } from "@/lib/utils";

type VerificationType = "agents" | "properties";

/** Tab selector */
function TabBar({
  active,
  onChange,
}: {
  active: VerificationType;
  onChange: (tab: VerificationType) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-gray-50 p-1">
      {[
        { key: "agents" as const, label: "Agent Verifications", icon: Users },
        {
          key: "properties" as const,
          label: "Property Verifications",
          icon: Building2,
        },
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            active === key
              ? "bg-white text-[var(--color-deep-slate-blue)] shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function VerificationsPage() {
  const [activeTab, setActiveTab] = useState<VerificationType>("agents");
  const agentsQuery = useAdminAgents();
  const propertiesQuery = useAdminProperties();
  const updateAgentStatus = useUpdateAgentStatus();
  const verifyProperty = useVerifyProperty();

  const pendingAgents = (agentsQuery.data?.data ?? []).filter(
    (agent) => agent.verification_status === "pending",
  );
  const rejectedAgents = (agentsQuery.data?.data ?? []).filter(
    (agent) => agent.verification_status === "rejected",
  ).length;
  const pendingProperties = (propertiesQuery.data?.data ?? []).filter(
    (property) =>
      property.verification_status === "none" ||
      property.verification_status === "pending",
  );
  const rejectedProperties = (propertiesQuery.data?.data ?? []).filter(
    (property) => property.verification_status === "rejected",
  ).length;

  const totalPending = pendingAgents.length + pendingProperties.length;
  const totalApproved =
    (agentsQuery.data?.data ?? []).filter(
      (agent) => agent.verification_status === "approved",
    ).length +
    (propertiesQuery.data?.data ?? []).filter(
      (property) => property.verification_status === "approved",
    ).length;
  const totalRejected = rejectedAgents + rejectedProperties;

  const isBusy = updateAgentStatus.isPending || verifyProperty.isPending;

  async function handleAgentDecision(
    id: string,
    verification_status: "approved" | "rejected",
  ) {
    await updateAgentStatus.mutateAsync({ id, verification_status });
  }

  async function handlePropertyDecision(
    id: string,
    verification_status: "approved" | "rejected",
  ) {
    await verifyProperty.mutateAsync({ id, verification_status });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Verification Queue
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Review and approve agent registrations and property listings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-[var(--color-pending)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {totalPending}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Pending Review
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-emerald)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {totalApproved}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Approved
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <XCircle className="h-5 w-5 text-[var(--color-rejected)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {totalRejected}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Rejected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      {(agentsQuery.isError || propertiesQuery.isError) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          Verification data could not be loaded. Confirm the backend is running and you are signed in as an admin.
        </div>
      )}

      {activeTab === "agents" ? (
        pendingAgents.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={28} />}
            title="No Pending Agent Verifications"
            description="All agent applications have been reviewed. New submissions will appear here."
          />
        ) : (
          <div className="grid gap-4">
            {pendingAgents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {agent.business_name}
                        </h2>
                        <StatusBadge status={agent.verification_status} size="sm" />
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {agent.business_address}
                      </p>
                    </div>
                    <Badge variant="info" size="sm">
                      Submitted {new Date(agent.created_at).toLocaleDateString("en-NG")}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleAgentDecision(agent.id, "approved")}
                      disabled={isBusy}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Agent
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleAgentDecision(agent.id, "rejected")}
                      disabled={isBusy}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        pendingProperties.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert size={28} />}
            title="No Pending Property Verifications"
            description="All property listings have been reviewed. New submissions will appear here."
          />
        ) : (
          <div className="grid gap-4">
            {pendingProperties.map((property) => (
              <Card key={property.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {property.title}
                        </h2>
                        <StatusBadge
                          status={property.verification_status}
                          size="sm"
                        />
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {formatPropertyType(property.property_type)} in {property.area}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-deep-slate-blue)]">
                        {property.listing_purpose === "sale"
                          ? `${formatCurrency(property.asking_price ?? 0)} asking`
                          : `${formatCurrency(property.rent_amount ?? 0)}/year`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        property.application_mode === "instant_apply"
                          ? "info"
                          : "default"
                      }
                      size="sm"
                    >
                      {property.application_mode === "instant_apply"
                        ? "Instant Apply"
                        : "Message Agent"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handlePropertyDecision(property.id, "approved")}
                      disabled={isBusy}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Listing
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handlePropertyDecision(property.id, "rejected")}
                      disabled={isBusy}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
