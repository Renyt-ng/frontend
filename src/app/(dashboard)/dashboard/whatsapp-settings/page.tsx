"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CircleAlert,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  ToggleLeft,
  Users,
} from "lucide-react";
import { Badge, Button, Input, Select } from "@/components/ui";
import {
  DashboardContextualHelp,
  DashboardPanel,
  DashboardSectionHeading,
  DashboardSectionNav,
  MetricCard,
} from "@/components/dashboard";
import {
  useAdminWhatsAppOverview,
  useAdminWhatsAppEvents,
  useAdminWhatsAppActionControls,
  useAdminWhatsAppAgentAccessList,
  useSendAdminWhatsAppTest,
  useUpdateAdminWhatsAppActionControl,
  useUpdateAdminWhatsAppAgentAccess,
} from "@/lib/hooks";
import {
  formatWhatsAppEventStatus,
  formatWhatsAppProvider,
  formatWhatsAppProviderStatus,
  formatWhatsAppActionStatus,
  formatWhatsAppAgentAccessStatus,
  getWhatsAppEventBadgeVariant,
  getWhatsAppProviderBadgeVariant,
  getWhatsAppActionBadgeVariant,
  getWhatsAppAgentAccessBadgeVariant,
} from "@/lib/adminUtils";
import type {
  WhatsAppActionType,
  WhatsAppActionStatus,
  WhatsAppAgentAccessStatus,
} from "@/types/admin";

const LIVE_REFRESH_INTERVAL_MS = 15_000;
const ACTION_STATUS_OPTIONS: Array<{ label: string; value: WhatsAppActionStatus }> = [
  { value: "enabled", label: "Enabled" },
  { value: "paused", label: "Paused" },
  { value: "trial_only", label: "Trial only" },
  { value: "paid_only", label: "Paid only" },
];
const AGENT_ACCESS_STATUS_OPTIONS: Array<{
  label: string;
  value: WhatsAppAgentAccessStatus;
}> = [
  { value: "approved_not_enrolled", label: "Approved, not enrolled" },
  { value: "eligible_trial", label: "Eligible trial" },
  { value: "eligible_paid", label: "Eligible paid" },
  { value: "disabled", label: "Disabled" },
  { value: "suspended", label: "Suspended" },
];

interface AgentAccessDraft {
  access_status: WhatsAppAgentAccessStatus;
  enabled_actions: WhatsAppActionType[];
}

function formatTimestamp(value?: string | null) {
  return value ? new Date(value).toLocaleString("en-NG") : "Not yet recorded";
}

export default function WhatsAppSettingsPage() {
  const overviewQuery = useAdminWhatsAppOverview({
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
  const eventsQuery = useAdminWhatsAppEvents(
    { limit: 12 },
    {
      refetchInterval: LIVE_REFRESH_INTERVAL_MS,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  );
  const actionsQuery = useAdminWhatsAppActionControls({
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
    staleTime: 10_000,
  });
  const agentAccessQuery = useAdminWhatsAppAgentAccessList(
    { limit: 20 },
    {
      refetchInterval: LIVE_REFRESH_INTERVAL_MS,
      staleTime: 10_000,
    },
  );
  const sendTestWhatsApp = useSendAdminWhatsAppTest();
  const updateAction = useUpdateAdminWhatsAppActionControl();
  const updateAgentAccess = useUpdateAdminWhatsAppAgentAccess();

  const overview = overviewQuery.data?.data;
  const events = eventsQuery.data?.data ?? [];
  const actions = actionsQuery.data?.data ?? [];
  const agentAccessList = agentAccessQuery.data?.data ?? [];

  const [form, setForm] = useState({
    recipient_phone: "",
    template_name: "",
    message: "",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionDrafts, setActionDrafts] = useState<Record<string, WhatsAppActionStatus>>({});
  const [agentDrafts, setAgentDrafts] = useState<Record<string, AgentAccessDraft>>({});

  useEffect(() => {
    setActionDrafts(
      Object.fromEntries(actions.map((action) => [action.action_type, action.status])),
    );
  }, [actions]);

  useEffect(() => {
    setAgentDrafts(
      Object.fromEntries(
        agentAccessList.map((access) => [
          access.agent_id,
          {
            access_status: access.access_status,
            enabled_actions: access.enabled_actions,
          },
        ]),
      ),
    );
  }, [agentAccessList]);

  const sectionItems = useMemo(
    () => [
      { id: "wa-overview", label: "Overview" },
      { id: "wa-actions", label: "Action controls", count: actions.length },
      { id: "wa-agents", label: "Agent access", count: agentAccessList.length },
      { id: "wa-test-send", label: "Test send" },
      { id: "wa-events", label: "Recent activity", count: events.length },
    ],
    [actions.length, agentAccessList.length, events.length],
  );
  const manageableActionTypes = useMemo(
    () => actions.map((action) => action.action_type),
    [actions],
  );

  async function handleTestSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    try {
      const result = await sendTestWhatsApp.mutateAsync({
        recipient_phone: form.recipient_phone,
        template_name: form.template_name || null,
        message: form.message || null,
      });
      setStatusMessage(
        `Test message sent to ${result.data.recipient_phone}${result.data.provider_message_id ? ` · wamid ${result.data.provider_message_id}` : ""}`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to send test message right now.",
      );
    }
  }

  async function handleActionStatusSave(actionType: WhatsAppActionType) {
    try {
      await updateAction.mutateAsync({
        actionType,
        data: { status: actionDrafts[actionType] ?? "enabled" },
      });
    } catch {
      // Mutation error is handled by React Query
    }
  }

  async function handleAgentAccessSave(agentId: string) {
    try {
      const draft = agentDrafts[agentId];
      if (!draft) {
        return;
      }

      await updateAgentAccess.mutateAsync({
        agentId,
        data: {
          access_status: draft.access_status,
          enabled_actions: draft.enabled_actions,
        },
      });
    } catch {
      // Mutation error is handled by React Query
    }
  }

  function toggleAgentAction(agentId: string, actionType: WhatsAppActionType) {
    setAgentDrafts((current) => {
      const existing = current[agentId];
      if (!existing) {
        return current;
      }

      const hasAction = existing.enabled_actions.includes(actionType);
      return {
        ...current,
        [agentId]: {
          ...existing,
          enabled_actions: hasAction
            ? existing.enabled_actions.filter((item) => item !== actionType)
            : [...existing.enabled_actions, actionType],
        },
      };
    });
  }

  function isAgentDraftDirty(agentId: string) {
    const saved = agentAccessList.find((access) => access.agent_id === agentId);
    const draft = agentDrafts[agentId];

    if (!saved || !draft) {
      return false;
    }

    return (
      saved.access_status !== draft.access_status
      || JSON.stringify(saved.enabled_actions) !== JSON.stringify(draft.enabled_actions)
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero panel */}
      <DashboardPanel padding="lg" tone="accent" className="space-y-5">
        <DashboardSectionHeading
          title="WhatsApp operations"
          description="Manage Meta Cloud API connection, action controls, agent access, and delivery activity from one admin surface."
          helper={
            <DashboardContextualHelp
              label="More information about WhatsApp operations"
              title="What belongs here"
            >
              This surface centralises WhatsApp Business API health, per-action
              governance, agent enrolment, and delivery event tracking so admins
              can spot issues before agents are affected.
            </DashboardContextualHelp>
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  overview
                    ? getWhatsAppProviderBadgeVariant(overview.status)
                    : "dashboard"
                }
              >
                {overview ? formatWhatsAppProviderStatus(overview.status) : "Checking"}
              </Badge>
              <Button
                type="button"
                variant="dashboard"
                size="sm"
                onClick={() => {
                  void overviewQuery.refetch();
                  void eventsQuery.refetch();
                  void actionsQuery.refetch();
                  void agentAccessQuery.refetch();
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={MessageCircle}
            label="Provider"
            value={overview ? formatWhatsAppProvider(overview.provider) : "..."}
            meta={overview?.webhook_configured ? "Webhook active" : "Webhook not configured"}
            emphasis="highlight"
          />
          <MetricCard
            icon={ToggleLeft}
            label="Actions enabled"
            value={overview?.action_summary.total_enabled ?? "..."}
            meta={`${overview?.action_summary.total_paused ?? 0} paused`}
          />
          <MetricCard
            icon={Users}
            label="Agents enrolled"
            value={overview?.action_summary.total_agents_enrolled ?? "..."}
            meta="Active WhatsApp agent access"
          />
          <MetricCard
            icon={CircleAlert}
            label="Failed sends"
            value={overview?.recent_summary.failed ?? "..."}
            meta="Recent outbound failures"
            emphasis={(overview?.recent_summary.failed ?? 0) > 0 ? "warning" : "default"}
          />
        </div>
      </DashboardPanel>

      {/* Sections with side nav */}
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
        <DashboardSectionNav items={sectionItems} className="hidden xl:block" />

        <div className="space-y-6">
          {/* Overview section */}
          <section id="wa-overview" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Provider overview"
                description="Meta Cloud API connection state, phone identity, webhook routing, and recent delivery summary."
              />

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
                        Provider state
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                        {overview ? formatWhatsAppProvider(overview.provider) : "Loading provider"}
                      </h3>
                    </div>
                    <Badge
                      variant={overview ? getWhatsAppProviderBadgeVariant(overview.status) : "dashboard"}
                    >
                      {overview ? formatWhatsAppProviderStatus(overview.status) : "Checking"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[var(--dashboard-text-secondary)]">
                    <p>Phone number ID: <span className="font-medium text-[var(--dashboard-text-primary)]">{overview?.phone_number_id ?? "Not configured"}</span></p>
                    <p>Display number: <span className="font-medium text-[var(--dashboard-text-primary)]">{overview?.display_phone_number ?? "Unavailable"}</span></p>
                    <p>WABA ID: <span className="font-medium text-[var(--dashboard-text-primary)]">{overview?.waba_id ?? "Not configured"}</span></p>
                    <p>Webhook: <span className="font-medium text-[var(--dashboard-text-primary)]">{overview?.webhook_configured ? "Configured" : "Not configured"}</span></p>
                    <p>Last send: <span className="font-medium text-[var(--dashboard-text-primary)]">{formatTimestamp(overview?.recent_summary.last_sent_at)}</span></p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-[var(--dashboard-accent)]" />
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">Total sends</p>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          {overview?.recent_summary.total ?? 0} tracked
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-[var(--dashboard-accent)]" />
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">Delivered</p>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          {overview?.recent_summary.delivered ?? 0} confirmed
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-[var(--dashboard-accent)]" />
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">Read</p>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          {overview?.recent_summary.read ?? 0} read receipts
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <CircleAlert className="h-5 w-5 text-[var(--dashboard-warning)]" />
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">Failures</p>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          {overview?.recent_summary.failed ?? 0} failed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardPanel>
          </section>

          {/* Action controls section */}
          <section id="wa-actions" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Action controls"
                description="Enable, pause, or restrict each automated WhatsApp action type. Changes apply globally across all agents."
                action={<Badge variant="dashboard">{actions.length} actions</Badge>}
              />

              {actionsQuery.isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                  Action controls could not be loaded. Confirm the backend is reachable.
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[var(--dashboard-text-primary)]">
                            {action.action_type.replace(/_/g, " ")}
                          </p>
                          <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                            {action.updated_at
                              ? `Updated ${formatTimestamp(action.updated_at)}`
                              : "Using default enabled policy until you save an override."}
                            {action.paused_reason ? ` · ${action.paused_reason}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 self-stretch">
                          <Badge variant={getWhatsAppActionBadgeVariant(action.status)}>
                            {formatWhatsAppActionStatus(action.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,220px)_auto] lg:items-end">
                        <Select
                          label="Status"
                          value={actionDrafts[action.action_type] ?? action.status}
                          onChange={(event) =>
                            setActionDrafts((current) => ({
                              ...current,
                              [action.action_type]: event.target.value as WhatsAppActionStatus,
                            }))
                          }
                          options={ACTION_STATUS_OPTIONS}
                        />
                        <div className="flex justify-start lg:justify-end">
                          <Button
                            type="button"
                            variant="dashboardPrimary"
                            size="sm"
                            onClick={() => handleActionStatusSave(action.action_type)}
                            disabled={
                              updateAction.isPending
                              || (actionDrafts[action.action_type] ?? action.status) === action.status
                            }
                          >
                            Save action control
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardPanel>
          </section>

          {/* Agent access section */}
          <section id="wa-agents" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Agent access"
                description="View and manage which agents are enrolled in WhatsApp operations, their trial status, and enabled actions."
                action={<Badge variant="dashboard">{agentAccessList.length} agents</Badge>}
              />

              {agentAccessQuery.isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                  Agent access data could not be loaded. Confirm the backend is reachable.
                </div>
              ) : (
                <div className="space-y-3">
                  {agentAccessList.map((access) => (
                    <div
                      key={access.id}
                      className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[var(--dashboard-text-primary)]">
                            {access.business_name ?? `Agent ${access.agent_id.slice(0, 8)}…`}
                          </p>
                          <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                            {access.whatsapp_phone ?? access.primary_phone ?? "Phone not configured"}
                            {" · "}
                            {access.enabled_actions.length === 0
                              ? "All actions allowed after enrolment"
                              : `${access.enabled_actions.length} action${access.enabled_actions.length !== 1 ? "s" : ""} enabled`}
                            {access.trial_expires_at ? ` · trial expires ${formatTimestamp(access.trial_expires_at)}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getWhatsAppAgentAccessBadgeVariant(access.access_status)}>
                            {formatWhatsAppAgentAccessStatus(access.access_status)}
                          </Badge>
                          <Badge variant="dashboard">
                            {access.verification_status ?? "approved"}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
                        <Select
                          label="Access status"
                          value={agentDrafts[access.agent_id]?.access_status ?? access.access_status}
                          onChange={(event) =>
                            setAgentDrafts((current) => ({
                              ...current,
                              [access.agent_id]: {
                                access_status: event.target.value as WhatsAppAgentAccessStatus,
                                enabled_actions:
                                  current[access.agent_id]?.enabled_actions ?? access.enabled_actions,
                              },
                            }))
                          }
                          options={AGENT_ACCESS_STATUS_OPTIONS}
                        />

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[var(--dashboard-text-primary)]">
                            Enabled actions
                          </p>
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {manageableActionTypes.map((actionType) => {
                              const selectedActions = agentDrafts[access.agent_id]?.enabled_actions ?? access.enabled_actions;
                              const checked = selectedActions.includes(actionType);

                              return (
                                <label
                                  key={actionType}
                                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                                    checked
                                      ? "border-emerald-200 bg-emerald-50"
                                      : "border-[var(--dashboard-border)] bg-white"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleAgentAction(access.agent_id, actionType)}
                                    className="mt-1"
                                  />
                                  <span className="text-sm text-[var(--dashboard-text-secondary)]">
                                    {actionType.replace(/_/g, " ")}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-xs text-[var(--dashboard-text-secondary)]">
                            Leave all actions unchecked to allow every globally enabled action for this agent.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-start">
                        <Button
                          type="button"
                          variant="dashboardPrimary"
                          size="sm"
                          onClick={() => handleAgentAccessSave(access.agent_id)}
                          disabled={updateAgentAccess.isPending || !isAgentDraftDirty(access.agent_id)}
                        >
                          Save agent access
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardPanel>
          </section>

          {/* Test send section */}
          <section id="wa-test-send" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Test send"
                description="Send a controlled WhatsApp message from the admin workspace to validate Cloud API connectivity and template delivery."
              />

              <form className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]" onSubmit={handleTestSend}>
                <div className="space-y-4 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
                  <Input
                    id="wa-test-phone"
                    label="Recipient phone"
                    placeholder="+2348030000000"
                    value={form.recipient_phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recipient_phone: event.target.value,
                      }))
                    }
                  />
                  <Input
                    id="wa-test-template"
                    label="Template name (optional)"
                    placeholder="hello_world"
                    value={form.template_name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        template_name: event.target.value,
                      }))
                    }
                  />
                  <div className="space-y-1.5">
                    <label
                      htmlFor="wa-test-message"
                      className="block text-sm font-medium text-[var(--color-text-primary)]"
                    >
                      Message (used when no template)
                    </label>
                    <textarea
                      id="wa-test-message"
                      className="min-h-24 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
                      placeholder="Hello from Renyt admin test"
                      value={form.message}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      variant="dashboardPrimary"
                      isLoading={sendTestWhatsApp.isPending}
                    >
                      <Send className="h-4 w-4" />
                      Send test message
                    </Button>
                    {statusMessage ? (
                      <p className="text-sm text-[var(--dashboard-text-secondary)]">
                        {statusMessage}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-5">
                  <h3 className="font-medium text-[var(--dashboard-text-primary)]">Before you send</h3>
                  <div className="mt-3 space-y-2 text-sm text-[var(--dashboard-text-secondary)]">
                    <p>Use a WhatsApp-registered number in international format with country code (e.g. +234…).</p>
                    <p>If a template name is provided, the backend sends a template message. Otherwise it sends a plain text message (only works within the 24-hour conversation window).</p>
                    <p>Recent sends appear below so admins can confirm provider message IDs and delivery status quickly.</p>
                  </div>
                </div>
              </form>
            </DashboardPanel>
          </section>

          {/* Recent activity section */}
          <section id="wa-events" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Recent WhatsApp activity"
                description="The latest outbound messages and webhook events recorded from the Meta Cloud API integration."
                action={<Badge variant="dashboard">{events.length} tracked</Badge>}
              />

              {eventsQuery.isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                  WhatsApp activity could not be loaded. Confirm the backend is reachable and the admin WhatsApp endpoints are healthy.
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-alt)] px-5 py-8 text-sm text-[var(--dashboard-text-secondary)]">
                  No WhatsApp events have been recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[var(--dashboard-text-primary)]">
                            {event.recipient_phone ?? "Unknown recipient"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                            {event.event_type.replace(/_/g, " ")}
                            {event.message_type ? ` · ${event.message_type}` : ""}
                            {event.template_name ? ` · ${event.template_name}` : ""}
                            {" · "}
                            {formatTimestamp(event.occurred_at)}
                          </p>
                        </div>
                        <Badge variant={getWhatsAppEventBadgeVariant(event.event_status)}>
                          {formatWhatsAppEventStatus(event.event_status)}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-[var(--dashboard-text-secondary)]">
                        <p>Provider message ID: <span className="font-medium text-[var(--dashboard-text-primary)]">{event.provider_message_id ?? "Unavailable"}</span></p>
                        <p>Agent: <span className="font-medium text-[var(--dashboard-text-primary)]">{event.agent_id ? `${event.agent_id.slice(0, 8)}…` : "System"}</span></p>
                        <p>Source: <span className="font-medium text-[var(--dashboard-text-primary)]">{event.source}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardPanel>
          </section>
        </div>
      </div>
    </div>
  );
}
