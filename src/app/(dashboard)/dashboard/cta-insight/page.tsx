"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Link2, Search, UserRound } from "lucide-react";
import { DashboardPanel, DashboardSectionHeading, MetricCard, DashboardListSkeleton } from "@/components/dashboard";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Input, Modal, Select } from "@/components/ui";
import { useAdminAgents, useAdminCtaInsights, useAdminProperties } from "@/lib/hooks";

const ctaTypeOptions = [
  { label: "All CTA", value: "" },
  { label: "Message Agent", value: "message_agent" },
  { label: "Call Agent", value: "call_agent" },
];

export default function AdminCtaInsightPage() {
  const searchParams = useSearchParams();
  const [propertyId, setPropertyId] = useState(searchParams.get("property_id") ?? "");
  const [agentId, setAgentId] = useState("");
  const [ctaType, setCtaType] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const agentsQuery = useAdminAgents();
  const propertiesQuery = useAdminProperties();
  const ctaInsightsQuery = useAdminCtaInsights({
    property_id: propertyId || undefined,
    agent_id: agentId || undefined,
    cta_type: (ctaType || undefined) as "message_agent" | "call_agent" | undefined,
    search: search || undefined,
  });
  const isLoading = agentsQuery.isLoading || propertiesQuery.isLoading || ctaInsightsQuery.isLoading;

  const events = ctaInsightsQuery.data?.data ?? [];
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const qualifiedCount = events.filter((event) => event.qualified_referral).length;
  const uniqueUsers = new Set(events.map((event) => event.user_id ?? event.user_email ?? event.id)).size;
  const conversionRate = events.length > 0 ? Math.round((qualifiedCount / events.length) * 100) : 0;

  const agentOptions = [{ label: "All agents", value: "" }, ...(agentsQuery.data?.data ?? []).map((agent) => ({
    label: agent.business_name,
    value: agent.id,
  }))];
  const propertyOptions = [{ label: "All properties", value: "" }, ...(propertiesQuery.data?.data ?? []).map((property) => ({
    label: property.title,
    value: property.id,
  }))];

  const grouped = useMemo(() => {
    return {
      qualified: events.filter((event) => event.qualified_referral),
      open: events.filter((event) => !event.qualified_referral),
    };
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="CTA events" value={isLoading ? "..." : events.length} icon={BarChart3} emphasis="highlight" />
        <MetricCard label="Identified users" value={isLoading ? "..." : uniqueUsers} icon={UserRound} />
        <MetricCard label="Qualified referrals" value={isLoading ? "..." : qualifiedCount} icon={Link2} />
        <MetricCard label="Qualified conversion" value={isLoading ? "..." : `${conversionRate}%`} icon={BarChart3} />
      </div>

      <DashboardPanel>
        <DashboardSectionHeading title="CTA Insight" description="Filter the event stream. Open referral detail only when qualified." />
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Select label="Property" value={propertyId} onChange={(event) => setPropertyId(event.target.value)} options={propertyOptions} />
          <Select label="Agent" value={agentId} onChange={(event) => setAgentId(event.target.value)} options={agentOptions} />
          <Select label="CTA type" value={ctaType} onChange={(event) => setCtaType(event.target.value)} options={ctaTypeOptions} />
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="User, agent, or property" />
        </div>
      </DashboardPanel>

      {isLoading && events.length === 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardPanel>
            <DashboardSectionHeading title="Qualified referral linked" description="Loading events" />
            <div className="mt-4">
              <DashboardListSkeleton rows={3} itemClassName="h-28" />
            </div>
          </DashboardPanel>
          <DashboardPanel>
            <DashboardSectionHeading title="No qualified referral linked" description="Loading events" />
            <div className="mt-4">
              <DashboardListSkeleton rows={3} itemClassName="h-28" />
            </div>
          </DashboardPanel>
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={<Search size={20} />} title="No CTA events" description="Try a wider filter." className="rounded-2xl border border-[var(--dashboard-border)] bg-white py-16" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {([
            ["qualified", "Qualified referral linked"],
            ["open", "No qualified referral linked"],
          ] as const).map(([groupKey, title]) => (
            <DashboardPanel key={groupKey}>
              <DashboardSectionHeading title={title} description={`${grouped[groupKey].length} event${grouped[groupKey].length === 1 ? "" : "s"}`} />
              <div className="mt-4 space-y-3">
                {grouped[groupKey].map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className="w-full rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-4 text-left transition hover:border-[var(--dashboard-border-strong)] hover:shadow-[var(--shadow-dashboard-sm)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--dashboard-text-primary)]">{event.user_name}</p>
                        <p className="mt-1 text-xs text-[var(--dashboard-text-secondary)]">{event.user_email ?? event.user_phone ?? "No contact"}</p>
                      </div>
                      <div className="flex gap-2">
                        <StatusBadge status={event.cta_type === "call_agent" ? "active" : "info"} size="sm" />
                        {event.qualified_referral ? <StatusBadge status={event.qualified_referral.status} size="sm" /> : null}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[var(--dashboard-text-secondary)] md:grid-cols-2">
                      <p>{event.property_title}</p>
                      <p>{event.agent_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </DashboardPanel>
          ))}
        </div>
      )}

      <Modal isOpen={Boolean(selectedEvent)} onClose={() => setSelectedEventId(null)} title="CTA detail">
        {!selectedEvent ? null : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-tertiary)]">User</p>
                <p className="mt-2 text-sm font-semibold text-[var(--dashboard-text-primary)]">{selectedEvent.user_name}</p>
                <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">{selectedEvent.user_email ?? selectedEvent.user_phone ?? "No contact"}</p>
              </div>
              <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-tertiary)]">Listing</p>
                <p className="mt-2 text-sm font-semibold text-[var(--dashboard-text-primary)]">{selectedEvent.property_title}</p>
                <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">{selectedEvent.agent_name} · {selectedEvent.property_area}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--dashboard-text-primary)]">Qualified referral</p>
                {selectedEvent.qualified_referral ? <StatusBadge status={selectedEvent.qualified_referral.status} size="sm" /> : <StatusBadge status="none" size="sm" />}
              </div>
              {selectedEvent.qualified_referral ? (
                <div className="mt-3 space-y-2 text-sm text-[var(--dashboard-text-secondary)]">
                  <p>Referrer: {selectedEvent.qualified_referral.referrer_name}</p>
                  <p>Referrer email: {selectedEvent.qualified_referral.referrer_email ?? "No email"}</p>
                  <p>Amount: ₦{selectedEvent.qualified_referral.amount.toLocaleString()}</p>
                  <p>Close status: {selectedEvent.qualified_referral.close_status ?? "Open"}</p>
                  {selectedEvent.qualified_referral.hold_reason ? <p>Hold: {selectedEvent.qualified_referral.hold_reason}</p> : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--dashboard-text-secondary)]">No qualified referral linked.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}