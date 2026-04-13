"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Ban,
  Check,
  CircleAlert,
  Edit3,
  Eye,
  LoaderCircle,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Badge, Button, Card, CardContent, Modal, type ButtonProps } from "@/components/ui";
import { PropertyCardSkeleton } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { ReferralShareTriggerButton } from "@/components/referrals";
import {
  DashboardContextualHelp,
  MiniBarChart,
  DashboardPanel,
  DashboardSectionHeading,
  DashboardSectionNav,
} from "@/components/dashboard";
import {
  useConfirmPropertyAvailability,
  useDeleteProperty,
  useExtendShortletOccupancy,
  useMyAgent,
  useMyPropertyInsights,
  useMyProperties,
  usePropertyOutcomeCandidates,
  useUpdateProperty,
} from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import {
  formatCurrency,
  formatPropertyPriceLabel,
  formatPropertyType,
  formatListingPurpose,
  getListingHealthGroup,
  getOutcomeActions,
  getPropertyFinalOutcomeLabel,
  getPropertyFreshnessLabel,
  getPropertyFreshnessMeta,
  summarizeListingHealth,
} from "@/lib/utils";
import type { CloseDurationUnit, Property } from "@/types";

const DISMISSED_PUBLISH_SUCCESS_STORAGE_KEY = "renyt:dismissed-publish-success";

function formatResolutionSummary(summary?: Property["referral_resolution_summary"] | null) {
  if (!summary) {
    return null;
  }

  const segments = [] as string[];

  if (summary.winner_moved_to_under_review > 0) {
    segments.push(`${summary.winner_moved_to_under_review} referral moved to under review`);
  }

  if (summary.open_events_marked_ineligible > 0) {
    segments.push(
      `${summary.open_events_marked_ineligible} open earning${summary.open_events_marked_ineligible === 1 ? "" : "s"} marked ineligible`,
    );
  }

  if (summary.preserved_terminal_events > 0) {
    segments.push(
      `${summary.preserved_terminal_events} terminal item${summary.preserved_terminal_events === 1 ? " was" : "s were"} preserved`,
    );
  }

  return segments.join(". ");
}

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

export default function MyPropertiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const publishingQueryId = searchParams.get("publishing");
  const agentQuery = useMyAgent();
  const [trackedPublishId, setTrackedPublishId] = useState<string | null>(publishingQueryId);
  const [dismissedSuccessIds, setDismissedSuccessIds] = useState<string[]>([]);
  const propertiesQuery = useMyProperties({
    refetchInterval: (query) => {
      const properties = query.state.data?.data ?? [];
      if (!trackedPublishId) {
        return properties.some((property) => property.status === "publishing") ? 1000 : false;
      }

      const trackedProperty = properties.find((property) => property.id === trackedPublishId);
      return trackedProperty?.status === "publishing" ? 1000 : false;
    },
  });
  const confirmAvailability = useConfirmPropertyAvailability();
  const extendShortletOccupancy = useExtendShortletOccupancy();
  const deleteProperty = useDeleteProperty();
  const updateProperty = useUpdateProperty();
  const insightsQuery = useMyPropertyInsights();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<{
    propertyId: string;
    status: Property["status"];
  } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    propertyId: string;
    status: Property["status"];
  } | null>(null);
  const [pendingDraftDeleteId, setPendingDraftDeleteId] = useState<string | null>(null);
  const [activeInsightPropertyId, setActiveInsightPropertyId] = useState<string | null>(null);
  const [matchedUserId, setMatchedUserId] = useState("");
  const [closeStartDate, setCloseStartDate] = useState("");
  const [closeDurationValue, setCloseDurationValue] = useState("");
  const [closeDurationUnit, setCloseDurationUnit] = useState<CloseDurationUnit>("years");
  const [pendingShortletExtensionId, setPendingShortletExtensionId] = useState<string | null>(null);
  const [additionalStayDays, setAdditionalStayDays] = useState("");
  const [resolutionFeedback, setResolutionFeedback] = useState<Record<string, string>>({});

  const properties = propertiesQuery.data?.data ?? [];
  const propertyInsights = insightsQuery.data?.data ?? [];
  const pendingOutcomeCandidatesQuery = usePropertyOutcomeCandidates(
    pendingOutcome?.propertyId ?? "",
    {
      enabled: Boolean(pendingOutcome),
    },
  );
  const summary = useMemo(() => summarizeListingHealth(properties), [properties]);
  const insightByPropertyId = useMemo(
    () => new Map(propertyInsights.map((insight) => [insight.property_id, insight])),
    [propertyInsights],
  );
  const groupedProperties = useMemo(() => {
    const groups = {
      publishing: [] as Property[],
      needs_confirmation: [] as Property[],
      active: [] as Property[],
      final_outcomes: [] as Property[],
      unavailable: [] as Property[],
      archived: [] as Property[],
      draft: [] as Property[],
    };

    properties.forEach((property) => {
      groups[getListingHealthGroup(property)].push(property);
    });

    return groups;
  }, [properties]);
  const trackedPublishProperty = useMemo(
    () => properties.find((property) => property.id === trackedPublishId) ?? null,
    [properties, trackedPublishId],
  );
  const trackedPublishTerminalState =
    trackedPublishProperty?.status === "active" ||
    (trackedPublishProperty?.status === "draft" && Boolean(trackedPublishProperty.publish_error));
  const isTrackedPublishSuccess = trackedPublishProperty?.status === "active";
  const isTrackedPublishDismissed = Boolean(
    trackedPublishProperty?.id && dismissedSuccessIds.includes(trackedPublishProperty.id),
  );
  const listingHealthValues = [
    summary.publishing,
    summary.needs_confirmation,
    summary.active,
    summary.final_outcomes,
    summary.draft,
  ];
  const listingHealthLabels = ["Publishing", "Confirm", "Active", "Outcomes", "Drafts"];
  const pendingOutcomeProperty = useMemo(
    () =>
      pendingOutcome
        ? properties.find((property) => property.id === pendingOutcome.propertyId) ?? null
        : null,
    [pendingOutcome, properties],
  );
  const pendingConfirmationProperty = useMemo(
    () =>
      pendingConfirmation
        ? properties.find((property) => property.id === pendingConfirmation.propertyId) ?? null
        : null,
    [pendingConfirmation, properties],
  );
  const pendingDraftDeleteProperty = useMemo(
    () =>
      pendingDraftDeleteId
        ? properties.find((property) => property.id === pendingDraftDeleteId) ?? null
        : null,
    [pendingDraftDeleteId, properties],
  );
  const pendingShortletExtensionProperty = useMemo(
    () =>
      pendingShortletExtensionId
        ? properties.find((property) => property.id === pendingShortletExtensionId) ?? null
        : null,
    [pendingShortletExtensionId, properties],
  );
  const activeInsightProperty = useMemo(
    () =>
      activeInsightPropertyId
        ? properties.find((property) => property.id === activeInsightPropertyId) ?? null
        : null,
    [activeInsightPropertyId, properties],
  );
  const activeInsight = useMemo(() => {
    if (!activeInsightPropertyId) {
      return null;
    }

    const existingInsight = insightByPropertyId.get(activeInsightPropertyId);
    if (existingInsight) {
      return existingInsight;
    }

    if (!activeInsightProperty) {
      return null;
    }

    return {
      property_id: activeInsightProperty.id,
      property_title: activeInsightProperty.title,
      property_area: activeInsightProperty.area,
      property_status: activeInsightProperty.status,
      property_is_verified: Boolean(activeInsightProperty.is_verified),
      view_count: 0,
      share_count: 0,
      cta_attempt_count: 0,
      wishlist_count: 0,
      like_count: 0,
      qualified_referrals: 0,
      open_referral_count: 0,
      under_review_count: 0,
      confirmed_count: 0,
      paid_count: 0,
      ineligible_count: 0,
      candidate_count: 0,
      latest_contact_at: null,
      resolution_summary: null,
    };
  }, [activeInsightProperty, activeInsightPropertyId, insightByPropertyId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.sessionStorage.getItem(DISMISSED_PUBLISH_SUCCESS_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setDismissedSuccessIds(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      window.sessionStorage.removeItem(DISMISSED_PUBLISH_SUCCESS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (publishingQueryId && publishingQueryId !== trackedPublishId) {
      setTrackedPublishId(publishingQueryId);
    }
  }, [publishingQueryId, trackedPublishId]);

  useEffect(() => {
    if (!publishingQueryId) {
      return;
    }

    if (trackedPublishTerminalState || (!propertiesQuery.isLoading && trackedPublishId && !trackedPublishProperty)) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("publishing");
      const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
      router.replace(nextUrl);
    }
  }, [
    pathname,
    propertiesQuery.isLoading,
    publishingQueryId,
    router,
    searchParams,
    trackedPublishId,
    trackedPublishProperty,
    trackedPublishTerminalState,
  ]);

  useEffect(() => {
    const agentId = agentQuery.data?.data?.id;

    if (!agentId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`agent-properties-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "properties",
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          propertiesQuery.refetch();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [agentQuery.data?.data?.id, propertiesQuery]);

  useEffect(() => {
    setMatchedUserId("");
  }, [pendingOutcome?.propertyId, pendingOutcome?.status]);

  useEffect(() => {
    const property = pendingOutcomeProperty ?? pendingConfirmationProperty;
    const status = pendingOutcome?.status ?? pendingConfirmation?.status ?? null;

    if (requiresDurationFields(property, status)) {
      setCloseDurationUnit(isShortletProperty(property) ? "days" : "years");
      return;
    }

    setCloseStartDate("");
    setCloseDurationValue("");
    setCloseDurationUnit("years");
  }, [pendingConfirmation?.status, pendingConfirmationProperty, pendingOutcome?.status, pendingOutcomeProperty]);

  const groupMeta: Array<{
    key: keyof typeof groupedProperties;
    title: string;
    description: string;
    help: string;
  }> = [
    {
      key: "publishing",
      title: "Publishing",
      description: "Listings accepted for publish and still being prepared to go live.",
      help:
        "Keep publishing separate from live inventory so agents can tell the difference between in-flight work and listings that are already visible in discovery.",
    },
    {
      key: "needs_confirmation",
      title: "Needs confirmation",
      description: "Listings that should be reconfirmed before trust drops.",
      help:
        "This is the first action-heavy group. Review it before passive listing history so stale inventory does not remain visible by accident.",
    },
    {
      key: "active",
      title: "Active",
      description: "Fresh, visible listings still healthy in discovery.",
      help:
        "Active listings are healthy right now, but they still need clear freshness labels and structured pricing to stay trustworthy.",
    },
    {
      key: "final_outcomes",
      title: "Final outcomes",
      description: "Completed listings split by Renyt-close and off-platform close.",
      help:
        "Final outcomes should remain traceable because referral review and lifecycle reporting depend on whether the close happened through Renyt or elsewhere.",
    },
    {
      key: "unavailable",
      title: "Unavailable",
      description: "Listings temporarily removed from direct-contact actions.",
      help:
        "Unavailable listings should no longer expose live message or call actions until availability is resolved.",
    },
    {
      key: "archived",
      title: "Archived",
      description: "Listings kept for history, not active demand.",
      help:
        "Archive history matters for accountability, but it should stay visually quieter than action-needed listing groups.",
    },
    {
      key: "draft",
      title: "Drafts",
      description: "Listings still blocked from publish or activation.",
      help:
        "Draft blockers should stay concise and explicit so agents can fix the listing without reading through long instruction copy.",
    },
  ];
  const visibleGroups = groupMeta.filter(
    (group) => groupedProperties[group.key].length > 0,
  );
  const sectionItems = visibleGroups.map((group) => ({
    id: `group-${group.key}`,
    label: group.title,
    count: groupedProperties[group.key].length,
  }));

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
      const result = await updateProperty.mutateAsync({ id: propertyId, data: { status } });
      const feedback = formatResolutionSummary(result.data?.referral_resolution_summary);
      if (feedback) {
        setResolutionFeedback((current) => ({ ...current, [propertyId]: feedback }));
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleConfirmStatusAction() {
    if (!pendingConfirmation) {
      return;
    }

    const { propertyId, status } = pendingConfirmation;
    const pendingProperty = properties.find((property) => property.id === propertyId) ?? null;
    setActiveAction(`${status}:${propertyId}`);

    try {
      const result = await updateProperty.mutateAsync({
        id: propertyId,
        data: {
          status,
          ...(requiresDurationFields(pendingProperty, status)
            ? {
                close_start_date: closeStartDate,
                close_duration_unit: closeDurationUnit,
                close_duration_value: Number(closeDurationValue),
              }
            : {}),
        },
      });
      const feedback = formatResolutionSummary(result.data?.referral_resolution_summary);
      if (feedback) {
        setResolutionFeedback((current) => ({ ...current, [propertyId]: feedback }));
      }

      setPendingConfirmation(null);
      setCloseStartDate("");
      setCloseDurationValue("");
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
              ? "Use this when the shortlet should stay visible but not accept new contact. Active stay messaging will continue until the host reconfirms availability."
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

  async function handleConfirmMatchedOutcome() {
    if (!pendingOutcome) {
      return;
    }

    setActiveAction(`${pendingOutcome.status}:${pendingOutcome.propertyId}`);
    try {
      const result = await updateProperty.mutateAsync({
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

      const feedback = formatResolutionSummary(result.data?.referral_resolution_summary);
      if (feedback) {
        setResolutionFeedback((current) => ({
          ...current,
          [pendingOutcome.propertyId]: feedback,
        }));
      }

      setPendingOutcome(null);
      setMatchedUserId("");
      setCloseStartDate("");
      setCloseDurationValue("");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleExtendShortletStay() {
    if (!pendingShortletExtensionId) {
      return;
    }

    setActiveAction(`extend:${pendingShortletExtensionId}`);
    try {
      await extendShortletOccupancy.mutateAsync({
        id: pendingShortletExtensionId,
        data: {
          additional_days: Number(additionalStayDays),
        },
      });
      setPendingShortletExtensionId(null);
      setAdditionalStayDays("");
    } finally {
      setActiveAction(null);
    }
  }

  function handleDismissPublishSuccess(propertyId: string) {
    const nextDismissedIds = Array.from(new Set([...dismissedSuccessIds, propertyId]));
    setDismissedSuccessIds(nextDismissedIds);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        DISMISSED_PUBLISH_SUCCESS_STORAGE_KEY,
        JSON.stringify(nextDismissedIds),
      );
    }
  }

  async function handleDeleteDraft() {
    if (!pendingDraftDeleteId) {
      return;
    }

    setActiveAction(`delete:${pendingDraftDeleteId}`);
    try {
      await deleteProperty.mutateAsync(pendingDraftDeleteId);
      setPendingDraftDeleteId(null);
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPanel padding="lg" className="space-y-4">
        <DashboardSectionHeading
          title="Listing Health"
          description="Track publishing, freshness risk, active inventory, and closed outcomes without scanning multiple summary cards."
          helper={
            <DashboardContextualHelp
              label="More information about listing health"
              title="Why this page is grouped"
            >
              Confirm availability, record final outcomes, and keep direct-contact surfaces trustworthy without scanning one long page.
            </DashboardContextualHelp>
          }
          action={
            <Link href="/dashboard/properties/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </Link>
          }
        />
      </DashboardPanel>

      <DashboardPanel padding="lg" className="space-y-4">
        <DashboardSectionHeading
          title="Health volume"
          description="A fast read on where your listing work is concentrated today."
        />
        <MiniBarChart
          ariaLabel="Listing health volume"
          values={listingHealthValues}
          labels={listingHealthLabels}
          highlightIndex={-1}
          isLoading={propertiesQuery.isLoading}
          emptyMessage="No listing activity yet. Add a property to start tracking listing health."
        />
      </DashboardPanel>

      {trackedPublishId && (!isTrackedPublishSuccess || !isTrackedPublishDismissed) ? (
        <Card className="border-0 shadow-sm ring-1 ring-black/5" aria-live="polite">
          <CardContent className="space-y-4 p-6">
            {trackedPublishProperty?.status === "active" ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Check className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Your property is now live
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Publishing completed. The listing is now active in My Properties.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => handleDismissPublishSuccess(trackedPublishProperty.id)}
                    aria-label="Dismiss publish success"
                  >
                    <X className="h-4 w-4" />
                    Dismiss
                  </Button>
                  <Link href="/dashboard/properties/new">
                    <Button>
                      <Plus className="h-4 w-4" />
                      Create Another Property
                    </Button>
                  </Link>
                  <Link href={`/properties/${trackedPublishProperty.id}`}>
                    <Button variant="secondary">
                      <Eye className="h-4 w-4" />
                      View Listing
                    </Button>
                  </Link>
                </div>
              </div>
            ) : trackedPublishProperty?.status === "draft" && trackedPublishProperty.publish_error ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-[var(--color-rejected)]">
                    <CircleAlert className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Publishing did not complete
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {trackedPublishProperty.publish_error}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/dashboard/properties/${trackedPublishProperty.id}/edit`}>
                    <Button>
                      <RefreshCw className="h-4 w-4" />
                      Retry Publish
                    </Button>
                  </Link>
                </div>
              </div>
            ) : trackedPublishProperty?.status === "publishing" || propertiesQuery.isLoading ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    </span>
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Publishing started
                      </h2>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        We&apos;re preparing this property to go live. This usually takes a few seconds, and you can keep working while we finish.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <StatusBadge status="publishing" size="sm" />
                    <span>Your property is not live yet.</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/properties/new">
                    <Button>
                      <Plus className="h-4 w-4" />
                      Create Another Property
                    </Button>
                  </Link>
                  {trackedPublishProperty ? (
                    <Link href={`/dashboard/properties/${trackedPublishProperty.id}/edit`}>
                      <Button variant="secondary">
                        <Edit3 className="h-4 w-4" />
                        Review Listing
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {propertiesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Plus className="h-8 w-8 text-[var(--color-deep-slate-blue)]" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              No properties yet
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              List your first property to start receiving direct renter contact.
            </p>
            <Link href="/dashboard/properties/new" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Add Your First Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
          <DashboardSectionNav items={sectionItems} className="order-2 xl:order-1" />

          <div className="order-1 min-w-0 space-y-6 xl:order-2">
            {visibleGroups.map((group) => {
              const items = groupedProperties[group.key];
              const showLifecycleActions = group.key === "needs_confirmation" || group.key === "active";

              return (
                <section
                  key={group.key}
                  id={`group-${group.key}`}
                  className="scroll-mt-28"
                >
                  <DashboardPanel padding="lg" className="space-y-4">
                    <DashboardSectionHeading
                      title={group.title}
                      description={group.description}
                      helper={
                        <DashboardContextualHelp
                          label={`More information about ${group.title.toLowerCase()}`}
                          title={group.title}
                        >
                          {group.help}
                        </DashboardContextualHelp>
                      }
                    />

                    <div className="space-y-3">
                      {items.map((p) => (
                        <Card key={p.id}>
                          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                            <div className="hidden h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:block">
                              {p.images?.[0] ? (
                                <img
                                  src={p.images[0].image_url}
                                  alt={p.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              {resolutionFeedback[p.id] ? (
                                <div className="mb-3 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                                  {resolutionFeedback[p.id]}
                                </div>
                              ) : null}
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate font-semibold text-[var(--color-text-primary)]">
                                  {p.title}
                                </h3>
                                <StatusBadge status={p.status} />
                                {trackedPublishProperty?.id === p.id && p.status === "publishing" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                    <LoaderCircle className="h-3 w-3 animate-spin" />
                                    Publishing in progress
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                                {formatListingPurpose(p.listing_purpose)} &middot; {formatPropertyType(p.property_type)}{" "}
                                &middot; {p.area} &middot; {p.bedrooms} bed, {p.bathrooms}{" "}
                                bath
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[var(--color-deep-slate-blue)]">
                                {
                                  formatPropertyPriceLabel({
                                    listingPurpose: p.listing_purpose,
                                    rentAmount: p.rent_amount,
                                    askingPrice: p.asking_price,
                                  }).amount
                                }
                              </p>
                              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                {getPropertyFreshnessLabel(p)}
                                {getPropertyFreshnessMeta(p)
                                  ? ` · ${getPropertyFreshnessMeta(p)}`
                                  : ""}
                              </p>
                              {getPropertyFinalOutcomeLabel(p.status) ? (
                                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                  {getPropertyFinalOutcomeLabel(p.status)}
                                </p>
                              ) : null}
                              {p.discovery_bookable === false && p.discovery_availability_label ? (
                                <p className="mt-2 text-xs font-medium text-amber-700">
                                  {p.discovery_availability_label}
                                  {p.discovery_available_from
                                    ? ` · Available from ${new Date(p.discovery_available_from).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                                    : ""}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1">
                                  <Eye className="h-3.5 w-3.5" />
                                  {insightByPropertyId.get(p.id)?.view_count ?? 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveInsightPropertyId(p.id)}
                                  className="font-medium text-[var(--color-deep-slate-blue)]"
                                >
                                  View insights
                                </button>
                              </div>
                              {p.status === "publishing" ? (
                                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                                  We&apos;re preparing this listing for search. You can publish another property while this completes.
                                </p>
                              ) : null}
                              {p.completion && p.status === "draft" && p.completion.blockers.length > 0 ? (
                                <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                                  Blocking publish: {p.completion.blockers.join(", ")}
                                </p>
                              ) : null}
                              {p.status === "draft" && p.publish_error ? (
                                <p className="mt-2 line-clamp-2 text-xs text-[var(--color-rejected)]">
                                  Last publish attempt failed: {p.publish_error}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-col gap-2 lg:w-[420px] lg:items-end">
                              {showLifecycleActions ? (
                                <div className="w-full rounded-[24px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                                  <div className="space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-secondary)]">
                                      Listing Health
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <ReferralShareTriggerButton
                                        property={p}
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
                                            onClick={() => handleConfirmAvailability(p.id)}
                                            isLoading={activeAction === `confirm:${p.id}`}
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
                                            onClick={() => handleStatusUpdate(p.id, "unavailable")}
                                            isLoading={activeAction === `unavailable:${p.id}`}
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
                                            onClick={() => handleStatusUpdate(p.id, "archived")}
                                            isLoading={activeAction === `archived:${p.id}`}
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
                                      {getOutcomeActions(p.listing_purpose).map((action) => {
                                        const presentation = getOutcomeActionStyles(action.status);
                                        const Icon = presentation.icon;

                                        return (
                                          <Button
                                            key={action.status}
                                            aria-label={action.label}
                                            variant={presentation.variant}
                                            size="sm"
                                            className={presentation.className}
                                            onClick={() => handleStatusUpdate(p.id, action.status)}
                                            isLoading={activeAction === `${action.status}:${p.id}`}
                                          >
                                            <Icon className="h-4 w-4" />
                                            {presentation.label}
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              {p.status === "unavailable" ? (
                                <div className="flex w-full flex-wrap justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="success"
                                    className="justify-start border border-emerald-700 shadow-sm shadow-emerald-100/80"
                                    onClick={() => handleConfirmAvailability(p.id)}
                                    isLoading={activeAction === `confirm:${p.id}`}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    Mark available
                                  </Button>
                                  {p.property_type === "shortlet" && p.active_shortlet_occupancy_hold ? (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="justify-start border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                                      onClick={() => setPendingShortletExtensionId(p.id)}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                      Extend stay
                                    </Button>
                                  ) : null}
                                </div>
                              ) : null}
                              <div className="flex items-center gap-2 lg:justify-end">
                                <Link href={p.status === "active" ? `/properties/${p.id}` : `/dashboard/properties/${p.id}/edit`}>
                                  <Button variant="ghost" size="icon">
                                    {p.status === "active" ? <Eye className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
                                  </Button>
                                </Link>
                                {p.status === "draft" ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete draft ${p.title}`}
                                    className="text-[var(--color-rejected)] hover:bg-red-50 hover:text-[var(--color-rejected)]"
                                    onClick={() => setPendingDraftDeleteId(p.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Link href={`/dashboard/properties/${p.id}/edit`}>
                                    <Button variant="ghost" size="icon">
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DashboardPanel>
                </section>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(pendingOutcome)}
        onClose={() => setPendingOutcome(null)}
        title={pendingOutcome?.status === "sold_renyt"
          ? "Mark sold via Renyt"
          : pendingOutcomeProperty?.property_type === "shortlet"
            ? "Mark shortlet booked via Renyt"
            : "Mark rented via Renyt"}
        ariaLabel="Confirm Renyt close outcome"
        dialogClassName="overflow-hidden"
        className="flex max-h-[calc(100dvh-1rem)] min-h-0 flex-col sm:max-h-[85vh]"
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
                      {candidate.referrer_name ? (
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          Referrer: {candidate.referrer_name} · {candidate.referrer_email ?? "No email"} · {candidate.referrer_phone ?? "No phone"}
                        </p>
                      ) : null}
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
        isOpen={Boolean(pendingShortletExtensionId)}
        onClose={() => setPendingShortletExtensionId(null)}
        title="Extend shortlet stay"
        ariaLabel="Extend shortlet occupancy"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Add the extra number of days for this current stay. The booked-until date and expected commission review snapshot will update.
          </p>

          {pendingShortletExtensionProperty ? (
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <p className="font-medium text-[var(--color-text-primary)]">{pendingShortletExtensionProperty.title}</p>
              <p className="mt-1">{pendingShortletExtensionProperty.discovery_availability_label ?? pendingShortletExtensionProperty.area}</p>
            </div>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--dashboard-text-secondary)]">Additional days</span>
            <input
              type="number"
              min={1}
              value={additionalStayDays}
              onChange={(event) => setAdditionalStayDays(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]"
            />
          </label>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPendingShortletExtensionId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleExtendShortletStay}
              isLoading={Boolean(
                pendingShortletExtensionId && activeAction === `extend:${pendingShortletExtensionId}`,
              )}
              disabled={!additionalStayDays || Number(additionalStayDays) <= 0}
            >
              Extend stay
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(pendingDraftDeleteId)}
        onClose={() => setPendingDraftDeleteId(null)}
        title="Delete draft"
        ariaLabel="Delete draft property"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Permanently remove this draft listing and all media saved on it.
          </p>

          {pendingDraftDeleteProperty ? (
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <p className="font-medium text-[var(--color-text-primary)]">{pendingDraftDeleteProperty.title}</p>
              <p className="mt-1">{pendingDraftDeleteProperty.area}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPendingDraftDeleteId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDraft}
              isLoading={Boolean(pendingDraftDeleteId && activeAction === `delete:${pendingDraftDeleteId}`)}
              className="bg-[var(--color-rejected)] text-white hover:bg-[var(--color-rejected)]/90"
            >
              Delete draft
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(activeInsight)}
        onClose={() => setActiveInsightPropertyId(null)}
        title="Property insights"
        ariaLabel="Property insights dialog"
        dialogClassName="max-w-2xl"
      >
        {activeInsight ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 rounded-3xl border border-[var(--dashboard-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">{activeInsight.property_area}</p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
                  {activeInsight.property_title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)] capitalize">
                  {activeInsight.property_status.replace(/_/g, " ")}
                </p>
              </div>
              {activeInsight.property_is_verified ? <Badge variant="verified">Verified</Badge> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 text-center">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--dashboard-text-secondary)]">Views</p>
                <p className="mt-4 text-5xl font-semibold leading-none text-[var(--color-text-primary)]">
                  {activeInsight.view_count}
                </p>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                  {activeInsight.latest_contact_at
                    ? `Latest contact ${new Date(activeInsight.latest_contact_at).toLocaleDateString()}`
                    : "No recent contact yet"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InsightMetricCard label="Shares" value={activeInsight.share_count} />
                <InsightMetricCard label="CTA attempts" value={activeInsight.cta_attempt_count} />
                <InsightMetricCard label="Wishlist" value={activeInsight.wishlist_count} />
                <InsightMetricCard label="Likes" value={activeInsight.like_count} />
                <InsightMetricCard label="Qualified referrals" value={activeInsight.qualified_referrals} />
                <InsightMetricCard label="Candidates" value={activeInsight.candidate_count} />
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-secondary)]">
                Referral pipeline
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <InsightMetricCard label="Open" value={activeInsight.open_referral_count} compact />
                <InsightMetricCard label="Under review" value={activeInsight.under_review_count} compact />
                <InsightMetricCard label="Confirmed" value={activeInsight.confirmed_count} compact />
                <InsightMetricCard label="Paid" value={activeInsight.paid_count} compact />
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setActiveInsightPropertyId(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function InsightMetricCard({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: number;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-[var(--dashboard-border)] bg-white ${compact ? "p-3" : "p-4"}`}>
      <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
      <p className={`mt-2 font-semibold text-[var(--color-text-primary)] ${compact ? "text-lg" : "text-2xl"}`}>
        {value}
      </p>
    </div>
  );
}
