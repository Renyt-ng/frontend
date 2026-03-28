"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, ShieldAlert, Wallet } from "lucide-react";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useAdminReferralEvents,
  useAdminReferralProgram,
  useCreateReferralCampaign,
  useUpdateReferralCampaign,
  useUpdateReferralEvent,
  useUpdateReferralProgramSettings,
} from "@/lib/hooks";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  AdminReferralEvent,
  ReferralCampaign,
  ReferralCommissionBasisSource,
  ReferralCommissionPreview,
  ReferralCommissionType,
  ReferralEventStatus,
  ReferralProgramSettings,
} from "@/types";

const FILTERS: Array<{ label: string; value: ReferralEventStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Potential", value: "potential" },
  { label: "Under review", value: "under_review" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Paid", value: "paid" },
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
    case "rejected":
      return "rejected" as const;
  }
}

function statusLabel(status: ReferralEventStatus) {
  return status === "under_review"
    ? "Under review"
    : status.charAt(0).toUpperCase() + status.slice(1);
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
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">{campaign.name}</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {ruleSummary(campaign)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={campaign.is_active ? "active" : "default"}>
              {campaign.is_active ? "Active" : "Paused"}
            </Badge>
            <Badge variant="info">Priority {campaign.priority}</Badge>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Input
            label="Campaign name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
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
          <Input
            label="Priority"
            value={form.priority}
            onChange={(event) =>
              setForm((current) => ({ ...current, priority: event.target.value }))
            }
            inputMode="numeric"
          />
        </div>

        <textarea
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          rows={3}
          placeholder="Optional campaign description"
          className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
        />

        <div className="grid gap-3 lg:grid-cols-3">
          <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-primary)]">
            <span>Listing purpose</span>
            <select
              value={form.listing_purpose}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  listing_purpose: event.target.value as CampaignFormState["listing_purpose"],
                }))
              }
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            >
              <option value="all">All listings</option>
              <option value="rent">Rent only</option>
              <option value="sale">Sale only</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-primary)]">
            <span>Commission type</span>
            <select
              value={form.commission_type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  commission_type: event.target.value as ReferralCommissionType,
                }))
              }
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            >
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
            </select>
          </label>
          <Input
            label={form.commission_type === "percentage" ? "Commission %" : "Fixed amount"}
            value={form.commission_value}
            onChange={(event) =>
              setForm((current) => ({ ...current, commission_value: event.target.value }))
            }
            inputMode="decimal"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-primary)]">
            <span>Percentage basis</span>
            <select
              value={form.commission_basis_source}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  commission_basis_source: event.target.value as ReferralCommissionBasisSource,
                }))
              }
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            >
              <option value="none">None</option>
              <option value="agency_fee">Agency fee</option>
              <option value="rent_amount">Annual rent</option>
              <option value="asking_price">Asking price</option>
            </select>
          </label>
          <Input
            label="Fallback amount"
            value={form.fallback_commission_amount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fallback_commission_amount: event.target.value,
              }))
            }
            inputMode="decimal"
          />
          <label className="flex items-center gap-2 self-end rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
            />
            Campaign active
          </label>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
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
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(emptyCampaignForm);
  const [settingsForm, setSettingsForm] = useState({
    is_enabled: true,
    default_commission_type: "fixed" as ReferralCommissionType,
    default_commission_value: "20000",
    default_basis_source: "none" as ReferralCommissionBasisSource,
    fallback_commission_amount: "20000",
    terms_version: "launch-v1",
  });

  const programQuery = useAdminReferralProgram();
  const updateProgramSettings = useUpdateReferralProgramSettings();
  const createCampaign = useCreateReferralCampaign();
  const updateCampaign = useUpdateReferralCampaign();
  const eventsQuery = useAdminReferralEvents({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search.trim() || undefined,
    limit: 100,
  });
  const updateReferralEvent = useUpdateReferralEvent();

  const program = programQuery.data?.data;
  const settings = program?.settings ?? null;
  const campaigns = program?.campaigns ?? [];
  const events = eventsQuery.data?.data ?? [];

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
  }, [selectedEvent?.id]);

  async function handleProgramSave() {
    await updateProgramSettings.mutateAsync({
      is_enabled: settingsForm.is_enabled,
      default_commission_type: settingsForm.default_commission_type,
      default_commission_value: Number(settingsForm.default_commission_value || 0),
      default_basis_source: settingsForm.default_basis_source,
      fallback_commission_amount: Number(settingsForm.fallback_commission_amount || 0),
      terms_version: settingsForm.terms_version.trim(),
    });
  }

  async function handleCreateCampaign(event: React.FormEvent) {
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
  }

  async function handleCampaignSave(id: string, data: Partial<ReferralCampaign>) {
    await updateCampaign.mutateAsync({ id, data });
  }

  async function handleStatusUpdate(status: ReferralEventStatus) {
    if (!selectedEvent) {
      return;
    }

    await updateReferralEvent.mutateAsync({
      id: selectedEvent.id,
      data: {
        status,
        rejection_reason: status === "rejected" ? rejectionReason : null,
        admin_note: adminNote || null,
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
          Referral operations
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-[var(--color-text-primary)]">
          Manage referral rules, campaigns, and payout review
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Configure the default commission policy, layer campaign overrides on top of it, and review qualified referral events before payout.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Program defaults
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                This rule applies when no active campaign matches a property.
              </p>
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
              <input
                type="checkbox"
                checked={settingsForm.is_enabled}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    is_enabled: event.target.checked,
                  }))
                }
              />
              Referral program enabled
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                <span>Default commission type</span>
                <select
                  value={settingsForm.default_commission_type}
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_commission_type: event.target.value as ReferralCommissionType,
                    }))
                  }
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </label>
              <Input
                label={
                  settingsForm.default_commission_type === "percentage"
                    ? "Default commission %"
                    : "Default fixed amount"
                }
                value={settingsForm.default_commission_value}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    default_commission_value: event.target.value,
                  }))
                }
                inputMode="decimal"
              />
              <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                <span>Percentage basis</span>
                <select
                  value={settingsForm.default_basis_source}
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_basis_source: event.target.value as ReferralCommissionBasisSource,
                    }))
                  }
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                >
                  <option value="none">None</option>
                  <option value="agency_fee">Agency fee</option>
                  <option value="rent_amount">Annual rent</option>
                  <option value="asking_price">Asking price</option>
                </select>
              </label>
              <Input
                label="Fallback amount"
                value={settingsForm.fallback_commission_amount}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    fallback_commission_amount: event.target.value,
                  }))
                }
                inputMode="decimal"
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

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              Current default: {ruleSummary({
                commission_type: settingsForm.default_commission_type,
                commission_value: Number(settingsForm.default_commission_value || 0),
                commission_basis_source: settingsForm.default_basis_source,
                fallback_commission_amount: Number(
                  settingsForm.fallback_commission_amount || 0,
                ),
              })}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleProgramSave}
                isLoading={updateProgramSettings.isPending || programQuery.isLoading}
              >
                Save defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Add campaign override
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Use campaigns to override the default rule by property, listing purpose, or area.
              </p>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-2">
                <Input
                  label="Campaign name"
                  value={campaignForm.name}
                  onChange={(event) =>
                    setCampaignForm((current) => ({ ...current, name: event.target.value }))
                  }
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
                <Input
                  label="Priority"
                  value={campaignForm.priority}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                  inputMode="numeric"
                />
              </div>

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

              <div className="grid gap-3 lg:grid-cols-3">
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                  <span>Listing purpose</span>
                  <select
                    value={campaignForm.listing_purpose}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        listing_purpose: event.target.value as CampaignFormState["listing_purpose"],
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                  >
                    <option value="all">All listings</option>
                    <option value="rent">Rent only</option>
                    <option value="sale">Sale only</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                  <span>Commission type</span>
                  <select
                    value={campaignForm.commission_type}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        commission_type: event.target.value as ReferralCommissionType,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </label>
                <Input
                  label={campaignForm.commission_type === "percentage" ? "Commission %" : "Fixed amount"}
                  value={campaignForm.commission_value}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      commission_value: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                  <span>Percentage basis</span>
                  <select
                    value={campaignForm.commission_basis_source}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        commission_basis_source: event.target.value as ReferralCommissionBasisSource,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                  >
                    <option value="none">None</option>
                    <option value="agency_fee">Agency fee</option>
                    <option value="rent_amount">Annual rent</option>
                    <option value="asking_price">Asking price</option>
                  </select>
                </label>
                <Input
                  label="Fallback amount"
                  value={campaignForm.fallback_commission_amount}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      fallback_commission_amount: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                />
                <label className="flex items-center gap-2 self-end rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  <input
                    type="checkbox"
                    checked={campaignForm.is_active}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Start active
                </label>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
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

              <div className="flex justify-end">
                <Button type="submit" isLoading={createCampaign.isPending}>
                  <Plus className="h-4 w-4" />
                  Add campaign
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Campaign overrides
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} configured.
            </p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<Plus className="h-7 w-7" />}
                title="No campaign overrides yet"
                description="Create a campaign when you want referral payouts to vary by property, area, or listing purpose."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaigns.map((campaign) => (
              <CampaignEditorCard
                key={campaign.id}
                campaign={campaign}
                onSave={handleCampaignSave}
                isSaving={updateCampaign.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                statusFilter === filter.value
                  ? "bg-[var(--color-deep-slate-blue)] text-white"
                  : "bg-white text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)]",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="w-full lg:max-w-sm">
          <Input
            id="referral-search"
            label="Search referrals"
            placeholder="Search by referrer, code, property, or campaign"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {eventsQuery.isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="h-[480px] animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-[480px] animate-pulse rounded-2xl bg-gray-100" />
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
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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
                      ? "border-[var(--color-deep-slate-blue)] bg-[var(--color-deep-slate-blue)]/5"
                      : "border-[var(--color-border)] hover:bg-gray-50",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {event.property_title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {event.referrer_name} → {event.referred_name ?? "Signed-in visitor"}
                      </p>
                      {event.campaign_name ? (
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          Campaign: {event.campaign_name}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {formatCurrency(event.amount)}
                      </p>
                      <Badge variant={statusVariant(event.status)}>
                        {statusLabel(event.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span>{event.property_area}</span>
                    <span>•</span>
                    <span>{formatDate(event.created_at)}</span>
                    <span>•</span>
                    <span>{event.source_channel.replace(/_/g, " ")}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {selectedEvent ? (
            <Card>
              <CardContent className="space-y-5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                      {selectedEvent.property_title}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {selectedEvent.property_area} · {selectedEvent.property_status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.property_is_verified ? <Badge variant="verified">Verified</Badge> : null}
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
                    <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                      {selectedEvent.referrer_name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      Code: {selectedEvent.referral_code}
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
                        : "Fixed commission"}
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
                </div>

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
                  >
                    Move to review
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleStatusUpdate("confirmed")}
                    isLoading={updateReferralEvent.isPending}
                  >
                    Confirm earning
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("paid")}
                    isLoading={updateReferralEvent.isPending}
                  >
                    <Wallet className="h-4 w-4" />
                    Mark as paid
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleStatusUpdate("rejected")}
                    isLoading={updateReferralEvent.isPending}
                    disabled={!rejectionReason.trim()}
                  >
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
    </div>
  );
}