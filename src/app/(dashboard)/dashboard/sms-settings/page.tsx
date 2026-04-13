"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CircleAlert,
  Coins,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Badge, Button, Input } from "@/components/ui";
import {
  DashboardContextualHelp,
  DashboardPanel,
  DashboardSectionHeading,
  DashboardSectionNav,
  MetricCard,
} from "@/components/dashboard";
import {
  useAdminSmsEvents,
  useAdminSmsOverview,
  useSendAdminTestSms,
} from "@/lib/hooks";
import {
  formatSmsEventStatus,
  formatSmsProvider,
  formatSmsProviderStatus,
  getSmsEventBadgeVariant,
  getSmsProviderBadgeVariant,
} from "@/lib/adminUtils";

const LIVE_REFRESH_INTERVAL_MS = 15_000;

function formatTimestamp(value?: string | null) {
  return value ? new Date(value).toLocaleString("en-NG") : "Not yet recorded";
}

function formatCurrency(value: number | null, currency = "NGN") {
  if (value === null || Number.isNaN(value)) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function SmsSettingsPage() {
  const overviewQuery = useAdminSmsOverview({
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
  const eventsQuery = useAdminSmsEvents(
    { limit: 12 },
    {
      refetchInterval: LIVE_REFRESH_INTERVAL_MS,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  );
  const sendTestSms = useSendAdminTestSms();
  const overview = overviewQuery.data?.data;
  const events = eventsQuery.data?.data ?? [];
  const [form, setForm] = useState({
    recipient_phone: "",
    message: "This is a Renyt admin SMS provider test from BulkSMSNigeria.",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sectionItems = useMemo(
    () => [
      { id: "sms-overview", label: "Overview" },
      { id: "sms-balance", label: "Balance" },
      { id: "sms-test-send", label: "Test send" },
      { id: "sms-events", label: "Recent activity", count: events.length },
    ],
    [events.length],
  );

  async function handleTestSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    try {
      const result = await sendTestSms.mutateAsync(form);
      setStatusMessage(
        `Test SMS sent to ${result.data.recipient_phone}${result.data.balance !== null ? ` · balance ${formatCurrency(result.data.balance)}` : ""}`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to send test SMS right now.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPanel padding="lg" tone="accent" className="space-y-5">
        <DashboardSectionHeading
          title="SMS operations"
          description="Track BulkSMSNigeria readiness, wallet balance, recent OTP traffic, and test delivery from one admin surface."
          helper={
            <DashboardContextualHelp
              label="More information about SMS operations"
              title="What belongs here"
            >
              Keep provider health, wallet monitoring, and outbound verification activity together so admins can spot delivery risk before verification requests back up.
            </DashboardContextualHelp>
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  overview
                    ? getSmsProviderBadgeVariant(overview.status)
                    : "dashboard"
                }
              >
                {overview ? formatSmsProviderStatus(overview.status) : "Checking"}
              </Badge>
              <Button
                type="button"
                variant="dashboard"
                size="sm"
                onClick={() => {
                  void overviewQuery.refetch();
                  void eventsQuery.refetch();
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
            icon={MessageSquareText}
            label="Provider"
            value={overview ? formatSmsProvider(overview.provider) : "..."}
            meta={overview?.sandbox_mode ? "Sandbox mode active" : "Live delivery mode"}
            emphasis="highlight"
          />
          <MetricCard
            icon={Coins}
            label="Wallet balance"
            value={overview ? formatCurrency(overview.balance.balance, overview.balance.currency) : "..."}
            meta={overview?.balance.error ? "Balance fetch degraded" : "Latest provider balance snapshot"}
            emphasis={overview?.balance.error ? "warning" : "default"}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Verification sends"
            value={overview?.recent_summary.verification ?? "..."}
            meta="Recent OTP sends tracked in the admin log"
          />
          <MetricCard
            icon={CircleAlert}
            label="Failed sends"
            value={overview?.recent_summary.failed ?? "..."}
            meta="Recent outbound failures needing review"
            emphasis={(overview?.recent_summary.failed ?? 0) > 0 ? "warning" : "default"}
          />
        </div>
      </DashboardPanel>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
        <DashboardSectionNav items={sectionItems} className="hidden xl:block" />

        <div className="min-w-0 space-y-6">
          <section id="sms-overview" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Provider overview"
                description="BulkSMSNigeria connection state, sender identity, callback routing, and recent send summary."
              />

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
                        Provider state
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                        {overview ? formatSmsProvider(overview.provider) : "Loading provider"}
                      </h3>
                    </div>
                    <Badge
                      variant={overview ? getSmsProviderBadgeVariant(overview.status) : "dashboard"}
                    >
                      {overview ? formatSmsProviderStatus(overview.status) : "Checking"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[var(--dashboard-text-secondary)]">
                    <p>Sender ID: <span className="font-medium text-[var(--dashboard-text-primary)]">{overview?.sender_id ?? "Not configured"}</span></p>
                    <p>Base URL: <span className="font-medium text-[var(--dashboard-text-primary)]">{overview?.base_url ?? "Unavailable"}</span></p>
                    <p>Callback URL: <span className="font-medium text-[var(--dashboard-text-primary)]">{overview?.callback_url ?? "Not configured"}</span></p>
                    <p>Last successful send: <span className="font-medium text-[var(--dashboard-text-primary)]">{formatTimestamp(overview?.recent_summary.last_sent_at)}</span></p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-[var(--dashboard-accent)]" />
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">Traffic summary</p>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          Total tracked sends: {overview?.recent_summary.total ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-[var(--dashboard-accent)]" />
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">OTP traffic</p>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          Verification sends: {overview?.recent_summary.verification ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-[var(--dashboard-accent)]" />
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">Test sends</p>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          Admin test sends: {overview?.recent_summary.tests ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <CircleAlert className="h-5 w-5 text-[var(--dashboard-warning)]" />
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">Failure watch</p>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          Failed sends: {overview?.recent_summary.failed ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardPanel>
          </section>

          <section id="sms-balance" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Wallet balance"
                description="Use the provider balance snapshot to see whether OTP delivery risk is financial or operational."
              />

              <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
                    Current balance
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
                    {overview ? formatCurrency(overview.balance.balance, overview.balance.currency) : "..."}
                  </p>
                  <p className="mt-2 text-sm text-[var(--dashboard-text-secondary)]">
                    Fetched {formatTimestamp(overview?.balance.fetched_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-5">
                  <h3 className="font-medium text-[var(--dashboard-text-primary)]">Operational notes</h3>
                  <div className="mt-3 space-y-2 text-sm text-[var(--dashboard-text-secondary)]">
                    <p>Sandbox mode avoids wallet deduction and real delivery while keeping the same API contract.</p>
                    <p>Use the refresh control when support tops up the wallet and the dashboard needs a current balance snapshot.</p>
                    {overview?.balance.error ? (
                      <p className="text-[var(--color-rejected)]">{overview.balance.error}</p>
                    ) : (
                      <p>No provider balance error is currently reported.</p>
                    )}
                  </div>
                </div>
              </div>
            </DashboardPanel>
          </section>

          <section id="sms-test-send" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Test send"
                description="Send a controlled SMS from the admin workspace to validate sender identity, gateway access, and wallet health."
              />

              <form className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]" onSubmit={handleTestSend}>
                <div className="space-y-4 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5">
                  <Input
                    id="sms-test-phone"
                    label="Recipient phone"
                    placeholder="08030000000"
                    value={form.recipient_phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recipient_phone: event.target.value,
                      }))
                    }
                  />
                  <div className="space-y-1.5">
                    <label
                      htmlFor="sms-test-message"
                      className="block text-sm font-medium text-[var(--color-text-primary)]"
                    >
                      Message
                    </label>
                    <textarea
                      id="sms-test-message"
                      className="min-h-32 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
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
                      isLoading={sendTestSms.isPending}
                    >
                      <Send className="h-4 w-4" />
                      Send test SMS
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
                    <p>Use a Nigerian number in local or international format. The backend normalizes it for BulkSMSNigeria automatically.</p>
                    <p>Sandbox mode simulates delivery and balance checks without spending credits.</p>
                    <p>Recent sends appear below so admins can confirm provider message ids and cost snapshots quickly.</p>
                  </div>
                </div>
              </form>
            </DashboardPanel>
          </section>

          <section id="sms-events" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Recent SMS activity"
                description="The latest OTP and admin test sends recorded from the BulkSMSNigeria integration."
                action={<Badge variant="dashboard">{events.length} tracked</Badge>}
              />

              {eventsQuery.isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                  SMS activity could not be loaded. Confirm the backend is reachable and the admin SMS endpoints are healthy.
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-alt)] px-5 py-8 text-sm text-[var(--dashboard-text-secondary)]">
                  No SMS events have been recorded yet.
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
                            {event.event_type.replace(/_/g, " ")} · {formatTimestamp(event.occurred_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getSmsEventBadgeVariant(event.event_status)}>
                            {formatSmsEventStatus(event.event_status)}
                          </Badge>
                          {event.cost !== null ? (
                            <Badge variant="dashboard">{formatCurrency(event.cost, event.currency ?? "NGN")}</Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-[var(--dashboard-text-secondary)]">
                        <p>Provider message ID: <span className="font-medium text-[var(--dashboard-text-primary)]">{event.provider_message_id ?? "Unavailable"}</span></p>
                        <p>Balance after: <span className="font-medium text-[var(--dashboard-text-primary)]">{formatCurrency(event.balance_after, event.currency ?? "NGN")}</span></p>
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