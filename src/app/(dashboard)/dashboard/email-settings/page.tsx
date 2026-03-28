"use client";

import { useMemo, useRef, useState } from "react";
import { Braces, Mail, Save, Send, ShieldAlert } from "lucide-react";
import { Badge, Button, Card, CardContent, Modal, Select } from "@/components/ui";
import {
  useAdminEmailEvents,
  useAdminEmailHealth,
  useAdminEmailNotifications,
  useAdminEmailProviders,
  useSendAdminTestEmail,
  useUpdateAdminEmailNotification,
  useUpdateAdminEmailProvider,
} from "@/lib/hooks";
import {
  formatEmailEventStatus,
  formatEmailProvider,
  getProviderConfigurationPlaceholder,
  getEmailEventBadgeVariant,
  getProviderBadgeVariant,
  sortProviders,
} from "@/lib/adminUtils";
import {
  applySmartNewline,
  applyTabIndent,
  formatJsonContent,
} from "@/lib/jsonEditor";
import type {
  EmailDeliveryEvent,
  EmailNotificationSettings,
  EmailProviderSettings,
} from "@/types/admin";

function EmailEventRow({ event }: { event: EmailDeliveryEvent }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] p-4 lg:grid-cols-[0.9fr_0.9fr_1fr_1.2fr] lg:items-center">
      <div>
        <p className="font-medium text-[var(--color-text-primary)]">
          {formatEmailProvider(event.provider)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
          {event.source}
        </p>
      </div>
      <div>
        <Badge variant={getEmailEventBadgeVariant(event.event_status)} size="sm">
          {formatEmailEventStatus(event.event_status)}
        </Badge>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {event.event_type}
        </p>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {event.recipient_email ?? "No recipient"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          {event.provider_message_id ?? "No provider message id"}
        </p>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {new Date(event.occurred_at).toLocaleString()}
      </p>
    </div>
  );
}

function ProviderEditor({
  provider,
  onSave,
  onClose,
  isSaving,
}: {
  provider: EmailProviderSettings;
  onSave: (data: {
    status?: EmailProviderSettings["status"];
    is_enabled?: boolean;
    is_primary?: boolean;
    fallback_order?: number | null;
    from_email?: string | null;
    from_name?: string | null;
    configuration?: Record<string, unknown>;
  }) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}) {
  const configurationRef = useRef<HTMLTextAreaElement>(null);
  const [fromEmail, setFromEmail] = useState(provider.from_email ?? "");
  const [fromName, setFromName] = useState(provider.from_name ?? "");
  const [status, setStatus] = useState(provider.status);
  const [isEnabled, setIsEnabled] = useState(provider.is_enabled);
  const [isPrimary, setIsPrimary] = useState(provider.is_primary);
  const [fallbackOrder, setFallbackOrder] = useState(
    provider.fallback_order?.toString() ?? "",
  );
  const [configurationText, setConfigurationText] = useState(
    provider.configuration && Object.keys(provider.configuration).length > 0
      ? JSON.stringify(provider.configuration, null, 2)
      : "",
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  function applyEditorUpdate(nextValue: string, nextStart: number, nextEnd: number) {
    setConfigurationText(nextValue);
    requestAnimationFrame(() => {
      configurationRef.current?.focus();
      configurationRef.current?.setSelectionRange(nextStart, nextEnd);
    });
  }

  function handleFormatJson() {
    try {
      const formatted = formatJsonContent(configurationText);
      setConfigurationText(formatted);
      setJsonError(null);
    } catch {
      setJsonError("Configuration must be valid JSON before formatting.");
    }
  }

  function handleConfigurationKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    const target = event.currentTarget;

    if (event.key === "Tab") {
      event.preventDefault();
      const edit = applyTabIndent(
        configurationText,
        target.selectionStart,
        target.selectionEnd,
        event.shiftKey,
      );
      applyEditorUpdate(edit.value, edit.selectionStart, edit.selectionEnd);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const edit = applySmartNewline(
        configurationText,
        target.selectionStart,
        target.selectionEnd,
      );
      applyEditorUpdate(edit.value, edit.selectionStart, edit.selectionEnd);
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      handleFormatJson();
    }
  }

  async function handleSubmit() {
    let configuration: Record<string, unknown> = {};

    try {
      configuration = configurationText.trim()
        ? (JSON.parse(configurationText) as Record<string, unknown>)
        : {};
      setJsonError(null);
    } catch {
      setJsonError("Configuration must be valid JSON.");
      return;
    }

    await onSave({
      status,
      is_enabled: isEnabled,
      is_primary: isPrimary,
      fallback_order: isPrimary ? null : fallbackOrder ? Number(fallbackOrder) : null,
      from_email: fromEmail || null,
      from_name: fromName || null,
      configuration,
    });
    onClose();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            From email
          </label>
          <input
            value={fromEmail}
            onChange={(event) => setFromEmail(event.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            From name
          </label>
          <input
            value={fromName}
            onChange={(event) => setFromName(event.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as EmailProviderSettings["status"])}
          options={[
            { value: "not_configured", label: "Not configured" },
            { value: "configured", label: "Configured" },
            { value: "primary", label: "Primary" },
            { value: "fallback", label: "Fallback" },
            { value: "degraded", label: "Degraded" },
            { value: "paused", label: "Paused" },
            { value: "needs_verification", label: "Needs verification" },
          ]}
        />
        <Select
          label="Fallback order"
          value={fallbackOrder}
          onChange={(event) => setFallbackOrder(event.target.value)}
          options={[
            { value: "", label: "None" },
            { value: "1", label: "Fallback 1" },
            { value: "2", label: "Fallback 2" },
          ]}
        />
        <div className="flex items-end gap-4 pb-2">
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(event) => setIsEnabled(event.target.checked)}
            />
            Enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) => setIsPrimary(event.target.checked)}
            />
            Primary
          </label>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            Provider configuration (JSON)
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={handleFormatJson}>
            <Braces className="h-4 w-4" />
            Format JSON
          </Button>
        </div>
        <textarea
          ref={configurationRef}
          rows={8}
          value={configurationText}
          onChange={(event) => setConfigurationText(event.target.value)}
          onKeyDown={handleConfigurationKeyDown}
          placeholder={getProviderConfigurationPlaceholder(provider.provider)}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          wrap="off"
          className="min-h-[22rem] w-full rounded-2xl border border-[var(--color-border)] bg-slate-950 px-4 py-3 font-mono text-[13px] leading-6 text-slate-100 placeholder:text-slate-500 focus:border-[var(--color-deep-slate-blue)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
          style={{ tabSize: 2 }}
        />
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          Use Tab and Shift+Tab to indent, Enter for smart indentation, and Ctrl/Cmd+Shift+F to format.
        </p>
        {jsonError && (
          <p className="mt-2 text-sm text-[var(--color-rejected)]">{jsonError}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isSaving}>
          <Save className="h-4 w-4" />
          Save Provider
        </Button>
      </div>
    </div>
  );
}

export default function EmailSettingsPage() {
  const emailEventsQuery = useAdminEmailEvents({ limit: 12 });
  const emailHealthQuery = useAdminEmailHealth();
  const providersQuery = useAdminEmailProviders();
  const notificationsQuery = useAdminEmailNotifications();
  const updateProvider = useUpdateAdminEmailProvider();
  const updateNotification = useUpdateAdminEmailNotification();
  const sendTestEmail = useSendAdminTestEmail();
  const [selectedProvider, setSelectedProvider] = useState<EmailProviderSettings | null>(
    null,
  );
  const [testSendForm, setTestSendForm] = useState({
    recipient_email: "",
    subject: "Renyt delivery test",
    message: "This is a transactional email provider test from Renyt admin.",
    provider_id: "",
  });
  const [testSendStatus, setTestSendStatus] = useState<string | null>(null);

  const providers = useMemo(
    () => sortProviders(providersQuery.data?.data ?? []),
    [providersQuery.data?.data],
  );
  const events = emailEventsQuery.data?.data ?? [];
  const notifications = notificationsQuery.data?.data ?? [];
  const health = emailHealthQuery.data?.data ?? [];

  async function handleProviderSave(
    providerId: string,
    data: {
      status?: EmailProviderSettings["status"];
      is_enabled?: boolean;
      is_primary?: boolean;
      fallback_order?: number | null;
      from_email?: string | null;
      from_name?: string | null;
      configuration?: Record<string, unknown>;
    },
  ) {
    await updateProvider.mutateAsync({ id: providerId, data });
  }

  async function handleNotificationToggle(setting: EmailNotificationSettings) {
    await updateNotification.mutateAsync({
      id: setting.id,
      data: { is_enabled: !setting.is_enabled },
    });
  }

  async function handleNotificationOverride(
    setting: EmailNotificationSettings,
    providerOverride: string,
  ) {
    await updateNotification.mutateAsync({
      id: setting.id,
      data: {
        provider_override: providerOverride
          ? (providerOverride as EmailNotificationSettings["provider_override"])
          : null,
      },
    });
  }

  async function handleTestSend(event: React.FormEvent) {
    event.preventDefault();
    setTestSendStatus(null);

    try {
      const result = await sendTestEmail.mutateAsync({
        recipient_email: testSendForm.recipient_email,
        subject: testSendForm.subject || null,
        message: testSendForm.message || null,
        provider_id: testSendForm.provider_id || null,
      });

      const attempted = result.data.attempted_providers
        .map((provider) => formatEmailProvider(provider.provider))
        .join(" -> ");
      setTestSendStatus(
        `Sent via ${formatEmailProvider(result.data.provider)}. Route tried: ${attempted}.`,
      );
    } catch {
      setTestSendStatus("Test send failed. Review provider configuration and health status.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Email Settings
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Configure Amazon SES, Brevo, and Mailgun for transactional delivery.
        </p>
      </div>

      {(providersQuery.isError || notificationsQuery.isError) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          Email settings could not be loaded. Confirm the backend is running and you are signed in as an admin.
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Provider Health
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Configuration readiness for each delivery provider.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {health.map((report) => (
              <div
                key={report.provider_id}
                className="rounded-2xl border border-[var(--color-border)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {formatEmailProvider(report.provider)}
                  </p>
                  <Badge variant={report.deliverable ? "active" : "pending"} size="sm">
                    {report.deliverable ? "Send ready" : "Send blocked"}
                  </Badge>
                </div>
                <div className="mt-3 space-y-3 text-sm text-[var(--color-text-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      Delivery
                    </p>
                    <p>
                      {report.delivery_issues.length
                        ? report.delivery_issues.join(", ")
                        : "Configuration looks ready for test sends."}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        Webhooks
                      </p>
                      <Badge
                        variant={report.webhook_verifiable ? "info" : "pending"}
                        size="sm"
                      >
                        {report.webhook_verifiable ? "Verified path ready" : "Verification missing"}
                      </Badge>
                    </div>
                    <p className="mt-1">
                      {report.webhook_issues.length
                        ? report.webhook_issues.join(", ")
                        : "Inbound webhook authenticity checks are configured."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Recent Delivery Events
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Latest send attempts and provider webhook events across SES, Brevo, and Mailgun.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {events.length ? (
              events.map((event) => <EmailEventRow key={event.id} event={event} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-secondary)]">
                No delivery events recorded yet. Test sends and provider webhooks will appear here.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {formatEmailProvider(provider.provider)}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {provider.from_email ?? "No sender configured"}
                  </p>
                </div>
                <Badge variant={getProviderBadgeVariant(provider.status)} size="sm">
                  {provider.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Primary</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {provider.is_primary ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Fallback order</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {provider.fallback_order ?? "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Enabled</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {provider.is_enabled ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <Button variant="secondary" className="w-full" onClick={() => setSelectedProvider(provider)}>
                <Mail className="h-4 w-4" />
                Edit Provider
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[var(--color-emerald)]">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Test Send
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Send a transactional test email through the primary route or a selected provider.
              </p>
            </div>
          </div>

          <form onSubmit={handleTestSend} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              type="email"
              required
              value={testSendForm.recipient_email}
              onChange={(event) =>
                setTestSendForm((current) => ({
                  ...current,
                  recipient_email: event.target.value,
                }))
              }
              placeholder="recipient@example.com"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <input
              value={testSendForm.subject}
              onChange={(event) =>
                setTestSendForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              placeholder="Subject"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <Select
              value={testSendForm.provider_id}
              onChange={(event) =>
                setTestSendForm((current) => ({
                  ...current,
                  provider_id: event.target.value,
                }))
              }
              options={[
                { value: "", label: "Use routing chain" },
                ...providers.map((provider) => ({
                  value: provider.id,
                  label: formatEmailProvider(provider.provider),
                })),
              ]}
            />
            <Button type="submit" isLoading={sendTestEmail.isPending}>
              <Send className="h-4 w-4" />
              Send test
            </Button>
          </form>
          <textarea
            rows={4}
            value={testSendForm.message}
            onChange={(event) =>
              setTestSendForm((current) => ({
                ...current,
                message: event.target.value,
              }))
            }
            className="mt-4 w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
          />
          {testSendStatus && (
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{testSendStatus}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-[var(--color-pending)]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Notification Policies
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Control category-level delivery and optional provider overrides.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {notifications.map((setting) => (
              <div
                key={setting.id}
                className="grid gap-3 rounded-2xl border border-[var(--color-border)] p-4 lg:grid-cols-[1.5fr_0.8fr_0.8fr_auto] lg:items-center"
              >
                <div>
                  <p className="font-medium capitalize text-[var(--color-text-primary)]">
                    {setting.category.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {setting.subject_template ?? "No subject template configured"}
                  </p>
                </div>
                <Badge variant={setting.is_enabled ? "active" : "default"} size="sm">
                  {setting.is_enabled ? "Enabled" : "Paused"}
                </Badge>
                <Select
                  value={setting.provider_override ?? ""}
                  onChange={(event) => handleNotificationOverride(setting, event.target.value)}
                  options={[
                    { value: "", label: "Use global routing" },
                    { value: "ses", label: "Amazon SES" },
                    { value: "brevo", label: "Brevo" },
                    { value: "mailgun", label: "Mailgun" },
                  ]}
                />
                <Button
                  variant="secondary"
                  onClick={() => handleNotificationToggle(setting)}
                  isLoading={updateNotification.isPending}
                >
                  {setting.is_enabled ? "Pause" : "Resume"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={Boolean(selectedProvider)}
        onClose={() => setSelectedProvider(null)}
        title={selectedProvider ? `Edit ${formatEmailProvider(selectedProvider.provider)}` : undefined}
      >
        {selectedProvider ? (
          <ProviderEditor
            provider={selectedProvider}
            isSaving={updateProvider.isPending}
            onClose={() => setSelectedProvider(null)}
            onSave={(data) => handleProviderSave(selectedProvider.id, data)}
          />
        ) : null}
      </Modal>
    </div>
  );
}