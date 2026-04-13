"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Flag,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import {
  DashboardContextualHelp,
  DashboardPanel,
  DashboardSectionHeading,
  DashboardSectionNav,
  MetricCard,
} from "@/components/dashboard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  NumericInput,
  Select,
} from "@/components/ui";
import {
  useAdminListingFreshnessPolicy,
  useAdminReferralEvents,
  useAdminReferralProgram,
  useCreateReferralCampaign,
  useUpdateListingFreshnessPolicy,
  useUpdateReferralCampaign,
  useUpdateReferralEvent,
  useUpdateReferralProgramSettings,
} from "@/lib/hooks";
import {
  cn,
  formatCurrency,
  formatDate,
  formatListingFreshnessPolicySummary,
  getIneligibleReasonLabel,
  getReferralCloseStatusLabel,
} from "@/lib/utils";
import type {
  AdminReferralEvent,
  ListingFreshnessPolicy,
  ReferralCampaign,
  ReferralClosureStatus,
  ReferralCommissionBasisSource,
  ReferralCommissionPreview,
  ReferralCommissionType,
  ReferralEventStatus,
} from "@/types";

const FILTERS: Array<{ label: string; value: ReferralEventStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Potential", value: "potential" },
  { label: "Under review", value: "under_review" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Paid", value: "paid" },
  { label: "Ineligible", value: "ineligible" },
  { label: "Rejected", value: "rejected" },
];

type CampaignFormState = {
  name: string;
  description: string;
  is_active: boolean;
  priority: string;
  property_id: string;
  listing_purpose: "all" | "rent" | "sale";
  area: string;
  starts_at: string;
  ends_at: string;
  commission_type: ReferralCommissionType;
  commission_value: string;
  commission_basis_source: ReferralCommissionBasisSource;
  fallback_commission_amount: string;
};

function emptyCampaignForm(): CampaignFormState {
  return {
    name: "",
    description: "",
    is_active: true,
    priority: "0",
    property_id: "",
    listing_purpose: "all",
    area: "",
    starts_at: "",
    ends_at: "",
    commission_type: "fixed",
    commission_value: "20000",
    commission_basis_source: "none",
    fallback_commission_amount: "0",
  };
}

function campaignToForm(campaign: ReferralCampaign): CampaignFormState {
  return {
    name: campaign.name,
    description: campaign.description ?? "",
    is_active: campaign.is_active,
    priority: String(campaign.priority),
    property_id: campaign.property_id ?? "",
    listing_purpose: campaign.listing_purpose ?? "all",
    area: campaign.area ?? "",
    starts_at: campaign.starts_at ? campaign.starts_at.slice(0, 16) : "",
    ends_at: campaign.ends_at ? campaign.ends_at.slice(0, 16) : "",
    commission_type: campaign.commission_type,
    commission_value: String(campaign.commission_value),
    commission_basis_source: campaign.commission_basis_source,
    fallback_commission_amount: String(campaign.fallback_commission_amount),
  };
}

function statusVariant(status: ReferralEventStatus) {
  switch (status) {
    case "potential":
      return "pending" as const;
    case "under_review":
      return "info" as const;
    case "confirmed":
      return "verified" as const;
    case "paid":
      return "active" as const;
    case "ineligible":
      return "default" as const;
    case "rejected":
      return "rejected" as const;
  }
}

function statusLabel(status: ReferralEventStatus) {
  if (status === "under_review") {
    return "Under review";
  }

  if (status === "ineligible") {
    return "Ineligible";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function listingAuthorityLabel(value: AdminReferralEvent["listing_authority_mode"]) {
  if (value === "owner_agent") {
    return "Owner agent";
  }

  if (value === "authorized_listing_agent") {
    return "Authorized listing agent";
  }

  return "Not recorded";
}

function referralHoldReasonLabel(value: string | null) {
  if (value === "authority_review_required") {
    return "Authority review required before payout can proceed.";
  }

  return value;
}

function commissionSummary(preview: ReferralCommissionPreview) {
  if (preview.commission_type === "percentage") {
    return `${preview.commission_value}% of ${preview.commission_basis_label ?? "eligible amount"}`;
  }

  return formatCurrency(preview.estimated_amount);
}

function ruleSummary(input: {
  commission_type: ReferralCommissionType;
  commission_value: number;
  commission_basis_source: ReferralCommissionBasisSource;
  fallback_commission_amount: number;
}) {
  if (input.commission_type === "percentage") {
    const basisLabel = input.commission_basis_source.replace(/_/g, " ");
    return `${input.commission_value}% of ${basisLabel} · fallback ${formatCurrency(input.fallback_commission_amount)}`;
  }

  return `Fixed ${formatCurrency(input.commission_value)}`;
}

function policyToForm(policy: ListingFreshnessPolicy) {
  return {
    fresh_window_days: String(policy.fresh_window_days),
    confirmation_grace_days: String(policy.confirmation_grace_days),
    reminder_start_days: String(policy.reminder_start_days),
    reminder_interval_days: String(policy.reminder_interval_days),
    auto_mark_unavailable: policy.auto_mark_unavailable,
  };
}

function sumAmounts(
  events: AdminReferralEvent[],
  statuses: ReferralEventStatus[],
) {
  return events
    .filter((event) => statuses.includes(event.status))
    .reduce((total, event) => total + event.amount, 0);
}

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function AffixedNumericField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  format = "number",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  prefix?: string;
  suffix?: string;
  format?: "number" | "currency" | "decimal";
  placeholder?: string;
}) {
  const hasPrefix = Boolean(prefix);
  const hasSuffix = Boolean(suffix);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      <div className="relative">
        {hasPrefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm font-medium text-[var(--color-text-secondary)]">
            {prefix}
          </span>
        ) : null}
        <NumericInput
          value={toNullableNumber(value)}
          onValueChange={(nextValue) => onChange(nextValue === null ? "" : String(nextValue))}
          format={format}
          placeholder={placeholder}
          className={cn(hasPrefix ? "pl-8" : undefined, hasSuffix ? "pr-14" : undefined)}
        />
        {hasSuffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-sm font-medium text-[var(--color-text-secondary)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
}) {
  return (
    <Select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={options}
      placeholder={placeholder}
    />
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors",
        checked
          ? "border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-alt)]"
          : "border-[var(--color-border)] bg-white",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1"
      />
      <div>
        <p className="font-medium text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </label>
  );
}

function CompactConfigCard({
  title,
  description,
  summary,
  badge,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  summary: string;
  badge?: ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</p>
            <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">{description}</p>
          </div>
          {badge ? <div>{badge}</div> : null}
        </div>

        <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)] break-words">
          {summary}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCampaignScopeSummary(campaign: ReferralCampaign) {
  const scope = [] as string[];

  if (campaign.property_id) {
    scope.push(`Property ${campaign.property_id}`);
  }
  if (campaign.area) {
    scope.push(campaign.area);
  }
  if (campaign.listing_purpose) {
    scope.push(campaign.listing_purpose === "sale" ? "Sale only" : "Rent only");
  }

  return scope.length > 0 ? scope.join(" · ") : "All listings";
}

function formatCampaignWindowSummary(campaign: ReferralCampaign) {
  if (campaign.starts_at && campaign.ends_at) {
    return `${formatDate(campaign.starts_at)} to ${formatDate(campaign.ends_at)}`;
  }

  if (campaign.starts_at) {
    return `Starts ${formatDate(campaign.starts_at)}`;
  }

  if (campaign.ends_at) {
    return `Ends ${formatDate(campaign.ends_at)}`;
  }

  return "No campaign window";
}

function CampaignEditorCard({
  campaign,
  onSave,
  isSaving,
}: {
  campaign: ReferralCampaign;
  onSave: (id: string, data: Partial<ReferralCampaign>) => Promise<void>;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<CampaignFormState>(() => campaignToForm(campaign));

  useEffect(() => {
    setForm(campaignToForm(campaign));
  }, [campaign]);

  async function handleSave() {
    await onSave(campaign.id, {
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
      priority: Number(form.priority || 0),
      property_id: form.property_id.trim() || null,
      listing_purpose: form.listing_purpose === "all" ? null : form.listing_purpose,
      area: form.area.trim() || null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      commission_type: form.commission_type,
      commission_value: Number(form.commission_value || 0),
      commission_basis_source: form.commission_basis_source,
      fallback_commission_amount: Number(form.fallback_commission_amount || 0),
    });
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">{campaign.name}</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {ruleSummary(campaign)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={campaign.is_active ? "active" : "default"}>
              {campaign.is_active ? "Active" : "Paused"}
            </Badge>
            <Badge variant="info">Priority {campaign.priority}</Badge>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Input
            label="Campaign name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <AffixedNumericField
            label="Priority"
            value={form.priority}
            onChange={(nextValue) =>
              setForm((current) => ({ ...current, priority: nextValue }))
            }
            suffix="rank"
            placeholder="0"
          />
          <Input
            label="Area"
            value={form.area}
            onChange={(event) =>
              setForm((current) => ({ ...current, area: event.target.value }))
            }
            placeholder="Optional area scope"
          />
          <Input
            label="Property ID"
            value={form.property_id}
            onChange={(event) =>
              setForm((current) => ({ ...current, property_id: event.target.value }))
            }
            placeholder="Optional exact property"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            Campaign description
          </label>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            rows={3}
            placeholder="Optional campaign description"
            className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <SelectField
            label="Listing purpose"
            value={form.listing_purpose}
            onChange={(nextValue) =>
              setForm((current) => ({
                ...current,
                listing_purpose: nextValue as CampaignFormState["listing_purpose"],
              }))
            }
            options={[
              { value: "all", label: "All listings" },
              { value: "rent", label: "Rent only" },
              { value: "sale", label: "Sale only" },
            ]}
          />
          <SelectField
            label="Commission type"
            value={form.commission_type}
            onChange={(nextValue) =>
              setForm((current) => ({
                ...current,
                commission_type: nextValue as ReferralCommissionType,
              }))
            }
            options={[
              { value: "fixed", label: "Fixed" },
              { value: "percentage", label: "Percentage" },
            ]}
          />
          <AffixedNumericField
            label={form.commission_type === "percentage" ? "Commission" : "Commission value"}
            value={form.commission_value}
            onChange={(nextValue) =>
              setForm((current) => ({ ...current, commission_value: nextValue }))
            }
            prefix={form.commission_type === "fixed" ? "₦" : undefined}
            suffix={form.commission_type === "percentage" ? "%" : undefined}
            format={form.commission_type === "percentage" ? "decimal" : "currency"}
          />
          <SelectField
            label="Percentage basis"
            value={form.commission_basis_source}
            onChange={(nextValue) =>
              setForm((current) => ({
                ...current,
                commission_basis_source: nextValue as ReferralCommissionBasisSource,
              }))
            }
            options={[
              { value: "none", label: "None" },
              { value: "agency_fee", label: "Agency fee" },
              { value: "rent_amount", label: "Annual rent" },
              { value: "asking_price", label: "Asking price" },
            ]}
          />
          <AffixedNumericField
            label="Fallback amount"
            value={form.fallback_commission_amount}
            onChange={(nextValue) =>
              setForm((current) => ({ ...current, fallback_commission_amount: nextValue }))
            }
            prefix="₦"
            format="currency"
          />
          <ToggleCard
            checked={form.is_active}
            onChange={(checked) =>
              setForm((current) => ({ ...current, is_active: checked }))
            }
            title="Campaign active"
            description="Apply this override immediately when its scope matches a property."
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Input
            label="Starts at"
            type="datetime-local"
            value={form.starts_at}
            onChange={(event) =>
              setForm((current) => ({ ...current, starts_at: event.target.value }))
            }
          />
          <Input
            label="Ends at"
            type="datetime-local"
            value={form.ends_at}
            onChange={(event) =>
              setForm((current) => ({ ...current, ends_at: event.target.value }))
            }
          />
        </div>

        <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Rule preview: {ruleSummary({
            commission_type: form.commission_type,
            commission_value: Number(form.commission_value || 0),
            commission_basis_source: form.commission_basis_source,
            fallback_commission_amount: Number(form.fallback_commission_amount || 0),
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={isSaving}>
            Save campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminReferralReview() {
  const [statusFilter, setStatusFilter] = useState<ReferralEventStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeConfigModal, setActiveConfigModal] = useState<
    "freshness" | "program" | "campaign-create" | null
  >(null);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [closeStatus, setCloseStatus] = useState<ReferralClosureStatus | "">("");
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(emptyCampaignForm);
  const [settingsForm, setSettingsForm] = useState({
    is_enabled: true,
    default_commission_type: "fixed" as ReferralCommissionType,
    default_commission_value: "20000",
    default_basis_source: "none" as ReferralCommissionBasisSource,
    fallback_commission_amount: "20000",
    terms_version: "launch-v1",
  });
  const [freshnessPolicyForm, setFreshnessPolicyForm] = useState({
    fresh_window_days: "14",
    confirmation_grace_days: "7",
    reminder_start_days: "10",
    reminder_interval_days: "2",
    auto_mark_unavailable: true,
  });

  const freshnessPolicyQuery = useAdminListingFreshnessPolicy();
  const programQuery = useAdminReferralProgram();
  const updateFreshnessPolicy = useUpdateListingFreshnessPolicy();
  const updateProgramSettings = useUpdateReferralProgramSettings();
  const createCampaign = useCreateReferralCampaign();
  const updateCampaign = useUpdateReferralCampaign();
  const eventsQuery = useAdminReferralEvents({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search.trim() || undefined,
    limit: 100,
  });
  const updateReferralEvent = useUpdateReferralEvent();

  const freshnessPolicy = freshnessPolicyQuery.data?.data ?? null;
  const program = programQuery.data?.data;
  const settings = program?.settings ?? null;
  const campaigns = program?.campaigns ?? [];
  const events = eventsQuery.data?.data ?? [];
  const editingCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === editingCampaignId) ?? null,
    [campaigns, editingCampaignId],
  );

  useEffect(() => {
    if (!freshnessPolicy) {
      return;
    }

    setFreshnessPolicyForm(policyToForm(freshnessPolicy));
  }, [freshnessPolicy?.id]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setSettingsForm({
      is_enabled: settings.is_enabled,
      default_commission_type: settings.default_commission_type,
      default_commission_value: String(settings.default_commission_value),
      default_basis_source: settings.default_basis_source,
      fallback_commission_amount: String(settings.fallback_commission_amount),
      terms_version: settings.terms_version,
    });
  }, [settings?.id]);

  useEffect(() => {
    if (events.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !events.some((event) => event.id === selectedId)) {
      setSelectedId(events[0].id);
    }
  }, [events, selectedId]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );

  useEffect(() => {
    if (!selectedEvent) {
      return;
    }

    setRejectionReason(selectedEvent.rejection_reason ?? "");
    setAdminNote(selectedEvent.admin_note ?? "");
    setCloseStatus(selectedEvent.close_status ?? "");
  }, [selectedEvent?.id]);

  const reviewQueueCount = events.filter(
    (event) => event.status === "potential" || event.status === "under_review",
  ).length;
  const activeCampaignCount = campaigns.filter((campaign) => campaign.is_active).length;
  const confirmedValue = sumAmounts(events, ["confirmed"]);
  const paidValue = sumAmounts(events, ["paid"]);
  const sectionItems = [
    { id: "referrals-overview", label: "Overview", count: reviewQueueCount },
    { id: "referrals-freshness", label: "Freshness" },
    { id: "referrals-program", label: "Program", count: activeCampaignCount },
    { id: "referrals-campaigns", label: "Campaigns", count: campaigns.length },
    { id: "referrals-review", label: "Review", count: events.length },
  ];

  async function handleFreshnessPolicySave() {
    await updateFreshnessPolicy.mutateAsync({
      fresh_window_days: Number(freshnessPolicyForm.fresh_window_days || 0),
      confirmation_grace_days: Number(freshnessPolicyForm.confirmation_grace_days || 0),
      reminder_start_days: Number(freshnessPolicyForm.reminder_start_days || 0),
      reminder_interval_days: Number(freshnessPolicyForm.reminder_interval_days || 0),
      auto_mark_unavailable: freshnessPolicyForm.auto_mark_unavailable,
    });
    setActiveConfigModal(null);
  }

  async function handleProgramSave() {
    await updateProgramSettings.mutateAsync({
      is_enabled: settingsForm.is_enabled,
      default_commission_type: settingsForm.default_commission_type,
      default_commission_value: Number(settingsForm.default_commission_value || 0),
      default_basis_source: settingsForm.default_basis_source,
      fallback_commission_amount: Number(settingsForm.fallback_commission_amount || 0),
      terms_version: settingsForm.terms_version.trim(),
    });
    setActiveConfigModal(null);
  }

  async function handleCreateCampaign(event: FormEvent) {
    event.preventDefault();

    await createCampaign.mutateAsync({
      name: campaignForm.name.trim(),
      description: campaignForm.description.trim() || null,
      is_active: campaignForm.is_active,
      priority: Number(campaignForm.priority || 0),
      property_id: campaignForm.property_id.trim() || null,
      listing_purpose:
        campaignForm.listing_purpose === "all" ? null : campaignForm.listing_purpose,
      area: campaignForm.area.trim() || null,
      starts_at: campaignForm.starts_at || null,
      ends_at: campaignForm.ends_at || null,
      commission_type: campaignForm.commission_type,
      commission_value: Number(campaignForm.commission_value || 0),
      commission_basis_source: campaignForm.commission_basis_source,
      fallback_commission_amount: Number(campaignForm.fallback_commission_amount || 0),
    });

    setCampaignForm(emptyCampaignForm());
    setActiveConfigModal(null);
  }

  async function handleCampaignSave(id: string, data: Partial<ReferralCampaign>) {
    await updateCampaign.mutateAsync({ id, data });
    setEditingCampaignId(null);
  }

  async function handleStatusUpdate(status: ReferralEventStatus) {
    if (!selectedEvent) {
      return;
    }

    await updateReferralEvent.mutateAsync({
      id: selectedEvent.id,
      data: {
        status,
        close_status: closeStatus || null,
        rejection_reason: status === "rejected" ? rejectionReason : null,
        admin_note: adminNote || null,
      },
    });
  }

  return (
    <div className="space-y-6">
      <DashboardPanel
        id="referrals-overview"
        padding="lg"
        tone="accent"
        className="space-y-5 scroll-mt-28"
      >
        <DashboardSectionHeading
          title="Referral operations"
          description="Separate policy, campaign incentives, and payout review so admins can understand what to change before touching numbers."
          helper={
            <DashboardContextualHelp
              label="More information about referral operations"
              title="Why this page is grouped"
            >
              Referral management mixes freshness policy, commission rules, campaign overrides, and payout review. These sections keep operational settings away from event-by-event adjudication.
            </DashboardContextualHelp>
          }
          action={
            <Badge variant={settingsForm.is_enabled ? "dashboardSuccess" : "dashboardWarning"}>
              {settingsForm.is_enabled ? "Program live" : "Program paused"}
            </Badge>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ClipboardList}
            label="Review queue"
            value={eventsQuery.isLoading ? "..." : reviewQueueCount}
            meta="Potential or under-review referrals"
            emphasis={reviewQueueCount > 0 ? "highlight" : "default"}
          />
          <MetricCard
            icon={Settings2}
            label="Active campaigns"
            value={programQuery.isLoading ? "..." : activeCampaignCount}
            meta="Overrides currently in effect"
          />
          <MetricCard
            icon={ReceiptText}
            label="Confirmed value"
            value={eventsQuery.isLoading ? "..." : formatCurrency(confirmedValue)}
            meta="Awaiting payout transition"
          />
          <MetricCard
            icon={Wallet}
            label="Paid value"
            value={eventsQuery.isLoading ? "..." : formatCurrency(paidValue)}
            meta="Referral payouts already completed"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
          <DashboardSectionNav items={sectionItems} className="order-2 xl:order-1" />

          <div className="order-1 min-w-0 grid gap-4 md:grid-cols-3 xl:order-2">
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
              <div className="flex items-start gap-3">
                <Clock3 className="h-5 w-5 text-[var(--dashboard-accent)]" />
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)]">Freshness control</p>
                  <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">
                    Keep listing reminder timing distinct from commission policy.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
              <div className="flex items-start gap-3">
                <Settings2 className="h-5 w-5 text-[var(--dashboard-accent)]" />
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)]">Commission defaults</p>
                  <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">
                    Use ₦ and % fields so the payout rule is obvious at a glance.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[var(--dashboard-accent)]" />
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)]">Review actions</p>
                  <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">
                    Outcome, notes, and payout actions stay in one adjudication panel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardPanel>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
        <DashboardSectionNav items={sectionItems} className="hidden xl:block" />

        <div className="min-w-0 space-y-6">
          <section id="referrals-freshness" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Listing freshness policy"
                description="Tune how long listings stay fresh, when reminder emails start, and when stale inventory should leave direct-contact surfaces."
                helper={
                  <DashboardContextualHelp
                    label="More information about listing freshness policy"
                    title="Why this lives here"
                  >
                    Referral quality depends on inventory trust. Keeping freshness policy visible here makes it easier to reason about conversion quality and payout fairness together.
                  </DashboardContextualHelp>
                }
              />

              <CompactConfigCard
                title="Listing freshness policy"
                description="Keep this compact until you need to tune reminder timing or automatic stale-listing removal."
                summary={formatListingFreshnessPolicySummary({
                  fresh_window_days: Number(freshnessPolicyForm.fresh_window_days || 0),
                  confirmation_grace_days: Number(freshnessPolicyForm.confirmation_grace_days || 0),
                  reminder_start_days: Number(freshnessPolicyForm.reminder_start_days || 0),
                  reminder_interval_days: Number(freshnessPolicyForm.reminder_interval_days || 0),
                  auto_mark_unavailable: freshnessPolicyForm.auto_mark_unavailable,
                })}
                badge={
                  <Badge variant={freshnessPolicyForm.auto_mark_unavailable ? "dashboardSuccess" : "dashboardWarning"}>
                    {freshnessPolicyForm.auto_mark_unavailable ? "Auto-close stale listings" : "Manual stale close"}
                  </Badge>
                }
                actionLabel="Configure policy"
                onAction={() => setActiveConfigModal("freshness")}
              />
            </DashboardPanel>
          </section>

          <section id="referrals-program" className="scroll-mt-28">
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <DashboardPanel padding="lg" className="space-y-5">
                <DashboardSectionHeading
                  title="Program defaults"
                  description="The fallback rule that applies whenever no active campaign override matches a property."
                />

                <CompactConfigCard
                  title="Program defaults"
                  description="Global referral rule used whenever no active override matches the listing."
                  summary={`${settingsForm.is_enabled ? "Program enabled" : "Program paused"} · ${ruleSummary({
                    commission_type: settingsForm.default_commission_type,
                    commission_value: Number(settingsForm.default_commission_value || 0),
                    commission_basis_source: settingsForm.default_basis_source,
                    fallback_commission_amount: Number(settingsForm.fallback_commission_amount || 0),
                  })} · Terms ${settingsForm.terms_version}`}
                  badge={
                    <Badge variant={settingsForm.is_enabled ? "dashboardSuccess" : "dashboardWarning"}>
                      {settingsForm.is_enabled ? "Live" : "Paused"}
                    </Badge>
                  }
                  actionLabel="Configure defaults"
                  onAction={() => setActiveConfigModal("program")}
                />
              </DashboardPanel>

              <DashboardPanel padding="lg" className="space-y-5">
                <DashboardSectionHeading
                  title="Add campaign override"
                  description="Create a more targeted payout rule for a property, listing purpose, or area without losing the global default rule."
                />

                <CompactConfigCard
                  title="Add campaign override"
                  description="Create a scoped incentive without leaving the review page crowded by an always-open form."
                  summary={campaignForm.name.trim()
                    ? `${campaignForm.name.trim()} · ${campaignForm.listing_purpose === "all" ? "All listings" : campaignForm.listing_purpose === "sale" ? "Sale only" : "Rent only"} · ${ruleSummary({
                        commission_type: campaignForm.commission_type,
                        commission_value: Number(campaignForm.commission_value || 0),
                        commission_basis_source: campaignForm.commission_basis_source,
                        fallback_commission_amount: Number(campaignForm.fallback_commission_amount || 0),
                      })}`
                    : "Start a new override for a property, area, or listing purpose when the default payout rule should not apply."}
                  badge={<Badge variant="dashboard">New override</Badge>}
                  actionLabel="Configure override"
                  onAction={() => setActiveConfigModal("campaign-create")}
                />
              </DashboardPanel>
            </div>
          </section>

          <section id="referrals-campaigns" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Campaign overrides"
                description="Campaigns stay separate from default rules so temporary incentives do not obscure the base payout policy."
                action={
                  <Badge variant="dashboard">{campaigns.length} configured</Badge>
                }
              />

              {campaigns.length === 0 ? (
                <Card>
                  <CardContent>
                    <EmptyState
                      icon={<Plus className="h-7 w-7" />}
                      title="No campaign overrides yet"
                      description="Create a campaign when referral payouts need to vary by property, area, or listing purpose."
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 2xl:grid-cols-2">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-lg font-semibold text-[var(--color-text-primary)]">{campaign.name}</p>
                            <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">
                              {ruleSummary(campaign)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={campaign.is_active ? "active" : "default"}>
                              {campaign.is_active ? "Active" : "Paused"}
                            </Badge>
                            <Badge variant="info">Priority {campaign.priority}</Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                          <p className="break-words">Scope: {formatCampaignScopeSummary(campaign)}</p>
                          <p className="break-words">Window: {formatCampaignWindowSummary(campaign)}</p>
                          {campaign.description ? <p className="break-words">{campaign.description}</p> : null}
                        </div>

                        <div className="flex justify-end">
                          <Button variant="secondary" onClick={() => setEditingCampaignId(campaign.id)}>
                            Configure override
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </DashboardPanel>
          </section>

          <Modal
            isOpen={activeConfigModal === "freshness"}
            onClose={() => setActiveConfigModal(null)}
            title="Configure listing freshness policy"
            dialogClassName="max-w-3xl"
            ariaLabel="Configure listing freshness policy"
          >
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <AffixedNumericField
                  label="Fresh window"
                  value={freshnessPolicyForm.fresh_window_days}
                  onChange={(nextValue) =>
                    setFreshnessPolicyForm((current) => ({
                      ...current,
                      fresh_window_days: nextValue,
                    }))
                  }
                  suffix="days"
                />
                <AffixedNumericField
                  label="Grace period"
                  value={freshnessPolicyForm.confirmation_grace_days}
                  onChange={(nextValue) =>
                    setFreshnessPolicyForm((current) => ({
                      ...current,
                      confirmation_grace_days: nextValue,
                    }))
                  }
                  suffix="days"
                />
                <AffixedNumericField
                  label="Reminder start"
                  value={freshnessPolicyForm.reminder_start_days}
                  onChange={(nextValue) =>
                    setFreshnessPolicyForm((current) => ({
                      ...current,
                      reminder_start_days: nextValue,
                    }))
                  }
                  suffix="days"
                />
                <AffixedNumericField
                  label="Reminder interval"
                  value={freshnessPolicyForm.reminder_interval_days}
                  onChange={(nextValue) =>
                    setFreshnessPolicyForm((current) => ({
                      ...current,
                      reminder_interval_days: nextValue,
                    }))
                  }
                  suffix="days"
                />
              </div>

              <ToggleCard
                checked={freshnessPolicyForm.auto_mark_unavailable}
                onChange={(checked) =>
                  setFreshnessPolicyForm((current) => ({
                    ...current,
                    auto_mark_unavailable: checked,
                  }))
                }
                title="Auto-mark stale listings unavailable"
                description="Stop stale inventory from continuing to attract direct renter contact after the grace period."
              />

              <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                {formatListingFreshnessPolicySummary({
                  fresh_window_days: Number(freshnessPolicyForm.fresh_window_days || 0),
                  confirmation_grace_days: Number(freshnessPolicyForm.confirmation_grace_days || 0),
                  reminder_start_days: Number(freshnessPolicyForm.reminder_start_days || 0),
                  reminder_interval_days: Number(freshnessPolicyForm.reminder_interval_days || 0),
                  auto_mark_unavailable: freshnessPolicyForm.auto_mark_unavailable,
                })}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setActiveConfigModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleFreshnessPolicySave}
                  isLoading={updateFreshnessPolicy.isPending || freshnessPolicyQuery.isLoading}
                >
                  Save freshness policy
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={activeConfigModal === "program"}
            onClose={() => setActiveConfigModal(null)}
            title="Configure program defaults"
            dialogClassName="max-w-3xl"
            ariaLabel="Configure program defaults"
          >
            <div className="space-y-5">
              <ToggleCard
                checked={settingsForm.is_enabled}
                onChange={(checked) =>
                  setSettingsForm((current) => ({ ...current, is_enabled: checked }))
                }
                title="Referral program enabled"
                description="Pause this only when you want to stop all new referral qualification from producing payout expectations."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Default commission type"
                  value={settingsForm.default_commission_type}
                  onChange={(nextValue) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_commission_type: nextValue as ReferralCommissionType,
                    }))
                  }
                  options={[
                    { value: "fixed", label: "Fixed" },
                    { value: "percentage", label: "Percentage" },
                  ]}
                />
                <AffixedNumericField
                  label="Default commission"
                  value={settingsForm.default_commission_value}
                  onChange={(nextValue) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_commission_value: nextValue,
                    }))
                  }
                  prefix={settingsForm.default_commission_type === "fixed" ? "₦" : undefined}
                  suffix={settingsForm.default_commission_type === "percentage" ? "%" : undefined}
                  format={settingsForm.default_commission_type === "percentage" ? "decimal" : "currency"}
                />
                <SelectField
                  label="Percentage basis"
                  value={settingsForm.default_basis_source}
                  onChange={(nextValue) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_basis_source: nextValue as ReferralCommissionBasisSource,
                    }))
                  }
                  options={[
                    { value: "none", label: "None" },
                    { value: "agency_fee", label: "Agency fee" },
                    { value: "rent_amount", label: "Annual rent" },
                    { value: "asking_price", label: "Asking price" },
                  ]}
                />
                <AffixedNumericField
                  label="Fallback amount"
                  value={settingsForm.fallback_commission_amount}
                  onChange={(nextValue) =>
                    setSettingsForm((current) => ({
                      ...current,
                      fallback_commission_amount: nextValue,
                    }))
                  }
                  prefix="₦"
                  format="currency"
                />
              </div>

              <Input
                label="Terms version"
                value={settingsForm.terms_version}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    terms_version: event.target.value,
                  }))
                }
              />

              <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                Current default: {ruleSummary({
                  commission_type: settingsForm.default_commission_type,
                  commission_value: Number(settingsForm.default_commission_value || 0),
                  commission_basis_source: settingsForm.default_basis_source,
                  fallback_commission_amount: Number(settingsForm.fallback_commission_amount || 0),
                })}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setActiveConfigModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProgramSave}
                  isLoading={updateProgramSettings.isPending || programQuery.isLoading}
                >
                  Save defaults
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={activeConfigModal === "campaign-create"}
            onClose={() => setActiveConfigModal(null)}
            title="Create campaign override"
            dialogClassName="max-w-4xl"
            ariaLabel="Create campaign override"
          >
            <form onSubmit={handleCreateCampaign} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Campaign name"
                  value={campaignForm.name}
                  onChange={(event) =>
                    setCampaignForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <AffixedNumericField
                  label="Priority"
                  value={campaignForm.priority}
                  onChange={(nextValue) =>
                    setCampaignForm((current) => ({ ...current, priority: nextValue }))
                  }
                  suffix="rank"
                />
                <Input
                  label="Area"
                  value={campaignForm.area}
                  onChange={(event) =>
                    setCampaignForm((current) => ({ ...current, area: event.target.value }))
                  }
                  placeholder="Optional area scope"
                />
                <Input
                  label="Property ID"
                  value={campaignForm.property_id}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      property_id: event.target.value,
                    }))
                  }
                  placeholder="Optional exact property"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                  Campaign description
                </label>
                <textarea
                  value={campaignForm.description}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Optional campaign description"
                  className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <SelectField
                  label="Listing purpose"
                  value={campaignForm.listing_purpose}
                  onChange={(nextValue) =>
                    setCampaignForm((current) => ({
                      ...current,
                      listing_purpose: nextValue as CampaignFormState["listing_purpose"],
                    }))
                  }
                  options={[
                    { value: "all", label: "All listings" },
                    { value: "rent", label: "Rent only" },
                    { value: "sale", label: "Sale only" },
                  ]}
                />
                <SelectField
                  label="Commission type"
                  value={campaignForm.commission_type}
                  onChange={(nextValue) =>
                    setCampaignForm((current) => ({
                      ...current,
                      commission_type: nextValue as ReferralCommissionType,
                    }))
                  }
                  options={[
                    { value: "fixed", label: "Fixed" },
                    { value: "percentage", label: "Percentage" },
                  ]}
                />
                <AffixedNumericField
                  label="Commission"
                  value={campaignForm.commission_value}
                  onChange={(nextValue) =>
                    setCampaignForm((current) => ({
                      ...current,
                      commission_value: nextValue,
                    }))
                  }
                  prefix={campaignForm.commission_type === "fixed" ? "₦" : undefined}
                  suffix={campaignForm.commission_type === "percentage" ? "%" : undefined}
                  format={campaignForm.commission_type === "percentage" ? "decimal" : "currency"}
                />
                <SelectField
                  label="Percentage basis"
                  value={campaignForm.commission_basis_source}
                  onChange={(nextValue) =>
                    setCampaignForm((current) => ({
                      ...current,
                      commission_basis_source: nextValue as ReferralCommissionBasisSource,
                    }))
                  }
                  options={[
                    { value: "none", label: "None" },
                    { value: "agency_fee", label: "Agency fee" },
                    { value: "rent_amount", label: "Annual rent" },
                    { value: "asking_price", label: "Asking price" },
                  ]}
                />
                <AffixedNumericField
                  label="Fallback amount"
                  value={campaignForm.fallback_commission_amount}
                  onChange={(nextValue) =>
                    setCampaignForm((current) => ({
                      ...current,
                      fallback_commission_amount: nextValue,
                    }))
                  }
                  prefix="₦"
                  format="currency"
                />
                <ToggleCard
                  checked={campaignForm.is_active}
                  onChange={(checked) =>
                    setCampaignForm((current) => ({
                      ...current,
                      is_active: checked,
                    }))
                  }
                  title="Start active"
                  description="Make the override immediately eligible for matching properties."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Starts at"
                  type="datetime-local"
                  value={campaignForm.starts_at}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      starts_at: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Ends at"
                  type="datetime-local"
                  value={campaignForm.ends_at}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      ends_at: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                Preview: {ruleSummary({
                  commission_type: campaignForm.commission_type,
                  commission_value: Number(campaignForm.commission_value || 0),
                  commission_basis_source: campaignForm.commission_basis_source,
                  fallback_commission_amount: Number(campaignForm.fallback_commission_amount || 0),
                })}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setActiveConfigModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createCampaign.isPending}>
                  <Plus className="h-4 w-4" />
                  Add campaign
                </Button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={Boolean(editingCampaign)}
            onClose={() => setEditingCampaignId(null)}
            title={editingCampaign ? `Configure ${editingCampaign.name}` : "Configure campaign override"}
            dialogClassName="max-w-4xl"
            ariaLabel="Configure campaign override"
          >
            {editingCampaign ? (
              <CampaignEditorCard
                campaign={editingCampaign}
                onSave={handleCampaignSave}
                isSaving={updateCampaign.isPending}
              />
            ) : null}
          </Modal>

          <section id="referrals-review" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Referral review queue"
                description="Filter events, inspect evidence, and record the close outcome before approving or rejecting a payout."
                helper={
                  <DashboardContextualHelp
                    label="More information about referral review"
                    title="How to use review"
                  >
                    Keep the left side for finding the right event quickly and the right side for adjudication. That prevents search noise from mixing with payout actions.
                  </DashboardContextualHelp>
                }
              />

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setStatusFilter(filter.value)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        statusFilter === filter.value
                          ? "border-[var(--color-deep-slate-blue)] bg-[var(--color-deep-slate-blue)] text-white"
                          : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="w-full lg:max-w-sm">
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                    Search referrals
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                    <Input
                      id="referral-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by referrer, code, property, or campaign"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {eventsQuery.isLoading ? (
                <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                  <div className="h-[520px] animate-pulse rounded-2xl bg-gray-100" />
                  <div className="h-[520px] animate-pulse rounded-2xl bg-gray-100" />
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent>
                    <EmptyState
                      icon={<ClipboardList className="h-7 w-7" />}
                      title="No referral events match this filter"
                      description="Referral review items will appear here as users start sharing properties and creating qualified message events."
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      {events.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => setSelectedId(event.id)}
                          className={cn(
                            "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                            selectedId === event.id
                              ? "border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-alt)]"
                              : "border-[var(--color-border)] hover:bg-gray-50",
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--color-text-primary)]">
                                {event.property_title}
                              </p>
                              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                {event.referrer_name} → {event.referred_name ?? "Signed-in visitor"}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
                                <span>{event.property_area}</span>
                                <span>•</span>
                                <span>{formatDate(event.created_at)}</span>
                                <span>•</span>
                                <span>{event.source_channel.replace(/_/g, " ")}</span>
                              </div>
                              {event.campaign_name ? (
                                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                                  Campaign: {event.campaign_name}
                                </p>
                              ) : null}
                              {event.referral_hold_reason ? (
                                <p className="mt-2 text-xs font-medium text-[var(--color-pending)]">
                                  Hold: {referralHoldReasonLabel(event.referral_hold_reason)}
                                </p>
                              ) : null}
                            </div>
                            <div className="w-full text-left sm:w-auto sm:text-right">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {formatCurrency(event.amount)}
                              </p>
                              <Badge variant={statusVariant(event.status)}>
                                {statusLabel(event.status)}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  {selectedEvent ? (
                    <Card>
                      <CardContent className="space-y-5 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="break-words text-xl font-semibold text-[var(--color-text-primary)]">
                              {selectedEvent.property_title}
                            </h2>
                            <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">
                              {selectedEvent.property_area} · {selectedEvent.property_status}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedEvent.property_is_verified ? (
                              <Badge variant="verified">Verified</Badge>
                            ) : null}
                            <Badge variant={statusVariant(selectedEvent.status)}>
                              {statusLabel(selectedEvent.status)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Referrer
                            </p>
                            <p className="mt-1 break-words text-sm font-medium text-[var(--color-text-primary)]">
                              {selectedEvent.referrer_name}
                            </p>
                            <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">
                              Code: {selectedEvent.referral_code}
                            </p>
                            <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">
                              {selectedEvent.referrer_email ?? "No email"} · {selectedEvent.referrer_phone ?? "No phone"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Referred user
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                              {selectedEvent.referred_name ?? "Signed-in visitor"}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              Source: {selectedEvent.source_channel.replace(/_/g, " ")}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Commission
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                              {selectedEvent.commission_type === "percentage"
                                ? `${selectedEvent.commission_value}% of ${selectedEvent.commission_basis_label ?? "eligible amount"}`
                                : `Fixed ${formatCurrency(selectedEvent.amount)}`}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              Estimated payout: {formatCurrency(selectedEvent.amount)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Rule source
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                              {selectedEvent.campaign_name ?? "Default program rule"}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              {commissionSummary({
                                commission_type: selectedEvent.commission_type,
                                commission_value: selectedEvent.commission_value,
                                commission_basis_label: selectedEvent.commission_basis_label,
                                commission_basis_amount: selectedEvent.commission_basis_amount,
                                estimated_amount: selectedEvent.amount,
                              })}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Listing authority
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                              {listingAuthorityLabel(selectedEvent.listing_authority_mode)}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              {selectedEvent.commission_share_percent_snapshot !== null
                                ? `Declared share ${selectedEvent.commission_share_percent_snapshot}%`
                                : "No declared share required for this authority mode."}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Basis snapshot
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                              {selectedEvent.eligible_basis_snapshot_amount !== null
                                ? formatCurrency(selectedEvent.eligible_basis_snapshot_amount)
                                : "Not captured"}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              Public basis {selectedEvent.commission_basis_snapshot_amount !== null
                                ? formatCurrency(selectedEvent.commission_basis_snapshot_amount)
                                : "—"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Timeline
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                              Created {formatDate(selectedEvent.created_at)}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              {selectedEvent.confirmed_at
                                ? `Confirmed ${formatDate(selectedEvent.confirmed_at)}`
                                : "Not confirmed yet"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Close outcome
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                              {getReferralCloseStatusLabel(selectedEvent.close_status)}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              {selectedEvent.close_recorded_at
                                ? `Recorded ${formatDate(selectedEvent.close_recorded_at)}`
                                : "Record whether this closed through Renyt or off-platform before confirming payout."}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--color-bg)] px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                              Matched account
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                              {selectedEvent.matched_user_name ?? "No matched account selected"}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              {selectedEvent.matched_user_email ?? "No email"} · {selectedEvent.matched_user_phone ?? "No phone"}
                            </p>
                          </div>
                        </div>

                        {selectedEvent.is_winning_referral ? (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                            This referral is currently the winning matched-account candidate.
                          </div>
                        ) : null}

                        {selectedEvent.referral_hold_reason ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            {referralHoldReasonLabel(selectedEvent.referral_hold_reason)}
                          </div>
                        ) : null}

                        {selectedEvent.status === "ineligible" ? (
                          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                            Ineligible reason: {getIneligibleReasonLabel(selectedEvent.ineligible_reason)}
                          </div>
                        ) : null}

                        {selectedEvent.fraud_flags.length > 0 ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <div className="flex items-start gap-3">
                              <ShieldAlert className="mt-0.5 h-5 w-5 text-[var(--color-pending)]" />
                              <div>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                  Fraud flags
                                </p>
                                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                  {selectedEvent.fraud_flags.join(", ")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {selectedEvent.rejection_reason ? (
                          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                            {selectedEvent.rejection_reason}
                          </div>
                        ) : null}

                        <div className="grid gap-4 lg:grid-cols-2">
                          <SelectField
                            label="Close outcome"
                            value={closeStatus}
                            onChange={(nextValue) =>
                              setCloseStatus(nextValue as ReferralClosureStatus | "")
                            }
                            placeholder="Select outcome"
                            options={[
                              { value: "rented_renyt", label: "Rented via Renyt" },
                              { value: "rented_off_platform", label: "Rented off-platform" },
                              { value: "sold_renyt", label: "Sold via Renyt" },
                              { value: "sold_off_platform", label: "Sold off-platform" },
                            ]}
                          />

                          <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                            Commission approval depends on whether the close happened through Renyt or outside the platform.
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                            Admin note
                          </label>
                          <textarea
                            value={adminNote}
                            onChange={(event) => setAdminNote(event.target.value)}
                            className="min-h-24 w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                            placeholder="Add internal review notes"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                            Rejection reason
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                            placeholder="Required if this referral should not count"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="secondary"
                            onClick={() => handleStatusUpdate("under_review")}
                            isLoading={updateReferralEvent.isPending}
                            disabled={selectedEvent.status !== "potential"}
                          >
                            Move to review
                          </Button>
                          <Button
                            variant="success"
                            onClick={() => handleStatusUpdate("confirmed")}
                            isLoading={updateReferralEvent.isPending}
                            disabled={!closeStatus || selectedEvent.status !== "under_review"}
                          >
                            Confirm earning
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate("paid")}
                            isLoading={updateReferralEvent.isPending}
                            disabled={!closeStatus || selectedEvent.status !== "confirmed"}
                          >
                            <Wallet className="h-4 w-4" />
                            Mark as paid
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleStatusUpdate("rejected")}
                            isLoading={updateReferralEvent.isPending}
                            disabled={!rejectionReason.trim() || selectedEvent.status === "confirmed" || selectedEvent.status === "paid" || selectedEvent.status === "ineligible"}
                          >
                            <Flag className="h-4 w-4" />
                            Reject referral
                          </Button>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                          View the live listing:{" "}
                          <Link
                            href={`/properties/${selectedEvent.property_id}`}
                            className="font-medium text-[var(--color-deep-slate-blue)]"
                          >
                            open property detail
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}
            </DashboardPanel>
          </section>
        </div>
      </div>
    </div>
  );
}