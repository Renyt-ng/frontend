"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Building2, Search } from "lucide-react";
import { DashboardPanel, DashboardSectionHeading, MetricCard, DashboardSectionNav, DashboardListSkeleton } from "@/components/dashboard";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Input, Select } from "@/components/ui";
import { useAdminAgents, useAdminProperties } from "@/lib/hooks";
import { formatPropertyPriceLabel, getListingHealthGroup, summarizeListingHealth } from "@/lib/utils";
import type { AdminAssistanceSegment } from "@/types";

const segmentOptions: Array<{ label: string; value: "" | AdminAssistanceSegment }> = [
  { label: "All segments", value: "" },
  { label: "Organic", value: "organic" },
  { label: "Admin-assisted activation", value: "admin_assisted_activation" },
  { label: "Admin-assisted listing", value: "admin_assisted_listing" },
  { label: "Admin-assisted activation and listing", value: "admin_assisted_activation_and_listing" },
];

export default function AdminListingHealthPage() {
  const [agentId, setAgentId] = useState("");
  const [listingSegment, setListingSegment] = useState<"" | AdminAssistanceSegment>("");
  const [search, setSearch] = useState("");
  const agentsQuery = useAdminAgents();
  const propertiesQuery = useAdminProperties({
    agent_id: agentId || undefined,
    listing_segment: listingSegment || undefined,
  });
  const isLoading = agentsQuery.isLoading || propertiesQuery.isLoading;

  const agents = agentsQuery.data?.data ?? [];
  const agentNameById = new Map(agents.map((agent) => [agent.id, agent.business_name]));
  const filteredProperties = useMemo(() => {
    const properties = propertiesQuery.data?.data ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return properties;
    }

    return properties.filter((property) =>
      [property.title, property.area, agentNameById.get(property.agent_id) ?? ""]
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [agentNameById, propertiesQuery.data?.data, search]);

  const summary = summarizeListingHealth(filteredProperties);
  const groups = [
    ["needs_confirmation", "Needs confirmation"],
    ["active", "Active"],
    ["draft", "Drafts"],
    ["final_outcomes", "Final outcomes"],
  ] as const;

  const sectionItems = groups.map(([id, label]) => ({ id, label, count: isLoading ? "..." : summary[id] }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Needs confirmation" value={isLoading ? "..." : summary.needs_confirmation} icon={Building2} emphasis={!isLoading && summary.needs_confirmation > 0 ? "warning" : "default"} />
        <MetricCard label="Active" value={isLoading ? "..." : summary.active} icon={Building2} emphasis="highlight" />
        <MetricCard label="Drafts" value={isLoading ? "..." : summary.draft} icon={Building2} />
        <MetricCard label="Final outcomes" value={isLoading ? "..." : summary.final_outcomes} icon={Building2} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <DashboardSectionNav items={sectionItems} className="order-2 xl:order-1" />

        <div className="order-1 space-y-6">
          <DashboardPanel>
            <DashboardSectionHeading title="Listing Health" description="Filter by agent first. Scan exceptions. Open next action." />
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <Select
                label="Agent"
                value={agentId}
                onChange={(event) => setAgentId(event.target.value)}
                options={[{ label: "All agents", value: "" }, ...agents.map((agent) => ({ label: agent.business_name, value: agent.id }))]}
              />
              <Select
                label="Segment"
                value={listingSegment}
                onChange={(event) => setListingSegment(event.target.value as "" | AdminAssistanceSegment)}
                options={segmentOptions}
              />
              <div className="md:col-span-2">
                <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Property, area, or agent" />
              </div>
            </div>
          </DashboardPanel>

          {groups.map(([groupId, label]) => {
            const properties = filteredProperties.filter((property) => getListingHealthGroup(property) === groupId);

            return (
              <section id={groupId} key={groupId}>
                <DashboardPanel>
                  <DashboardSectionHeading title={label} description={`${properties.length} listing${properties.length === 1 ? "" : "s"}`} />
                  {isLoading ? (
                    <div className="mt-4">
                      <DashboardListSkeleton rows={2} itemClassName="h-28" />
                    </div>
                  ) : properties.length === 0 ? (
                    <EmptyState title={`No ${label.toLowerCase()}`} className="py-10" />
                  ) : (
                    <div className="mt-4 space-y-3">
                      {properties.map((property) => {
                        const price = formatPropertyPriceLabel({
                          listingPurpose: property.listing_purpose,
                          rentAmount: property.rent_amount,
                          askingPrice: property.asking_price,
                          isPriceNegotiable: property.is_price_negotiable,
                        });

                        return (
                        <div key={property.id} className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-[var(--dashboard-text-primary)]">{property.title}</p>
                              <p className="text-xs text-[var(--dashboard-text-secondary)]">{agentNameById.get(property.agent_id) ?? "Agent"} · {property.area}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={property.status} size="sm" />
                              {property.listing_segment ? <StatusBadge status={property.listing_segment === "organic" ? "active" : "pending"} size="sm" /> : null}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-[var(--dashboard-text-secondary)]">{price.amount}</p>
                              {price.qualifier ? (
                                <p className="text-xs text-[var(--dashboard-text-secondary)]">{price.qualifier}</p>
                              ) : null}
                            </div>
                            <div className="flex gap-3 text-sm">
                              <Link href={`/dashboard/properties/${property.id}/edit`} className="inline-flex items-center gap-1 text-[var(--dashboard-accent)]">
                                Manage
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                              <Link href={`/dashboard/cta-insight?property_id=${property.id}`} className="inline-flex items-center gap-1 text-[var(--dashboard-text-secondary)]">
                                CTA
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </DashboardPanel>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}