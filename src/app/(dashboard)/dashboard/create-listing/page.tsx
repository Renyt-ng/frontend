"use client";

import { useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { PropertyComposer } from "../properties/PropertyComposer";
import { useAdminAgents } from "@/lib/hooks";
import { DashboardPanel, DashboardSectionHeading, DashboardListSkeleton } from "@/components/dashboard";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Button, Input } from "@/components/ui";

export default function AdminCreateListingPage() {
  const agentsQuery = useAdminAgents({ verification_status: "approved" });
  const [search, setSearch] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const isLoading = agentsQuery.isLoading;

  const agents = agentsQuery.data?.data ?? [];
  const filteredAgents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return agents;
    }

    return agents.filter((agent) =>
      [agent.business_name, agent.primary_phone ?? ""]
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [agents, search]);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null;

  return (
    <div className="space-y-6">
      <DashboardPanel>
        <DashboardSectionHeading title="Create Listing" description="Select verified agent. Create draft. Publish when ready." />
        <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-3">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search approved agents" aria-label="Search approved agents" />
            <div className="space-y-2">
              {isLoading ? (
                <DashboardListSkeleton rows={4} itemClassName="h-20" />
              ) : filteredAgents.length === 0 ? (
                <EmptyState icon={<Search size={20} />} title="No verified agents" description="Approve an agent first." className="rounded-2xl border border-[var(--dashboard-border)] bg-white py-10" />
              ) : (
                filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedAgentId === agent.id ? "border-[var(--dashboard-border-strong)] bg-white shadow-[var(--shadow-dashboard-sm)]" : "border-[var(--dashboard-border)] bg-[var(--dashboard-surface)]"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--dashboard-text-primary)]">{agent.business_name}</p>
                        <p className="mt-1 text-xs text-[var(--dashboard-text-secondary)]">{agent.primary_phone ?? "No phone"}</p>
                      </div>
                      <StatusBadge status={agent.verification_status} size="sm" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading && !selectedAgent ? (
              <DashboardListSkeleton rows={1} itemClassName="h-40" />
            ) : !selectedAgent ? (
              <EmptyState icon={<Building2 size={20} />} title="Select an agent" description="The listing will publish under that agent account." className="rounded-2xl border border-[var(--dashboard-border)] bg-white py-16" />
            ) : (
              <>
                <DashboardPanel tone="accent">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--dashboard-text-secondary)]">Ownership</p>
                      <h2 className="mt-1 text-xl font-semibold text-[var(--dashboard-text-primary)]">{selectedAgent.business_name}</h2>
                      <p className="mt-2 text-sm text-[var(--dashboard-text-secondary)]">Public attribution and CTA route to this agent.</p>
                    </div>
                    <StatusBadge status="approved" size="sm" />
                  </div>
                </DashboardPanel>
                <PropertyComposer adminMode adminAgentId={selectedAgent.id} />
              </>
            )}
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}