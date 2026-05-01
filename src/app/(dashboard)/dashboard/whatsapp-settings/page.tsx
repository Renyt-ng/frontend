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
  MiniBarChart,
} from "@/components/dashboard";
import {
  useAdminWhatsAppOverview,
  useAdminWhatsAppEvents,
  useAdminWhatsAppTemplates,
  useAdminWhatsAppActionControls,
  useAdminWhatsAppAgentAccessList,
  useAdminWhatsAppListingCreationReport,
  useAdminWhatsAppTasks,
  useDispatchAdminWhatsAppListingCreation,
  useDispatchAdminWhatsAppFinalOutcome,
  useRecoverAdminWhatsAppTask,
  useSendAdminWhatsAppTest,
  useSyncAdminWhatsAppTemplates,
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
  WhatsAppTemplateMapping,
  WhatsAppMetaTemplate,
  WhatsAppTask,
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

function formatStepLabel(value?: string | null) {
  return value ? value.replace(/_/g, " ") : "Unknown step";
}

function formatPendingFieldLabel(value: string) {
  return value.replace(/_/g, " ");
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
  const templatesQuery = useAdminWhatsAppTemplates({
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
    staleTime: 10_000,
  });
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
  const tasksQuery = useAdminWhatsAppTasks(
    { limit: 12 },
    {
      refetchInterval: LIVE_REFRESH_INTERVAL_MS,
      staleTime: 10_000,
    },
  );
  const listingReportQuery = useAdminWhatsAppListingCreationReport({
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
    staleTime: 10_000,
  });
  const dispatchListingCreation = useDispatchAdminWhatsAppListingCreation();
  const dispatchFinalOutcome = useDispatchAdminWhatsAppFinalOutcome();
  const recoverTask = useRecoverAdminWhatsAppTask();
  const sendTestWhatsApp = useSendAdminWhatsAppTest();
  const syncTemplates = useSyncAdminWhatsAppTemplates();
  const updateAction = useUpdateAdminWhatsAppActionControl();
  const updateAgentAccess = useUpdateAdminWhatsAppAgentAccess();

  const overview = overviewQuery.data?.data;
  const events = eventsQuery.data?.data ?? [];
  const templateCatalog = templatesQuery.data?.data;
  const templateMappings = templateCatalog?.mappings ?? [];
  const metaTemplates = templateCatalog?.meta_templates ?? [];
  const actions = actionsQuery.data?.data ?? [];
  const agentAccessList = agentAccessQuery.data?.data ?? [];
  const tasks = tasksQuery.data?.data ?? [];
  const listingReport = listingReportQuery.data?.data;

  const [form, setForm] = useState({
    recipient_phone: "",
    template_name: "",
    message: "",
  });
  const [templateStatusMessage, setTemplateStatusMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [operationsStatusMessage, setOperationsStatusMessage] = useState<string | null>(null);
  const [finalOutcomePropertyId, setFinalOutcomePropertyId] = useState("");
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
      { id: "wa-templates", label: "Templates", count: metaTemplates.length },
      { id: "wa-actions", label: "Action controls", count: actions.length },
      { id: "wa-agents", label: "Agent access", count: agentAccessList.length },
      { id: "wa-listing-report", label: "Listing flow report", count: listingReport?.stale_drafts.length ?? 0 },
      { id: "wa-dispatch", label: "Task dispatch" },
      { id: "wa-tasks", label: "Task queue", count: tasks.length },
      { id: "wa-test-send", label: "Test send" },
      { id: "wa-events", label: "Recent activity", count: events.length },
    ],
    [actions.length, agentAccessList.length, events.length, listingReport?.stale_drafts.length, metaTemplates.length, tasks.length],
  );
  const visibleActions = useMemo(
    () => actions.filter((action) => action.action_type !== "listing_update"),
    [actions],
  );
  const manageableActionTypes = useMemo(
    () => visibleActions.map((action) => action.action_type),
    [visibleActions],
  );
  const listingAgeBuckets = listingReport?.charts.age_buckets ?? [];
  const reminderDistribution = listingReport?.charts.reminder_distribution ?? [];
  const pendingFieldHotspots = listingReport?.charts.pending_field_hotspots ?? [];

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

  async function handleTemplateSync() {
    setTemplateStatusMessage(null);

    try {
      const result = await syncTemplates.mutateAsync();
      setTemplateStatusMessage(
        `Synced ${result.data.synced_count} Meta template${result.data.synced_count === 1 ? "" : "s"} at ${formatTimestamp(result.data.last_synced_at)}.`,
      );
    } catch (error) {
      setTemplateStatusMessage(
        error instanceof Error ? error.message : "Unable to sync templates right now.",
      );
    }
  }

  function findResolvedMetaTemplate(templateName: string | null, language: string) {
    if (!templateName) {
      return null;
    }

    return (
      metaTemplates.find(
        (template: WhatsAppMetaTemplate) =>
          template.template_name === templateName
          && template.language === language
          && template.is_available_on_meta,
      ) ?? null
    );
  }

  function formatTemplateStatus(template: WhatsAppMetaTemplate | null) {
    if (!template?.status) {
      return "Unknown";
    }

    return template.status.replace(/_/g, " ");
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

  async function handleListingCreationDispatch(agentId: string) {
    setOperationsStatusMessage(null);

    try {
      const result = await dispatchListingCreation.mutateAsync({ agent_id: agentId });
      setOperationsStatusMessage(
        `Listing creation prompt sent to ${result.data.recipient_phone}${result.data.mode === "recovered_existing" ? " by recovering the current task." : "."}`,
      );
    } catch (error) {
      setOperationsStatusMessage(
        error instanceof Error ? error.message : "Unable to dispatch listing creation right now.",
      );
    }
  }

  async function handleFinalOutcomeDispatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationsStatusMessage(null);

    try {
      const result = await dispatchFinalOutcome.mutateAsync({
        property_id: finalOutcomePropertyId.trim(),
      });
      setOperationsStatusMessage(
        `Final outcome prompt sent to ${result.data.recipient_phone} for listing ${result.data.property_id ?? "unknown"}.`,
      );
      setFinalOutcomePropertyId("");
    } catch (error) {
      setOperationsStatusMessage(
        error instanceof Error ? error.message : "Unable to dispatch final outcome right now.",
      );
    }
  }

  async function handleRecoverTask(taskId: string) {
    setOperationsStatusMessage(null);

    try {
      const result = await recoverTask.mutateAsync(taskId);
      setOperationsStatusMessage(
        `Recovered ${result.data.task.action_type.replace(/_/g, " ")} for ${result.data.recipient_phone}.`,
      );
    } catch (error) {
      setOperationsStatusMessage(
        error instanceof Error ? error.message : "Unable to recover this task right now.",
      );
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

  function canRecoverTask(task: WhatsAppTask) {
    return (
      (task.action_type === "listing_creation" || task.action_type === "final_outcome_capture")
      && task.status !== "completed"
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
                  void listingReportQuery.refetch();
                  void tasksQuery.refetch();
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

        <div className="min-w-0 space-y-6">
          {/* Overview section */}
          <section id="wa-overview" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Provider overview"
                description="Meta Cloud API connection state, phone identity, webhook routing, and recent delivery summary."
              />

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="min-w-0 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
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
                    <p className="break-words">Phone number ID: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{overview?.phone_number_id ?? "Not configured"}</span></p>
                    <p className="break-words">Display number: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{overview?.display_phone_number ?? "Unavailable"}</span></p>
                    <p className="break-words">WABA ID: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{overview?.waba_id ?? "Not configured"}</span></p>
                    <p className="break-words">Webhook: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{overview?.webhook_configured ? "Configured" : "Not configured"}</span></p>
                    <p className="break-words">Last send: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{formatTimestamp(overview?.recent_summary.last_sent_at)}</span></p>
                  </div>
                </div>

                <div className="min-w-0 grid gap-4 md:grid-cols-2">
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

          <section id="wa-templates" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Template catalog"
                description="Review fallback mappings and sync the approved Meta template catalog used to override live WhatsApp sends."
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="dashboard">{metaTemplates.length} Meta templates</Badge>
                    <Button
                      type="button"
                      variant="dashboardPrimary"
                      size="sm"
                      onClick={handleTemplateSync}
                      disabled={syncTemplates.isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Sync from Meta
                    </Button>
                  </div>
                }
              />

              {templateStatusMessage ? (
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3 text-sm text-[var(--dashboard-text-secondary)]">
                  {templateStatusMessage}
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-3">
                  {templatesQuery.isError ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                      WhatsApp template mappings could not be loaded. Confirm the new admin template endpoints are reachable.
                    </div>
                  ) : templateMappings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-alt)] px-5 py-8 text-sm text-[var(--dashboard-text-secondary)]">
                      No WhatsApp template mappings are available yet.
                    </div>
                  ) : (
                    templateMappings.map((mapping: WhatsAppTemplateMapping) => {
                      const metaTemplate = findResolvedMetaTemplate(
                        mapping.fallback_template_name,
                        mapping.fallback_language,
                      );

                      return (
                        <div
                          key={mapping.id}
                          className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-[var(--dashboard-text-primary)]">
                                {mapping.label}
                              </p>
                              <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                                {mapping.description ?? "No description configured."}
                              </p>
                            </div>
                            <Badge variant={metaTemplate ? "dashboardSuccess" : "dashboard"}>
                              {metaTemplate ? "Meta override active" : "Using fallback mapping"}
                            </Badge>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm text-[var(--dashboard-text-secondary)] md:grid-cols-2">
                            <p className="break-words">Logical key: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{mapping.logical_key}</span></p>
                            <p className="break-words">Fallback template: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{mapping.fallback_template_name ?? "None"}</span></p>
                            <p>Language: <span className="font-medium text-[var(--dashboard-text-primary)]">{mapping.fallback_language}</span></p>
                            <p>Button parameter: <span className="font-medium text-[var(--dashboard-text-primary)]">{mapping.fallback_button_index ?? "None"}{mapping.fallback_button_index !== null ? ` · ${mapping.fallback_button_sub_type ?? "button"}` : ""}</span></p>
                          </div>

                          {metaTemplate ? (
                            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-[var(--dashboard-text-secondary)]">
                              Meta currently has <span className="font-medium text-[var(--dashboard-text-primary)]">{metaTemplate.template_name}</span> in <span className="font-medium text-[var(--dashboard-text-primary)]">{metaTemplate.language}</span> with status <span className="font-medium text-[var(--dashboard-text-primary)]">{formatTemplateStatus(metaTemplate)}</span>. Runtime sends will prefer the synced catalog.
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-5">
                  <h3 className="font-medium text-[var(--dashboard-text-primary)]">Meta template inventory</h3>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Recently synced templates from your WhatsApp Business Account.
                  </p>

                  <div className="mt-4 space-y-3">
                    {templatesQuery.isError ? (
                      <p className="text-sm text-[var(--color-rejected)]">
                        Meta template inventory could not be loaded.
                      </p>
                    ) : metaTemplates.length === 0 ? (
                      <p className="text-sm text-[var(--dashboard-text-secondary)]">
                        No Meta templates have been synced yet. Use “Sync from Meta” to populate the local catalog.
                      </p>
                    ) : (
                      metaTemplates.slice(0, 12).map((template: WhatsAppMetaTemplate) => (
                        <div
                          key={template.id}
                          className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--dashboard-text-primary)]">
                                {template.template_name}
                              </p>
                              <p className="mt-1 break-words text-sm text-[var(--dashboard-text-secondary)]">
                                {template.language}
                                {template.category ? ` · ${template.category.toLowerCase()}` : ""}
                                {template.provider_template_id ? ` · ${template.provider_template_id}` : ""}
                              </p>
                            </div>
                            <Badge variant={template.is_available_on_meta ? "dashboardSuccess" : "dashboard"}>
                              {formatTemplateStatus(template)}
                            </Badge>
                          </div>
                          <p className="mt-3 text-xs text-[var(--dashboard-text-secondary)]">
                            Last synced {formatTimestamp(template.last_synced_at)}
                          </p>
                        </div>
                      ))
                    )}
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
                action={<Badge variant="dashboard">{visibleActions.length} actions</Badge>}
              />

              {actionsQuery.isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                  Action controls could not be loaded. Confirm the backend is reachable.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleActions.map((action) => (
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
                      className="min-w-0 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--dashboard-text-primary)]">
                            {access.business_name ?? `Agent ${access.agent_id.slice(0, 8)}…`}
                          </p>
                          <p className="mt-1 break-words text-sm text-[var(--dashboard-text-secondary)]">
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
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="dashboardPrimary"
                            size="sm"
                            onClick={() => handleAgentAccessSave(access.agent_id)}
                            disabled={updateAgentAccess.isPending || !isAgentDraftDirty(access.agent_id)}
                          >
                            Save agent access
                          </Button>
                          <Button
                            type="button"
                            variant="dashboard"
                            size="sm"
                            onClick={() => handleListingCreationDispatch(access.agent_id)}
                            disabled={dispatchListingCreation.isPending}
                          >
                            Prompt create listing
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardPanel>
          </section>

          <section id="wa-listing-report" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Listing flow report"
                description="Track create-listing v2 progress, stalled drafts, and reminder pressure."
                action={
                  <Badge variant="dashboard">
                    {listingReport?.flow_version ?? "listing_creation_v2"}
                  </Badge>
                }
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={MessageCircle}
                  label="Active listing tasks"
                  value={listingReport?.summary.active_tasks ?? "..."}
                  meta={`${listingReport?.summary.offered_tasks ?? 0} offered`}
                />
                <MetricCard
                  icon={Activity}
                  label="In progress"
                  value={listingReport?.summary.in_progress_tasks ?? "..."}
                  meta={`${listingReport?.summary.publish_ready_drafts ?? 0} publish ready`}
                />
                <MetricCard
                  icon={CircleAlert}
                  label="Stale drafts"
                  value={listingReport?.summary.stale_tasks ?? "..."}
                  meta="Require reminder or manual recovery"
                  emphasis={(listingReport?.summary.stale_tasks ?? 0) > 0 ? "warning" : "default"}
                />
                <MetricCard
                  icon={RefreshCw}
                  label="Reminders sent"
                  value={listingReport?.summary.reminders_sent_last_24h ?? "..."}
                  meta="Last 24 hours"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
                  <h3 className="font-medium text-[var(--dashboard-text-primary)]">Step concentration</h3>
                  <div className="mt-4 space-y-3">
                    {(listingReport?.step_breakdown ?? []).slice(0, 6).map((item) => (
                      <div key={item.step} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-[var(--dashboard-text-secondary)]">
                          {formatStepLabel(item.step)}
                        </span>
                        <span className="font-medium text-[var(--dashboard-text-primary)]">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-[var(--dashboard-border)] bg-white p-5">
                  <h3 className="font-medium text-[var(--dashboard-text-primary)]">Stale draft watchlist</h3>
                  <div className="mt-4 space-y-3">
                    {(listingReport?.stale_drafts ?? []).length === 0 ? (
                      <p className="text-sm text-[var(--dashboard-text-secondary)]">
                        No stale create-listing drafts are currently due for reminder.
                      </p>
                    ) : (
                      listingReport?.stale_drafts.map((draft) => (
                        <div
                          key={draft.task_id}
                          className="min-w-0 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--dashboard-text-primary)]">
                                {draft.property_title ?? "Untitled WhatsApp draft"}
                              </p>
                              <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                                {formatStepLabel(draft.current_step)}
                                {draft.next_recommended_step
                                  ? ` · next ${formatStepLabel(draft.next_recommended_step)}`
                                  : ""}
                              </p>
                            </div>
                            <Badge variant="dashboard">{draft.age_hours.toFixed(1)}h idle</Badge>
                          </div>

                          <div className="mt-3 grid gap-3 text-sm text-[var(--dashboard-text-secondary)] md:grid-cols-2">
                            <p className="break-words">Pending fields: <span className="font-medium text-[var(--dashboard-text-primary)]">{draft.pending_fields.length === 0 ? "None" : draft.pending_fields.join(", ")}</span></p>
                            <p>Images uploaded: <span className="font-medium text-[var(--dashboard-text-primary)]">{draft.uploaded_image_count}</span></p>
                            <p>Reminders sent: <span className="font-medium text-[var(--dashboard-text-primary)]">{draft.reminder_count}</span></p>
                            <p className="break-words">Last reminder: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{formatTimestamp(draft.last_reminder_sent_at)}</span></p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-5">
                    <h3 className="font-medium text-[var(--dashboard-text-primary)]">Draft age spread</h3>
                    <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                      Active create-listing tasks by time since last activity.
                    </p>
                    <div className="mt-4">
                      <MiniBarChart
                        ariaLabel="Create-listing draft age distribution"
                        values={listingAgeBuckets.map((item) => item.count)}
                        labels={listingAgeBuckets.map((item) => item.label)}
                        highlightIndex={listingAgeBuckets.findIndex((item) => item.label === "24h+")}
                        emptyMessage="No listing tasks have been recorded yet."
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-5">
                    <h3 className="font-medium text-[var(--dashboard-text-primary)]">Reminder saturation</h3>
                    <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                      How many nudges active tasks have already received.
                    </p>
                    <div className="mt-4">
                      <MiniBarChart
                        ariaLabel="Create-listing reminder distribution"
                        values={reminderDistribution.map((item) => item.count)}
                        labels={reminderDistribution.map((item) => item.label)}
                        highlightIndex={reminderDistribution.findIndex((item) => item.label === "3+")}
                        emptyMessage="Reminder pressure will appear here once reminders are sent."
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
                  <h3 className="font-medium text-[var(--dashboard-text-primary)]">Top missing fields</h3>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    The most common blockers across current create-listing tasks.
                  </p>
                  <div className="mt-4 space-y-3">
                    {pendingFieldHotspots.length === 0 ? (
                      <p className="text-sm text-[var(--dashboard-text-secondary)]">
                        No repeated missing-field hotspots right now.
                      </p>
                    ) : (
                      pendingFieldHotspots.map((item) => (
                        <div key={item.field} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-[var(--dashboard-text-secondary)]">
                            {formatPendingFieldLabel(item.field)}
                          </span>
                          <span className="font-medium text-[var(--dashboard-text-primary)]">
                            {item.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DashboardPanel>
          </section>

          <section id="wa-dispatch" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Task dispatch"
                description="Send targeted operational prompts without leaving the WhatsApp admin surface."
              />

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <form
                  className="space-y-4 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5"
                  onSubmit={handleFinalOutcomeDispatch}
                >
                  <Input
                    id="wa-final-outcome-property-id"
                    label="Listing ID for final outcome"
                    placeholder="Paste the property UUID"
                    value={finalOutcomePropertyId}
                    onChange={(event) => setFinalOutcomePropertyId(event.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      variant="dashboardPrimary"
                      disabled={dispatchFinalOutcome.isPending || finalOutcomePropertyId.trim().length === 0}
                    >
                      Send final outcome prompt
                    </Button>
                    <p className="text-sm text-[var(--dashboard-text-secondary)]">
                      Use the agent cards above to trigger create-listing prompts directly.
                    </p>
                  </div>
                </form>

                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-5 text-sm text-[var(--dashboard-text-secondary)]">
                  <h3 className="font-medium text-[var(--dashboard-text-primary)]">Operational notes</h3>
                  <div className="mt-3 space-y-2">
                    <p>Create-listing dispatch is agent-targeted and restores any active WhatsApp draft instead of duplicating it.</p>
                    <p>Final-outcome dispatch is listing-targeted and reaches the assigned listing agent.</p>
                    <p>Recovery resumes the saved workflow step, so agents continue from the last prompt they saw.</p>
                  </div>
                </div>
              </div>

              {operationsStatusMessage ? (
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3 text-sm text-[var(--dashboard-text-secondary)]">
                  {operationsStatusMessage}
                </div>
              ) : null}
            </DashboardPanel>
          </section>

          <section id="wa-tasks" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Task queue"
                description="Review recent WhatsApp workflow tasks and recover create-listing or final-outcome tasks when an agent needs another prompt."
                action={<Badge variant="dashboard">{tasks.length} tasks</Badge>}
              />

              {tasksQuery.isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                  WhatsApp task data could not be loaded. Confirm the backend admin endpoints are reachable.
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-alt)] px-5 py-8 text-sm text-[var(--dashboard-text-secondary)]">
                  No WhatsApp tasks have been recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="min-w-0 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--dashboard-text-primary)]">
                            {task.action_type.replace(/_/g, " ")}
                          </p>
                          <p className="mt-1 break-words text-sm text-[var(--dashboard-text-secondary)]">
                            Status: {task.status.replace(/_/g, " ")}
                            {task.current_step ? ` · step ${task.current_step.replace(/_/g, " ")}` : ""}
                            {task.failure_reason ? ` · ${task.failure_reason}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="dashboard">{task.source_trigger.replace(/_/g, " ")}</Badge>
                          {canRecoverTask(task) ? (
                            <Button
                              type="button"
                              variant="dashboard"
                              size="sm"
                              onClick={() => handleRecoverTask(task.id)}
                              disabled={recoverTask.isPending}
                            >
                              Recover task
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-[var(--dashboard-text-secondary)] md:grid-cols-2 xl:grid-cols-4">
                        <p className="break-words">Task ID: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{task.id}</span></p>
                        <p className="break-words">Agent ID: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{task.agent_id}</span></p>
                        <p className="break-words">Listing ID: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{task.entity_id ?? "Not bound yet"}</span></p>
                        <p className="break-words">Updated: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{formatTimestamp(task.updated_at)}</span></p>
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
                      <p className="break-all text-sm text-[var(--dashboard-text-secondary)]">
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
                      className="min-w-0 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--dashboard-text-primary)]">
                            {event.recipient_phone ?? "Unknown recipient"}
                          </p>
                          <p className="mt-1 break-words text-sm text-[var(--dashboard-text-secondary)]">
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

                      <div className="mt-3 grid gap-3 text-sm text-[var(--dashboard-text-secondary)] md:grid-cols-3">
                        <p className="break-words">Provider message ID: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{event.provider_message_id ?? "Unavailable"}</span></p>
                        <p>Agent: <span className="font-medium text-[var(--dashboard-text-primary)]">{event.agent_id ? `${event.agent_id.slice(0, 8)}…` : "System"}</span></p>
                        <p className="break-words">Source: <span className="break-all font-medium text-[var(--dashboard-text-primary)]">{event.source}</span></p>
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
