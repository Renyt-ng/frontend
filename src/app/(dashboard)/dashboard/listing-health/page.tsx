"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, ArrowUpRight, Ban, Building2, Check, Eye, RefreshCw, Search, X } from "lucide-react";
import { DashboardPanel, DashboardSectionHeading, MetricCard, DashboardSectionNav, DashboardListSkeleton } from "@/components/dashboard";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Badge, Button, Modal, Select, Input, type ButtonProps } from "@/components/ui";
import { ReferralShareTriggerButton } from "@/components/referrals";
import { useAdminAgents, useAdminProperties, useConfirmPropertyAvailability, usePropertyOutcomeCandidates, useUpdateProperty } from "@/lib/hooks";
import { formatCurrency, formatPropertyPriceLabel, getListingHealthGroup, getOutcomeActions, summarizeListingHealth } from "@/lib/utils";
import type { AdminAssistanceSegment, CloseDurationUnit, Property } from "@/types";

const segmentOptions: Array<{ label: string; value: "" | AdminAssistanceSegment }> = [
  { label: "All segments", value: "" },
  { label: "Organic", value: "organic" },
  { label: "Admin-assisted activation", value: "admin_assisted_activation" },
  { label: "Admin-assisted listing", value: "admin_assisted_listing" },
  { label: "Admin-assisted activation and listing", value: "admin_assisted_activation_and_listing" },
];

function getLifecycleActionStyles(action: "confirm" | "unavailable" | "archived") {
  switch (action) {
    case "confirm":
      return {
        label: "Confirm live",
        icon: RefreshCw,
        variant: "success" as ButtonProps["variant"],
        className:
          "justify-start border border-emerald-700 shadow-sm shadow-emerald-100/80",
      };
    case "unavailable":
      return {
        label: "Unavailable",
        icon: Ban,
        variant: "secondary" as ButtonProps["variant"],
        className:
          "justify-start border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400 hover:bg-amber-100",
      };
    case "archived":
      return {
        label: "Archive",
        icon: Archive,
        variant: "secondary" as ButtonProps["variant"],
        className:
          "justify-start border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100",
      };
  }
}

function getOutcomeActionStyles(status: Extract<Property["status"], "rented_renyt" | "rented_off_platform" | "sold_renyt" | "sold_off_platform">) {
  if (status === "rented_renyt" || status === "sold_renyt") {
    return {
      label: "Via Renyt",
      icon: Check,
      variant: "dashboardPrimary" as ButtonProps["variant"],
      className: "justify-start shadow-sm shadow-[rgba(30,58,95,0.12)]",
    };
  }

  return {
    label: "Off-platform",
    icon: X,
    variant: "secondary" as ButtonProps["variant"],
    className:
      "justify-start border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
  };
}

function isShortletProperty(property?: Pick<Property, "property_type"> | null) {
  return property?.property_type === "shortlet";
}

function requiresDurationFields(
  property?: Pick<Property, "listing_purpose"> | null,
  status?: Property["status"] | null,
) {
  return Boolean(
    property &&
      property.listing_purpose === "rent" &&
      (status === "rented_renyt" || status === "rented_off_platform"),
  );
}

function buildCloseoutPreview(
  property?: Pick<
    Property,
    | "property_type"
    | "rent_amount"
    | "agency_fee"
    | "listing_authority_mode"
    | "declared_commission_share_percent"
  > | null,
  durationValue?: number | null,
  durationUnit?: CloseDurationUnit | null,
) {
  if (!property || !durationValue || !durationUnit) {
    return null;
  }

  const rentAmount = Number(property.rent_amount ?? 0);
  const agencyFee = Number(property.agency_fee ?? 0);
  if (rentAmount <= 0 || agencyFee <= 0) {
    return null;
  }

  const contractValue =
    durationUnit === "days"
      ? rentAmount * durationValue
      : durationUnit === "months"
        ? (rentAmount / 12) * durationValue
        : rentAmount * durationValue;
  const publicBasis = contractValue * (agencyFee / rentAmount);
  const eligibleBasis =
    property.listing_authority_mode === "authorized_listing_agent"
      ? publicBasis * Number(property.declared_commission_share_percent ?? 0) / 100
      : publicBasis;
  const commissionPool = eligibleBasis * 0.1;

  return {
    contractValue,
    eligibleBasis,
    referrerShare: commissionPool / 2,
    renytShare: commissionPool / 2,
  };
}

export default function AdminListingHealthPage() {
  const [agentId, setAgentId] = useState("");
  const [listingSegment, setListingSegment] = useState<"" | AdminAssistanceSegment>("");
  const [search, setSearch] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<{
    propertyId: string;
    status: Property["status"];
  } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    propertyId: string;
    status: Property["status"];
  } | null>(null);
  const [matchedUserId, setMatchedUserId] = useState("");
  const [closeStartDate, setCloseStartDate] = useState("");
  const [closeDurationValue, setCloseDurationValue] = useState("");
  const [closeDurationUnit, setCloseDurationUnit] = useState<CloseDurationUnit>("years");
  const agentsQuery = useAdminAgents();
  const propertiesQuery = useAdminProperties({
    agent_id: agentId || undefined,
    listing_segment: listingSegment || undefined,
  });
  const confirmAvailability = useConfirmPropertyAvailability();
  const updateProperty = useUpdateProperty();
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
  const pendingOutcomeProperty = useMemo(
    () =>
      pendingOutcome
        ? filteredProperties.find((property) => property.id === pendingOutcome.propertyId) ?? null
        : null,
    [filteredProperties, pendingOutcome],
  );
  const pendingConfirmationProperty = useMemo(
    () =>
      pendingConfirmation
        ? filteredProperties.find((property) => property.id === pendingConfirmation.propertyId) ?? null
        : null,
    [filteredProperties, pendingConfirmation],
  );
  const pendingOutcomeCandidatesQuery = usePropertyOutcomeCandidates(
    pendingOutcome?.propertyId ?? "",
    {
      enabled: Boolean(pendingOutcome),
    },
  );
  const groups = [
    ["needs_confirmation", "Needs confirmation"],
    ["active", "Active"],
    ["draft", "Drafts"],
    ["final_outcomes", "Final outcomes"],
  ] as const;

  const sectionItems = groups.map(([id, label]) => ({ id, label, count: isLoading ? "..." : summary[id] }));

  async function handleConfirmAvailability(propertyId: string) {
    setActiveAction(`confirm:${propertyId}`);
    try {
      await confirmAvailability.mutateAsync(propertyId);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleStatusUpdate(propertyId: string, status: Property["status"]) {
    if (status === "rented_renyt" || status === "sold_renyt") {
      setPendingOutcome({ propertyId, status });
      return;
    }

    if (
      status === "unavailable" ||
      status === "archived" ||
      status === "rented_off_platform" ||
      status === "sold_off_platform"
    ) {
      setPendingConfirmation({ propertyId, status });
      return;
    }

    setActiveAction(`${status}:${propertyId}`);
    try {
      await updateProperty.mutateAsync({ id: propertyId, data: { status } });
    } finally {
      setActiveAction(null);
    }
  }

  function getConfirmationCopy(status: Property["status"], property?: Property | null) {
    const shortlet = isShortletProperty(property);
    switch (status) {
      case "unavailable":
        return {
          title: shortlet ? "Pause shortlet availability" : "Mark listing unavailable",
          description:
            shortlet
              ? "Use this when the shortlet should stay visible but not accept new contact. Active stay messaging will continue until availability is reconfirmed."
              : "This removes the listing from direct-contact actions and marks open referral earnings on the property ineligible unless they are already terminal.",
          confirmLabel: shortlet ? "Pause availability" : "Mark unavailable",
        };
      case "archived":
        return {
          title: "Archive listing",
          description:
            "This keeps the listing for history only and closes open referral earnings on the property as ineligible unless they are already terminal.",
          confirmLabel: "Archive listing",
        };
      case "rented_off_platform":
        return {
          title: shortlet ? "Mark shortlet booked off-platform" : "Mark rented off-platform",
          description:
            shortlet
              ? "Record the stay duration so Renyt can review the expected commission while the shortlet stays visible in search as booked."
              : "Use this only when the property was rented outside Renyt. Open referral earnings on the property will become ineligible unless they are already terminal.",
          confirmLabel: shortlet ? "Confirm booked stay" : "Confirm off-platform rent",
        };
      case "sold_off_platform":
        return {
          title: "Mark sold off-platform",
          description:
            "Use this only when the property was sold outside Renyt. Open referral earnings on the property will become ineligible unless they are already terminal.",
          confirmLabel: "Confirm off-platform sale",
        };
      default:
        return {
          title: "Confirm status change",
          description: "Review this status change before continuing.",
          confirmLabel: "Confirm",
        };
    }
  }

  async function handleConfirmStatusAction() {
    if (!pendingConfirmation) {
      return;
    }

    const { propertyId, status } = pendingConfirmation;
    setActiveAction(`${status}:${propertyId}`);

    try {
      await updateProperty.mutateAsync({
        id: propertyId,
        data: {
          status,
          ...(requiresDurationFields(pendingConfirmationProperty, status)
            ? {
                close_start_date: closeStartDate,
                close_duration_unit: closeDurationUnit,
                close_duration_value: Number(closeDurationValue),
              }
            : {}),
        },
      });
      setPendingConfirmation(null);
      setCloseStartDate("");
      setCloseDurationValue("");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleConfirmMatchedOutcome() {
    if (!pendingOutcome) {
      return;
    }

    setActiveAction(`${pendingOutcome.status}:${pendingOutcome.propertyId}`);
    try {
      await updateProperty.mutateAsync({
        id: pendingOutcome.propertyId,
        data: {
          status: pendingOutcome.status,
          matched_user_id: matchedUserId,
          ...(requiresDurationFields(pendingOutcomeProperty, pendingOutcome.status)
            ? {
                close_start_date: closeStartDate,
                close_duration_unit: closeDurationUnit,
                close_duration_value: Number(closeDurationValue),
              }
            : {}),
        },
      });

      setPendingOutcome(null);
      setMatchedUserId("");
      setCloseStartDate("");
      setCloseDurationValue("");
    } finally {
      setActiveAction(null);
    }
  }

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

        <div className="order-1 min-w-0 space-y-6">
          <DashboardPanel>
            <DashboardSectionHeading title="Listing Health" description="Filter by agent first. Scan exceptions. Open next action." />
            <div className="mt-4 grid gap-3 lg:grid-cols-4">
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
                          propertyType: property.property_type,
                          rentAmount: property.rent_amount,
                          askingPrice: property.asking_price,
                          isPriceNegotiable: property.is_price_negotiable,
                        });

                        const isActionable = groupId === "needs_confirmation" || groupId === "active";

                        return (
                        <div key={property.id} className="min-w-0 rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="break-words text-sm font-semibold text-[var(--dashboard-text-primary)]">{property.title}</p>
                              <p className="break-words text-xs text-[var(--dashboard-text-secondary)]">{agentNameById.get(property.agent_id) ?? "Agent"} · {property.area}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={property.status} size="sm" />
                              {property.listing_segment ? <StatusBadge status={property.listing_segment === "organic" ? "active" : "pending"} size="sm" /> : null}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-[var(--dashboard-text-secondary)]">{price.amount}</p>
                              {price.qualifier ? (
                                <p className="text-xs text-[var(--dashboard-text-secondary)]">{price.qualifier}</p>
                              ) : null}
                            </div>
                            <div className="w-full lg:w-[420px]">
                              {isActionable ? (
                                <div className="w-full rounded-[24px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                                  <div className="space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-secondary)]">
                                      Listing Health
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <ReferralShareTriggerButton
                                        property={property}
                                        variant="secondary"
                                        size="sm"
                                        label="Share"
                                        className="justify-start border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                      />
                                      {(() => {
                                        const action = getLifecycleActionStyles("confirm");
                                        const Icon = action.icon;

                                        return (
                                          <Button
                                            size="sm"
                                            variant={action.variant}
                                            className={action.className}
                                            onClick={() => handleConfirmAvailability(property.id)}
                                            isLoading={activeAction === `confirm:${property.id}`}
                                          >
                                            <Icon className="h-4 w-4" />
                                            {action.label}
                                          </Button>
                                        );
                                      })()}
                                      {(() => {
                                        const action = getLifecycleActionStyles("unavailable");
                                        const Icon = action.icon;

                                        return (
                                          <Button
                                            variant={action.variant}
                                            size="sm"
                                            className={action.className}
                                            onClick={() => handleStatusUpdate(property.id, "unavailable")}
                                            isLoading={activeAction === `unavailable:${property.id}`}
                                          >
                                            <Icon className="h-4 w-4" />
                                            {action.label}
                                          </Button>
                                        );
                                      })()}
                                      {(() => {
                                        const action = getLifecycleActionStyles("archived");
                                        const Icon = action.icon;

                                        return (
                                          <Button
                                            variant={action.variant}
                                            size="sm"
                                            className={action.className}
                                            onClick={() => handleStatusUpdate(property.id, "archived")}
                                            isLoading={activeAction === `archived:${property.id}`}
                                          >
                                            <Icon className="h-4 w-4" />
                                            {action.label}
                                          </Button>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-2 border-t border-[var(--dashboard-border)] pt-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-secondary)]">
                                      Close As
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {getOutcomeActions(property.listing_purpose).map((action) => {
                                        const presentation = getOutcomeActionStyles(action.status);
                                        const Icon = presentation.icon;

                                        return (
                                          <Button
                                            key={action.status}
                                            aria-label={action.label}
                                            variant={presentation.variant}
                                            size="sm"
                                            className={presentation.className}
                                            onClick={() => handleStatusUpdate(property.id, action.status)}
                                            isLoading={activeAction === `${action.status}:${property.id}`}
                                          >
                                            <Icon className="h-4 w-4" />
                                            {presentation.label}
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap justify-end gap-x-3 gap-y-2 text-sm">
                                  <Link href={`/dashboard/properties/${property.id}/edit`} className="inline-flex items-center gap-1 text-[var(--dashboard-accent)]">
                                    Manage
                                    <ArrowUpRight className="h-4 w-4" />
                                  </Link>
                                  <Link href={`/dashboard/cta-insight?property_id=${property.id}`} className="inline-flex items-center gap-1 text-[var(--dashboard-text-secondary)]">
                                    CTA
                                    <ArrowUpRight className="h-4 w-4" />
                                  </Link>
                                </div>
                              )}
                              <div className="mt-3 flex items-center gap-2 lg:justify-end">
                                <Link href={property.status === "active" ? `/properties/${property.id}` : `/dashboard/properties/${property.id}/edit`}>
                                  <Button variant="ghost" size="icon">
                                    {property.status === "active" ? <Eye className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                  </Button>
                                </Link>
                                <Link href={`/dashboard/properties/${property.id}/edit`}>
                                  <Button variant="ghost" size="icon">
                                    <ArrowUpRight className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
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

      <Modal
        isOpen={Boolean(pendingConfirmation)}
        onClose={() => setPendingConfirmation(null)}
        title={pendingConfirmation ? getConfirmationCopy(pendingConfirmation.status, pendingConfirmationProperty).title : "Confirm status change"}
        ariaLabel="Confirm property status change"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {pendingConfirmation ? getConfirmationCopy(pendingConfirmation.status, pendingConfirmationProperty).description : "Review this change before continuing."}
          </p>

          {pendingConfirmationProperty ? (
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <p className="font-medium text-[var(--color-text-primary)]">{pendingConfirmationProperty.title}</p>
              <p className="mt-1">{pendingConfirmationProperty.area}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Confirmed and paid referral earnings remain unchanged. This confirmation only affects open referral items tied to this property.
          </div>

          {requiresDurationFields(pendingConfirmationProperty, pendingConfirmation?.status ?? null) ? (
            <div className="space-y-3 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-4 text-sm text-[var(--color-text-secondary)]">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-secondary)]">Start date</span>
                  <input
                    type="date"
                    value={closeStartDate}
                    onChange={(event) => setCloseStartDate(event.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-secondary)]">Duration</span>
                  <input
                    type="number"
                    min={1}
                    value={closeDurationValue}
                    onChange={(event) => setCloseDurationValue(event.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-secondary)]">Unit</span>
                  <select
                    value={closeDurationUnit}
                    onChange={(event) => setCloseDurationUnit(event.target.value as CloseDurationUnit)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  >
                    {pendingConfirmationProperty?.property_type === "shortlet" ? (
                      <option value="days">Days</option>
                    ) : (
                      <>
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </>
                    )}
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPendingConfirmation(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStatusAction}
              isLoading={Boolean(
                pendingConfirmation &&
                activeAction === `${pendingConfirmation.status}:${pendingConfirmation.propertyId}`,
              )}
              disabled={
                requiresDurationFields(pendingConfirmationProperty, pendingConfirmation?.status ?? null) &&
                (!closeStartDate || !closeDurationValue)
              }
            >
              {pendingConfirmation ? getConfirmationCopy(pendingConfirmation.status, pendingConfirmationProperty).confirmLabel : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(pendingOutcome)}
        onClose={() => setPendingOutcome(null)}
        title={pendingOutcome?.status === "sold_renyt"
          ? "Mark sold via Renyt"
          : pendingOutcomeProperty?.property_type === "shortlet"
            ? "Mark shortlet booked via Renyt"
            : "Mark rented via Renyt"}
        ariaLabel="Confirm Renyt close outcome"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Select the matched buyer or renter from people who previously contacted this property. The winning referral candidate will move to under review and losing open earnings will become ineligible.
          </p>

          {pendingOutcomeProperty ? (
            <div className="mt-4 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <p className="font-medium text-[var(--color-text-primary)]">{pendingOutcomeProperty.title}</p>
              <p className="mt-1">{pendingOutcomeProperty.area}</p>
            </div>
          ) : null}

          {requiresDurationFields(pendingOutcomeProperty, pendingOutcome?.status ?? null) ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-4 text-sm text-[var(--color-text-secondary)]">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-secondary)]">Start date</span>
                  <input
                    type="date"
                    value={closeStartDate}
                    onChange={(event) => setCloseStartDate(event.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-secondary)]">Duration</span>
                  <input
                    type="number"
                    min={1}
                    value={closeDurationValue}
                    onChange={(event) => setCloseDurationValue(event.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-secondary)]">Unit</span>
                  <select
                    value={closeDurationUnit}
                    onChange={(event) => setCloseDurationUnit(event.target.value as CloseDurationUnit)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  >
                    {pendingOutcomeProperty?.property_type === "shortlet" ? (
                      <option value="days">Days</option>
                    ) : (
                      <>
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </>
                    )}
                  </select>
                </label>
              </div>
              {(() => {
                const preview = buildCloseoutPreview(
                  pendingOutcomeProperty,
                  Number(closeDurationValue || 0),
                  closeDurationUnit,
                );

                if (!preview) {
                  return null;
                }

                return (
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                    <p className="font-medium text-[var(--color-text-primary)]">Expected review snapshot</p>
                    <p className="mt-1">Contract value: {formatCurrency(preview.contractValue)}</p>
                    <p>Eligible basis: {formatCurrency(preview.eligibleBasis)}</p>
                    <p>Referrer share: {formatCurrency(preview.referrerShare)} · Renyt share: {formatCurrency(preview.renytShare)}</p>
                  </div>
                );
              })()}
            </div>
          ) : null}

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            {pendingOutcomeCandidatesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : (pendingOutcomeCandidatesQuery.data?.data ?? []).length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                No eligible contacted users found for this property.
              </div>
            ) : (
              <div className="space-y-3 pb-1">
                {(pendingOutcomeCandidatesQuery.data?.data ?? []).map((candidate) => (
                  <label
                    key={candidate.user_id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--color-border)] px-4 py-3"
                  >
                    <input
                      type="radio"
                      name="matched-user"
                      value={candidate.user_id}
                      checked={matchedUserId === candidate.user_id}
                      onChange={(event) => setMatchedUserId(event.target.value)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[var(--color-text-primary)]">{candidate.full_name}</p>
                        {candidate.has_open_referral_candidate ? (
                          <Badge variant="dashboardSuccess">Referral candidate</Badge>
                        ) : (
                          <Badge variant="dashboardWarning">No open referral</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {candidate.email ?? "No email"} · {candidate.phone ?? "No phone"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        Last contact {new Date(candidate.latest_contact_at).toLocaleDateString()} · {candidate.source_channels.join(", ")}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-[var(--color-border)] bg-white pt-4">
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              Confirmed and paid earnings remain unchanged. This action only updates open referral items on the property.
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setPendingOutcome(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={handleConfirmMatchedOutcome}
                isLoading={Boolean(
                  pendingOutcome && activeAction === `${pendingOutcome.status}:${pendingOutcome.propertyId}`,
                )}
                disabled={
                  !matchedUserId ||
                  (requiresDurationFields(pendingOutcomeProperty, pendingOutcome?.status ?? null) &&
                    (!closeStartDate || !closeDurationValue))
                }
              >
                Confirm outcome
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}