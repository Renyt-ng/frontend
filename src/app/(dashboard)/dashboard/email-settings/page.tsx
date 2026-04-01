"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  Braces,
  Clock3,
  CheckCircle2,
  CircleAlert,
  Database,
  Mail,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Waypoints,
} from "lucide-react";
import { Badge, Button, Card, CardContent, Modal, Select } from "@/components/ui";
import {
  DashboardContextualHelp,
  DashboardPanel,
  DashboardSectionHeading,
  DashboardSectionNav,
} from "@/components/dashboard";
import { EmailTemplateWorkspace } from "@/components/admin/EmailTemplateWorkspace";
import {
  useAdminEmailEvents,
  useAdminEmailHealth,
  useAdminEmailNotifications,
  useAdminEmailProviders,
  useAdminWorkflowDigestSchedule,
  useAdminQueueAction,
  useAdminQueueFailedJobs,
  useAdminQueueHealth,
  useSendAdminTestEmail,
  useUpdateAdminEmailNotification,
  useUpdateAdminEmailProvider,
  useUpdateAdminWorkflowDigestSchedule,
} from "@/lib/hooks";
import {
  formatQueueConditionState,
  formatQueueHealthStatus,
  formatQueueName,
  formatEmailEventStatus,
  formatEmailProvider,
  getQueueConditionBadgeVariant,
  getQueueHealthBadgeVariant,
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
  AdminWorkflowDigestSchedule,
  ManagedQueueName,
  EmailNotificationSettings,
  EmailProviderSettings,
  QueueFailedJobSummary,
  QueueHealthReport,
} from "@/types/admin";

const LIVE_REFRESH_INTERVAL_MS = 15_000;

function formatConditionLabel(key: string) {
  return key
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatJobTimestamp(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not yet recorded";
}

function resolveSelectedQueueName(
  queueHealth: QueueHealthReport | undefined,
  selectedQueueName: string | null,
): ManagedQueueName | undefined {
  const queues = queueHealth?.queues ?? [];

  if (!queues.length) {
    return undefined;
  }

  if (selectedQueueName && queues.some((queue) => queue.name === selectedQueueName)) {
    return selectedQueueName as ManagedQueueName;
  }

  const failedQueue = queues.find((queue) => (queue.counts?.failed ?? 0) > 0);
  return (failedQueue?.name ?? queues[0]?.name) as ManagedQueueName | undefined;
}

function QueueSummaryCard({
  icon: Icon,
  label,
  value,
  meta,
  action,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  meta: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
            {value}
          </p>
        </div>
        <Icon className="h-5 w-5 text-[var(--dashboard-text-secondary)]" />
      </div>
      <p className="mt-3 text-sm text-[var(--dashboard-text-secondary)]">{meta}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

function LiveRefreshBadge({
  timestamp,
}: {
  timestamp?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--dashboard-border)] bg-white px-3 py-1.5 text-xs text-[var(--dashboard-text-secondary)]">
      <span className="flex items-center gap-2 font-medium text-[var(--dashboard-text-primary)]">
        <RefreshCw className="h-3.5 w-3.5" />
        Live every 15s
      </span>
      <span className="hidden h-4 w-px bg-[var(--dashboard-border)] sm:block" />
      <span className="hidden sm:block">
        {timestamp ? `Updated ${new Date(timestamp).toLocaleTimeString()}` : "Waiting for first refresh"}
      </span>
    </div>
  );
}

function formatDigestRunLabel(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not scheduled yet";
}

function ReadinessCheck({
  label,
  detail,
  ready,
}: {
  label: string;
  detail: string;
  ready: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-4">
      <div
        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          ready
            ? "bg-emerald-50 text-emerald-600"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {ready ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <CircleAlert className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-[var(--dashboard-text-primary)]">{label}</p>
          <Badge variant={ready ? "active" : "pending"} size="sm">
            {ready ? "Ready" : "Needs work"}
          </Badge>
        </div>
        <p className="mt-1 break-words text-sm leading-6 text-[var(--dashboard-text-secondary)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

function ProviderHealthCard({
  report,
}: {
  report: NonNullable<ReturnType<typeof useAdminEmailHealth>["data"]>["data"][number];
}) {
  const deliveryDetail = report.delivery_issues.length
    ? report.delivery_issues.join(", ")
    : "Configuration looks ready for test sends.";
  const webhookDetail = report.webhook_issues.length
    ? report.webhook_issues.join(", ")
    : "Inbound webhook authenticity checks are configured.";

  return (
    <div className="rounded-[24px] border border-[var(--dashboard-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
            {formatEmailProvider(report.provider)}
          </p>
          <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
            {report.is_primary
              ? "Primary delivery route"
              : report.fallback_order
                ? `Fallback route ${report.fallback_order}`
                : "Configured provider"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={report.deliverable ? "dashboardSuccess" : "dashboardWarning"}>
            {report.deliverable ? "Send ready" : "Attention needed"}
          </Badge>
          <Badge variant={getProviderBadgeVariant(report.status)} size="sm">
            {report.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ReadinessCheck
          label="Delivery readiness"
          detail={deliveryDetail}
          ready={report.deliverable}
        />
        <ReadinessCheck
          label="Webhook verification"
          detail={webhookDetail}
          ready={report.webhook_verifiable}
        />
      </div>
    </div>
  );
}

function AdvancedOperationsSection({
  queueHealth,
  isLoading,
  isError,
  onQueueDrillDown,
  selectedQueueName,
  failedJobs,
  failedJobsLoading,
  failedJobsError,
  queueActionPending,
  queueActionStatus,
  onPauseQueue,
  onResumeQueue,
  onRetryFailedJobs,
  onRetryFailedJob,
}: {
  queueHealth?: QueueHealthReport;
  isLoading: boolean;
  isError: boolean;
  onQueueDrillDown: (queueName: string) => void;
  selectedQueueName: string | null;
  failedJobs: QueueFailedJobSummary[];
  failedJobsLoading: boolean;
  failedJobsError: boolean;
  queueActionPending: boolean;
  queueActionStatus: string | null;
  onPauseQueue: () => void;
  onResumeQueue: () => void;
  onRetryFailedJobs: () => void;
  onRetryFailedJob: (jobId: string) => void;
}) {
  const attentionCount =
    queueHealth?.conditions.filter((condition) => condition.state !== "met").length ?? 0;
  const totalFailedJobs =
    queueHealth?.queues.reduce(
      (total, queue) => total + (queue.counts?.failed ?? 0),
      0,
    ) ?? 0;
  const workerMode = queueHealth?.workerTopology.mode ?? "embedded";
  const failedQueue = queueHealth?.queues.find((queue) => (queue.counts?.failed ?? 0) > 0) ?? null;
  const selectedQueue =
    queueHealth?.queues.find((queue) => queue.name === selectedQueueName) ??
    failedQueue ??
    queueHealth?.queues[0] ??
    null;

  return (
    <section id="email-advanced" className="scroll-mt-28">
      <DashboardPanel padding="lg" className="space-y-5">
        <DashboardSectionHeading
          title="Advanced operations"
          description="Inspect queue infrastructure, worker topology, and the exact runtime conditions required for background workflows to run."
          helper={
            <DashboardContextualHelp
              label="More information about advanced operations"
              title="When to use this section"
            >
              Use this section when workflows look stuck, delayed, or partially delivered. It combines Redis reachability, queue depth, consumer mode, and operational prerequisites in one place.
            </DashboardContextualHelp>
          }
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <LiveRefreshBadge timestamp={queueHealth?.checkedAt} />
              <Badge
                variant={
                  queueHealth
                    ? getQueueHealthBadgeVariant(queueHealth.status)
                    : "dashboard"
                }
              >
                {queueHealth ? formatQueueHealthStatus(queueHealth.status) : "Checking"}
              </Badge>
            </div>
          }
        />

        {isError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
            Queue diagnostics could not be loaded. Confirm the backend is running and the admin queue health endpoint is reachable.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QueueSummaryCard
            icon={Activity}
            label="Overall status"
            value={isLoading ? "..." : queueHealth ? formatQueueHealthStatus(queueHealth.status) : "Unknown"}
            meta="Queue and worker readiness snapshot"
          />
          <QueueSummaryCard
            icon={Waypoints}
            label="Worker mode"
            value={isLoading ? "..." : workerMode === "embedded" ? "Embedded" : "External"}
            meta={
              workerMode === "embedded"
                ? "API process starts queue workers"
                : "Separate worker process required"
            }
          />
          <QueueSummaryCard
            icon={Database}
            label="Redis latency"
            value={
              isLoading
                ? "..."
                : queueHealth?.redis.latencyMs !== null && queueHealth?.redis.latencyMs !== undefined
                  ? `${queueHealth.redis.latencyMs}ms`
                  : "Unavailable"
            }
            meta={
              queueHealth?.redis.reachable
                ? `Prefix: ${queueHealth.redis.queuePrefix}`
                : "Redis must be reachable for BullMQ"
            }
          />
          <QueueSummaryCard
            icon={Mail}
            label="Providers ready"
            value={isLoading ? "..." : queueHealth?.emailDelivery.deliverableProviders ?? 0}
            meta={
              queueHealth
                ? `${queueHealth.emailDelivery.providersConfigured} configured, ${attentionCount} condition(s) need attention`
                : "Email delivery prerequisites"
            }
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-[var(--dashboard-text-primary)]">
                    Queue depth
                  </h3>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Waiting, active, completed, and failed jobs for each background workflow queue. Select any queue card to inspect it below.
                  </p>
                </div>
                {totalFailedJobs > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (failedQueue) {
                        onQueueDrillDown(failedQueue.name);
                      }
                    }}
                    className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700"
                  >
                    {totalFailedJobs} failed
                  </button>
                ) : (
                  <Badge variant="active" size="sm">
                    No failed jobs
                  </Badge>
                )}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {(queueHealth?.queues ?? []).map((queue) => (
                  <div
                    key={queue.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => onQueueDrillDown(queue.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onQueueDrillDown(queue.name);
                      }
                    }}
                    className={`rounded-2xl border bg-white p-4 transition-colors ${
                      selectedQueue?.name === queue.name
                        ? "border-[var(--dashboard-accent)] shadow-[0_18px_48px_-36px_rgba(16,185,129,0.7)]"
                        : "border-[var(--dashboard-border)] hover:border-[var(--dashboard-border-strong)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--dashboard-text-primary)]">
                          {formatQueueName(queue.name)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
                          {queue.jobName}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedQueue?.name === queue.name ? (
                          <Badge variant="dashboardAccent" size="sm">
                            Selected
                          </Badge>
                        ) : null}
                        <Badge variant={queue.isPaused ? "dashboardWarning" : queue.error ? "pending" : "info"} size="sm">
                          {queue.isPaused ? "Paused" : queue.error ? "Inspection issue" : "Visible"}
                        </Badge>
                      </div>
                    </div>

                    {queue.counts ? (
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-[var(--dashboard-text-secondary)]">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em]">Waiting</p>
                          <p className="mt-1 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                            {queue.counts.waiting ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em]">Active</p>
                          <p className="mt-1 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                            {queue.counts.active ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em]">Failed</p>
                          {(queue.counts.failed ?? 0) > 0 ? (
                            <button
                              type="button"
                              onClick={() => onQueueDrillDown(queue.name)}
                              className="mt-1 text-left text-lg font-semibold text-[var(--dashboard-accent)] underline decoration-[rgba(16,185,129,0.45)] underline-offset-4"
                            >
                              {queue.counts.failed ?? 0}
                            </button>
                          ) : (
                            <p className="mt-1 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                              0
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em]">Completed</p>
                          <p className="mt-1 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                            {queue.counts.completed ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em]">Delayed</p>
                          <p className="mt-1 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                            {queue.counts.delayed ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em]">Paused</p>
                          <p className="mt-1 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                            {queue.counts.paused ?? 0}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[var(--dashboard-text-secondary)]">
                        Queue counters are unavailable right now.
                      </p>
                    )}

                    {queue.error?.message ? (
                      <p className="mt-3 text-sm text-[var(--color-rejected)]">{queue.error.message}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {selectedQueue ? (
                <div className="mt-4 rounded-[24px] border border-[var(--dashboard-border)] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
                        Queue detail
                      </p>
                      <h4 className="mt-2 text-lg font-semibold text-[var(--dashboard-text-primary)]">
                        {formatQueueName(selectedQueue.name)}
                      </h4>
                      <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                        Job name: {selectedQueue.jobName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={(selectedQueue.counts?.failed ?? 0) > 0 ? "pending" : "active"}
                      >
                        {(selectedQueue.counts?.failed ?? 0) > 0
                          ? `${selectedQueue.counts?.failed ?? 0} failed jobs`
                          : "No failed jobs"}
                      </Badge>
                      <Badge
                        variant={
                          selectedQueue.isPaused
                            ? "dashboardWarning"
                            : selectedQueue.error
                              ? "dashboardWarning"
                              : "dashboardSuccess"
                        }
                      >
                        {selectedQueue.isPaused
                          ? "Queue paused"
                          : selectedQueue.error
                            ? "Inspection issue"
                            : "Queue visible"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {selectedQueue.isPaused ? (
                      <Button
                        type="button"
                        variant="dashboardPrimary"
                        onClick={onResumeQueue}
                        isLoading={queueActionPending}
                      >
                        <Play className="h-4 w-4" />
                        Resume queue
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="dashboard"
                        onClick={onPauseQueue}
                        isLoading={queueActionPending}
                      >
                        <Pause className="h-4 w-4" />
                        Pause queue
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onRetryFailedJobs}
                      isLoading={queueActionPending}
                      disabled={(selectedQueue.counts?.failed ?? 0) === 0}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retry failed jobs
                    </Button>
                    {queueActionStatus ? (
                      <p className="text-sm text-[var(--dashboard-text-secondary)]">{queueActionStatus}</p>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <QueueSummaryCard
                      icon={Activity}
                      label="Waiting"
                      value={selectedQueue.counts?.waiting ?? 0}
                      meta="Jobs queued for pickup"
                    />
                    <QueueSummaryCard
                      icon={Waypoints}
                      label="Active"
                      value={selectedQueue.counts?.active ?? 0}
                      meta="Jobs currently processing"
                    />
                    <QueueSummaryCard
                      icon={CircleAlert}
                      label="Failed"
                      value={selectedQueue.counts?.failed ?? 0}
                      meta="Retry or investigate worker errors"
                    />
                    <QueueSummaryCard
                      icon={CheckCircle2}
                      label="Completed"
                      value={selectedQueue.counts?.completed ?? 0}
                      meta="Jobs finished successfully"
                    />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                      <h5 className="font-medium text-[var(--dashboard-text-primary)]">What to check</h5>
                      <div className="mt-3 space-y-2 text-sm text-[var(--dashboard-text-secondary)]">
                        <p>Verify Redis is reachable and the queue prefix matches the worker deployment.</p>
                        <p>Confirm the worker mode matches runtime expectations and that at least one consumer is active.</p>
                        <p>Review recent delivery events and provider readiness if failures are concentrated in email workflows.</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                      <h5 className="font-medium text-[var(--dashboard-text-primary)]">Inspection notes</h5>
                      <div className="mt-3 space-y-2 text-sm text-[var(--dashboard-text-secondary)]">
                        <p>Last checked: {queueHealth ? new Date(queueHealth.checkedAt).toLocaleString() : "Not yet loaded"}</p>
                        <p>Delayed jobs: {selectedQueue.counts?.delayed ?? 0}</p>
                        <p>Paused jobs: {selectedQueue.counts?.paused ?? 0}</p>
                        <p>Queue state: {selectedQueue.isPaused ? "Paused" : "Running"}</p>
                        {selectedQueue.error?.message ? (
                          <p className="text-[var(--color-rejected)]">{selectedQueue.error.message}</p>
                        ) : (
                          <p>No queue inspection error reported for this queue.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h5 className="font-medium text-[var(--dashboard-text-primary)]">Failed job details</h5>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                          Job ids, redacted payload summaries, attempts, and direct retry controls for the selected queue.
                        </p>
                      </div>
                      <Badge variant="dashboard" size="sm">
                        {failedJobsLoading ? "Refreshing" : `${failedJobs.length} shown`}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      {failedJobsError ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                          Failed job details could not be loaded for this queue.
                        </div>
                      ) : failedJobsLoading ? (
                        <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-6 text-sm text-[var(--dashboard-text-secondary)]">
                          Loading failed job details.
                        </div>
                      ) : failedJobs.length ? (
                        failedJobs.map((job) => (
                          <div
                            key={job.id}
                            className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-[var(--dashboard-text-primary)]">
                                  {job.payloadSummary.title}
                                </p>
                                <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                                  {job.payloadSummary.subtitle}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onRetryFailedJob(job.id)}
                                isLoading={queueActionPending}
                              >
                                <RotateCcw className="h-4 w-4" />
                                Retry job
                              </Button>
                            </div>

                            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                              <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--dashboard-text-secondary)]">
                                <p className="font-medium text-[var(--dashboard-text-primary)]">Job metadata</p>
                                <div className="mt-2 space-y-1">
                                  <p>Job ID: {job.id}</p>
                                  <p>Attempts: {job.attemptsMade}{job.attemptsConfigured ? ` / ${job.attemptsConfigured}` : ""}</p>
                                  <p>Queued: {formatJobTimestamp(job.timestamp)}</p>
                                  <p>Processed: {formatJobTimestamp(job.processedOn)}</p>
                                  <p>Failed: {formatJobTimestamp(job.finishedOn)}</p>
                                </div>
                              </div>
                              <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] px-4 py-3 text-sm text-[var(--dashboard-text-secondary)]">
                                <p className="font-medium text-[var(--dashboard-text-primary)]">Payload summary</p>
                                <div className="mt-2 space-y-1">
                                  {job.payloadSummary.fields.map((field) => (
                                    <p key={`${job.id}-${field.label}`}>
                                      {field.label}: {field.value}
                                    </p>
                                  ))}
                                </div>
                                <p className="mt-3 text-[var(--color-rejected)]">
                                  {job.failedReason ?? "No failure reason recorded."}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-6 text-sm text-[var(--dashboard-text-secondary)]">
                          No failed jobs are currently retained for this queue.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
              <h3 className="font-medium text-[var(--dashboard-text-primary)]">
                Operational conditions
              </h3>
              <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                The backend reports these checks as the exact conditions required for queue-backed workflows to be operational.
              </p>

              <div className="mt-4 space-y-3">
                {(queueHealth?.conditions ?? []).map((condition) => (
                  <div
                    key={condition.key}
                    className="rounded-2xl border border-[var(--dashboard-border)] bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                          condition.state === "met"
                            ? "bg-emerald-50 text-emerald-600"
                            : condition.state === "unmet"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {condition.state === "met" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <CircleAlert className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-[var(--dashboard-text-primary)]">
                            {formatConditionLabel(condition.key)}
                          </p>
                          <Badge
                            variant={getQueueConditionBadgeVariant(condition.state)}
                            size="sm"
                          >
                            {formatQueueConditionState(condition.state)}
                          </Badge>
                        </div>
                        <p className="mt-2 break-words text-sm text-[var(--dashboard-text-secondary)]">
                          {condition.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
              <h3 className="font-medium text-[var(--dashboard-text-primary)]">
                Runtime details
              </h3>
              <div className="mt-4 space-y-3 text-sm text-[var(--dashboard-text-secondary)]">
                <p>
                  Worker command: <span className="font-medium text-[var(--dashboard-text-primary)]">{queueHealth?.workerTopology.standaloneWorkerCommand ?? "pnpm worker"}</span>
                </p>
                <p>
                  Publish concurrency: <span className="font-medium text-[var(--dashboard-text-primary)]">{queueHealth?.workerTopology.publishWorkerConcurrency ?? 0}</span>
                </p>
                <p>
                  Email concurrency: <span className="font-medium text-[var(--dashboard-text-primary)]">{queueHealth?.workerTopology.emailWorkerConcurrency ?? 0}</span>
                </p>
                <p>
                  Last checked: <span className="font-medium text-[var(--dashboard-text-primary)]">{queueHealth ? new Date(queueHealth.checkedAt).toLocaleString() : "Not yet loaded"}</span>
                </p>
                {queueHealth?.redis.error?.message ? (
                  <p className="text-[var(--color-rejected)]">Redis: {queueHealth.redis.error.message}</p>
                ) : null}
                {queueHealth?.emailDelivery.error?.message ? (
                  <p className="text-[var(--color-rejected)]">Email readiness: {queueHealth.emailDelivery.error.message}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </DashboardPanel>
    </section>
  );
}

function EmailEventRow({ event }: { event: EmailDeliveryEvent }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
      <div className="min-w-0">
        <p className="font-medium text-[var(--color-text-primary)]">
          {formatEmailProvider(event.provider)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
          {event.source}
        </p>
      </div>
      <div className="min-w-0">
        <Badge variant={getEmailEventBadgeVariant(event.event_status)} size="sm">
          {formatEmailEventStatus(event.event_status)}
        </Badge>
        <p className="mt-2 break-words text-sm text-[var(--color-text-secondary)]">
          {event.event_type}
        </p>
      </div>
      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-[var(--color-text-primary)]">
          {event.recipient_email ?? "No recipient"}
        </p>
        <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">
          {event.provider_message_id ?? "No provider message id"}
        </p>
      </div>
      <p className="break-words text-sm text-[var(--color-text-secondary)]">
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
  const statusLabel = status.replace(/_/g, " ");
  const routeLabel = isPrimary
    ? "Primary route"
    : fallbackOrder
      ? `Fallback ${fallbackOrder}`
      : "No fallback order";
  const readinessItems = [
    {
      label: "Sender identity",
      detail: fromEmail ? fromEmail : "Add a sender address before going live.",
      ready: Boolean(fromEmail),
    },
    {
      label: "Traffic enabled",
      detail: isEnabled ? "Provider can receive transactional sends." : "Provider is paused for delivery traffic.",
      ready: isEnabled,
    },
    {
      label: "Routing role",
      detail: routeLabel,
      ready: isPrimary || Boolean(fallbackOrder),
    },
  ];

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
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[var(--dashboard-border)] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-text-tertiary)]">
              Provider editor
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
              {formatEmailProvider(provider.provider)}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--dashboard-text-secondary)]">
              Update routing, sender identity, and raw provider credentials from one place without forcing configuration details into a cramped modal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getProviderBadgeVariant(status)}>{statusLabel}</Badge>
            <Badge variant={isEnabled ? "dashboardSuccess" : "dashboardWarning"}>
              {isEnabled ? "Enabled" : "Paused"}
            </Badge>
            <Badge variant={isPrimary ? "dashboardAccent" : "dashboard"}>
              {routeLabel}
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
              Sender
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--dashboard-text-primary)]">
              {fromEmail || "No sender email"}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
              Route
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--dashboard-text-primary)]">{routeLabel}</p>
          </div>
          <div className="rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-tertiary)]">
              Last checked
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--dashboard-text-primary)]">
              {provider.last_healthcheck_at
                ? new Date(provider.last_healthcheck_at).toLocaleString()
                : "No health check yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.82fr_minmax(0,1.18fr)]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-[var(--dashboard-border)] bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold text-[var(--dashboard-text-primary)]">
              Sender identity
            </h4>
            <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
              Keep sender details explicit so admins can see exactly which name and address the provider uses.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          </div>

          <div className="rounded-[24px] border border-[var(--dashboard-border)] bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold text-[var(--dashboard-text-primary)]">
              Routing controls
            </h4>
            <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
              Define how this provider participates in the send chain and whether it currently accepts traffic.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors ${
                  isEnabled
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(event) => setIsEnabled(event.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-[var(--dashboard-text-primary)]">Enabled for traffic</p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Allow this provider to accept transactional sends.
                  </p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors ${
                  isPrimary
                    ? "border-[var(--dashboard-accent)] bg-emerald-50"
                    : "border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(event) => setIsPrimary(event.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-[var(--dashboard-text-primary)]">Primary route</p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                    Use this provider before all configured fallbacks.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--dashboard-border)] bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold text-[var(--dashboard-text-primary)]">
              Readiness snapshot
            </h4>
            <div className="mt-4 space-y-3">
              {readinessItems.map((item) => (
                <ReadinessCheck
                  key={item.label}
                  label={item.label}
                  detail={item.detail}
                  ready={item.ready}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--dashboard-border)] bg-white p-5 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            Provider configuration (JSON)
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={handleFormatJson}>
            <Braces className="h-4 w-4" />
            Format JSON
          </Button>
          </div>
          <p className="mb-3 text-sm text-[var(--dashboard-text-secondary)]">
            Paste the raw provider settings here. The editor keeps JSON readable and aligned with the rest of the page instead of hiding it in a cramped textarea.
          </p>
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
            className="min-h-[28rem] w-full rounded-2xl border border-[var(--color-border)] bg-slate-950 px-4 py-3 font-mono text-[13px] leading-6 text-slate-100 placeholder:text-slate-500 focus:border-[var(--color-deep-slate-blue)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            style={{ tabSize: 2 }}
          />
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Use Tab and Shift+Tab to indent, Enter for smart indentation, and Ctrl/Cmd+Shift+F to format.
          </p>
          {jsonError && (
            <p className="mt-2 text-sm text-[var(--color-rejected)]">{jsonError}</p>
          )}
        </div>
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
  const emailHealthQuery = useAdminEmailHealth({
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
  const queueHealthQuery = useAdminQueueHealth({
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
  const providersQuery = useAdminEmailProviders();
  const notificationsQuery = useAdminEmailNotifications();
  const workflowDigestScheduleQuery = useAdminWorkflowDigestSchedule();
  const updateProvider = useUpdateAdminEmailProvider();
  const updateNotification = useUpdateAdminEmailNotification();
  const updateWorkflowDigestSchedule = useUpdateAdminWorkflowDigestSchedule();
  const sendTestEmail = useSendAdminTestEmail();
  const queueAction = useAdminQueueAction();
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
  const [selectedQueueName, setSelectedQueueName] = useState<string | null>(null);
  const [queueActionStatus, setQueueActionStatus] = useState<string | null>(null);
  const [workflowDigestStatus, setWorkflowDigestStatus] = useState<string | null>(null);
  const [workflowDigestForm, setWorkflowDigestForm] = useState({
    is_enabled: true,
    frequency: "daily" as AdminWorkflowDigestSchedule["frequency"],
    hour_utc: 17,
    minute_utc: 0,
  });

  const providers = useMemo(
    () => sortProviders(providersQuery.data?.data ?? []),
    [providersQuery.data?.data],
  );
  const workflowDigestSchedule = workflowDigestScheduleQuery.data?.data;
  const events = emailEventsQuery.data?.data ?? [];
  const notifications = notificationsQuery.data?.data ?? [];
  const health = emailHealthQuery.data?.data ?? [];
  const queueHealth = queueHealthQuery.data?.data;
  const resolvedSelectedQueueName = useMemo(
    () => resolveSelectedQueueName(queueHealth, selectedQueueName),
    [queueHealth, selectedQueueName],
  );
  const queueFailedJobsQuery = useAdminQueueFailedJobs(
    resolvedSelectedQueueName,
    { limit: 8 },
    {
      enabled: Boolean(resolvedSelectedQueueName),
      refetchInterval: LIVE_REFRESH_INTERVAL_MS,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  );
  const queueAttentionCount =
    queueHealth?.conditions.filter((condition) => condition.state !== "met").length ?? 0;
  const sendReadyCount = health.filter((report) => report.deliverable).length;
  const webhookReadyCount = health.filter((report) => report.webhook_verifiable).length;
  const blockedProviderCount = health.filter((report) => !report.deliverable).length;
  const latestHealthTimestamp = useMemo(() => {
    const timestamps = health
      .flatMap((report) => [report.last_healthcheck_at, report.last_tested_at])
      .filter((value): value is string => Boolean(value));

    if (!timestamps.length) {
      return null;
    }

    return timestamps.reduce((latest, current) =>
      new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
    );
  }, [health]);
  const failedQueueJobs = queueFailedJobsQuery.data?.data ?? [];
  const sectionItems = [
    { id: "email-health", label: "Health", count: health.length },
    { id: "email-digest", label: "Digest" },
    { id: "email-templates", label: "Templates", count: notifications.length },
    { id: "email-events", label: "Events", count: events.length },
    { id: "email-providers", label: "Providers", count: providers.length },
    { id: "email-test-send", label: "Test send" },
    { id: "email-advanced", label: "Advanced", count: queueAttentionCount },
  ];

  useEffect(() => {
    if (!workflowDigestSchedule) {
      return;
    }

    setWorkflowDigestForm({
      is_enabled: workflowDigestSchedule.is_enabled,
      frequency: workflowDigestSchedule.frequency,
      hour_utc: workflowDigestSchedule.hour_utc,
      minute_utc: workflowDigestSchedule.minute_utc,
    });
  }, [workflowDigestSchedule]);

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

  async function handleNotificationUpdate(
    id: string,
    data: {
      label?: string;
      description?: string | null;
      classification?: EmailNotificationSettings["classification"];
      audience_roles?: EmailNotificationSettings["audience_roles"];
      is_user_configurable?: boolean;
      is_enabled?: boolean;
      provider_override?: EmailNotificationSettings["provider_override"];
      subject_template?: string | null;
      preheader_template?: string | null;
      html_template?: string | null;
      text_template?: string | null;
      draft_subject_template?: string | null;
      draft_preheader_template?: string | null;
      draft_html_template?: string | null;
      draft_text_template?: string | null;
      template_mappings?: Record<string, unknown>;
      sample_data?: Record<string, unknown>;
      variable_definitions?: EmailNotificationSettings["variable_definitions"];
      paused_until?: string | null;
      pause_reason?: string | null;
      publish_changes?: boolean;
    },
  ) {
    await updateNotification.mutateAsync({
      id,
      data,
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

  async function handleQueueAction(action: "pause" | "resume" | "retry-failed", limit?: number) {
    if (!resolvedSelectedQueueName) {
      return;
    }

    setQueueActionStatus(null);

    try {
      const result = await queueAction.mutateAsync({
        queueName: resolvedSelectedQueueName,
        data: {
          action,
          ...(limit ? { limit } : {}),
        },
      });
      setQueueActionStatus(result.message ?? "Queue action applied.");
    } catch {
      setQueueActionStatus("Queue action failed. Check queue connectivity and try again.");
    }
  }

  async function handleWorkflowDigestSave(event: React.FormEvent) {
    event.preventDefault();
    setWorkflowDigestStatus(null);

    try {
      await updateWorkflowDigestSchedule.mutateAsync({
        is_enabled: workflowDigestForm.is_enabled,
        frequency: workflowDigestForm.frequency,
        hour_utc: workflowDigestForm.hour_utc,
        minute_utc: workflowDigestForm.minute_utc,
      });
      setWorkflowDigestStatus("Digest schedule saved.");
    } catch {
      setWorkflowDigestStatus("Could not save digest schedule. Try again.");
    }
  }

  async function handleRetryFailedJob(jobId: string) {
    if (!resolvedSelectedQueueName) {
      return;
    }

    setQueueActionStatus(null);

    try {
      const result = await queueAction.mutateAsync({
        queueName: resolvedSelectedQueueName,
        data: {
          action: "retry-job",
          job_id: jobId,
        },
      });
      setQueueActionStatus(result.message ?? "Queue action applied.");
    } catch {
      setQueueActionStatus("Job retry failed. Check worker connectivity and try again.");
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPanel
        padding="lg"
        className="space-y-5 overflow-hidden border-[var(--dashboard-border-strong)] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"
      >
        <DashboardSectionHeading
          title="Email Settings"
          description="Run delivery operations, verify readiness, and manage templates from one page that stays readable under load."
          helper={
            <DashboardContextualHelp
              label="More information about email settings"
              title="Why this page is sectioned"
            >
              Email operations mix health, provider setup, queue diagnostics, templates, and live events. This layout separates immediate readiness from deeper editing work so the page is easier to act on quickly.
            </DashboardContextualHelp>
          }
          action={<Badge variant="dashboardAccent">Admin only</Badge>}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QueueSummaryCard
            icon={Mail}
            label="Send ready"
            value={emailHealthQuery.isLoading ? "..." : sendReadyCount}
            meta="Providers ready for transactional delivery"
          />
          <QueueSummaryCard
            icon={CheckCircle2}
            label="Verified webhooks"
            value={emailHealthQuery.isLoading ? "..." : webhookReadyCount}
            meta="Inbound authenticity checks configured"
          />
          <QueueSummaryCard
            icon={Waypoints}
            label="Queue status"
            value={queueHealthQuery.isLoading ? "..." : queueHealth ? formatQueueHealthStatus(queueHealth.status) : "Unknown"}
            meta="Background workflow readiness"
          />
          <QueueSummaryCard
            icon={CircleAlert}
            label="Needs attention"
            value={emailHealthQuery.isLoading ? "..." : blockedProviderCount + queueAttentionCount}
            meta="Providers or runtime checks that need review"
          />
        </div>
      </DashboardPanel>

      {(providersQuery.isError || notificationsQuery.isError || queueHealthQuery.isError) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          Parts of the email operations page could not be loaded. Confirm the backend is running and you are signed in as an admin.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
        <DashboardSectionNav items={sectionItems} className="order-2 xl:order-1" />

        <div className="order-1 space-y-6 xl:order-2">
          <section id="email-health" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Provider health"
                description="Immediate send readiness, webhook trust, and provider routing status without forcing you to parse long diagnostic text."
                helper={
                  <DashboardContextualHelp
                    label="More information about provider health"
                    title="How to use this section"
                  >
                    Start here when delivery looks unstable. Green checks mean the provider is operational for that concern right now. Anything else should read like a fix queue.
                  </DashboardContextualHelp>
                }
                action={<LiveRefreshBadge timestamp={latestHealthTimestamp} />}
              />

              <div className="grid gap-4 xl:grid-cols-2">
                {health.map((report) => (
                  <ProviderHealthCard key={report.provider_id} report={report} />
                ))}
              </div>
            </DashboardPanel>
          </section>

          <section id="email-digest" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Workflow digest schedule"
                description="Control when lower-priority admin workflow activity is bundled into a digest email."
                helper={
                  <DashboardContextualHelp
                    label="More information about the digest schedule"
                    title="How the digest schedule works"
                  >
                    Workflow alerts still go out immediately. This schedule controls the grouped admin digest built from queued workflow events.
                  </DashboardContextualHelp>
                }
              />

              <div className="grid gap-4 lg:grid-cols-3">
                <QueueSummaryCard
                  icon={Clock3}
                  label="Next digest"
                  value={formatDigestRunLabel(workflowDigestSchedule?.next_run_at)}
                  meta="Next scheduled admin digest run"
                />
                <QueueSummaryCard
                  icon={Clock3}
                  label="Last digest"
                  value={formatDigestRunLabel(workflowDigestSchedule?.last_run_at)}
                  meta="Most recent digest dispatch or empty run"
                />
                <QueueSummaryCard
                  icon={Mail}
                  label="Digest mode"
                  value={workflowDigestForm.is_enabled ? "Enabled" : "Paused"}
                  meta={workflowDigestForm.frequency === "hourly" ? "Runs once every hour" : "Runs once each day"}
                />
              </div>

              <form onSubmit={handleWorkflowDigestSave} className="grid gap-4 rounded-[24px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-5 lg:grid-cols-4">
                <label className="space-y-2 text-sm text-[var(--dashboard-text-primary)]">
                  <span className="font-medium">Status</span>
                  <Select
                    value={workflowDigestForm.is_enabled ? "enabled" : "paused"}
                    onChange={(event) =>
                      setWorkflowDigestForm((current) => ({
                        ...current,
                        is_enabled: event.target.value === "enabled",
                      }))
                    }
                    options={[
                      { value: "enabled", label: "Enabled" },
                      { value: "paused", label: "Paused" },
                    ]}
                  />
                </label>

                <label className="space-y-2 text-sm text-[var(--dashboard-text-primary)]">
                  <span className="font-medium">Cadence</span>
                  <Select
                    value={workflowDigestForm.frequency}
                    onChange={(event) =>
                      setWorkflowDigestForm((current) => ({
                        ...current,
                        frequency: event.target.value as AdminWorkflowDigestSchedule["frequency"],
                      }))
                    }
                    options={[
                      { value: "daily", label: "Daily" },
                      { value: "hourly", label: "Hourly" },
                    ]}
                  />
                </label>

                <label className="space-y-2 text-sm text-[var(--dashboard-text-primary)]">
                  <span className="font-medium">Hour (UTC)</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={workflowDigestForm.hour_utc}
                    onChange={(event) =>
                      setWorkflowDigestForm((current) => ({
                        ...current,
                        hour_utc: Number(event.target.value),
                      }))
                    }
                    className="h-11 rounded-xl border border-[var(--dashboard-border)] bg-white px-4 text-sm focus:border-[var(--dashboard-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--dashboard-accent)]/10"
                  />
                </label>

                <label className="space-y-2 text-sm text-[var(--dashboard-text-primary)]">
                  <span className="font-medium">Minute (UTC)</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={workflowDigestForm.minute_utc}
                    onChange={(event) =>
                      setWorkflowDigestForm((current) => ({
                        ...current,
                        minute_utc: Number(event.target.value),
                      }))
                    }
                    className="h-11 rounded-xl border border-[var(--dashboard-border)] bg-white px-4 text-sm focus:border-[var(--dashboard-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--dashboard-accent)]/10"
                  />
                </label>

                <div className="lg:col-span-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--dashboard-text-secondary)]">
                    Use hourly for high-touch operations or daily for a lighter admin inbox.
                  </p>
                  <Button
                    type="submit"
                    variant="dashboardPrimary"
                    isLoading={updateWorkflowDigestSchedule.isPending}
                  >
                    <Save className="h-4 w-4" />
                    Save digest schedule
                  </Button>
                </div>

                {workflowDigestStatus ? (
                  <p className="lg:col-span-4 text-sm text-[var(--dashboard-text-secondary)]">
                    {workflowDigestStatus}
                  </p>
                ) : null}
              </form>
            </DashboardPanel>
          </section>

          <section id="email-templates" className="scroll-mt-28 space-y-5">
            <DashboardSectionHeading
              title="Template workspace"
              description="Draft, preview, and publish transactional email content without crowding the rest of the operations page."
              helper={
                <DashboardContextualHelp
                  label="More information about the template workspace"
                  title="What this workspace contains"
                >
                  Templates are intentionally separated from provider setup so content editing does not compete with routing and health checks in the same visual block.
                </DashboardContextualHelp>
              }
            />
            <EmailTemplateWorkspace
              notifications={notifications}
              isSaving={updateNotification.isPending}
              onUpdate={handleNotificationUpdate}
            />
          </section>

          <section id="email-events" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Recent delivery events"
                description="Latest send attempts and provider webhook events across SES, Brevo, and Mailgun."
                helper={
                  <DashboardContextualHelp
                    label="More information about recent delivery events"
                    title="Why this matters"
                  >
                    Use this feed to confirm whether routing and provider setup changes are behaving as expected before digging into deeper logs.
                  </DashboardContextualHelp>
                }
              />

              <div className="space-y-3">
                {events.length ? (
                  events.map((event) => <EmailEventRow key={event.id} event={event} />)
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] px-4 py-6 text-sm text-[var(--dashboard-text-secondary)]">
                    No delivery events recorded yet. Test sends and provider webhooks will appear here.
                  </div>
                )}
              </div>
            </DashboardPanel>
          </section>

          <section id="email-providers" className="scroll-mt-28 space-y-5">
            <DashboardSectionHeading
              title="Provider configuration"
              description="Primary, fallback, and sender controls in a tighter layout that keeps configuration metadata readable."
              helper={
                <DashboardContextualHelp
                  label="More information about provider configuration"
                  title="What to review here"
                >
                  Keep provider settings concise and traceable. Health belongs above, while detailed credentials and fallback ordering belong inside each provider editor.
                </DashboardContextualHelp>
              }
            />

            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {providers.map((provider) => (
                <Card key={provider.id}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {formatEmailProvider(provider.provider)}
                        </h2>
                        <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">
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

                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <Mail className="h-4 w-4" />
                      Edit Provider
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="email-test-send" className="scroll-mt-28">
            <DashboardPanel padding="lg" className="space-y-5">
              <DashboardSectionHeading
                title="Test send"
                description="Send a transactional test email through the routing chain or a selected provider without squeezing the form into a narrow row."
                helper={
                  <DashboardContextualHelp
                    label="More information about test sends"
                    title="When to use this"
                  >
                    Use test sends after provider or template changes to verify routing and payload rendering before depending on live workflow traffic.
                  </DashboardContextualHelp>
                }
              />

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <form onSubmit={handleTestSend} className="grid gap-4 sm:grid-cols-2">
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
                    className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10 sm:col-span-2"
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
                  <div className="sm:col-span-2 flex justify-start">
                    <Button type="submit" isLoading={sendTestEmail.isPending}>
                      <Send className="h-4 w-4" />
                      Send test
                    </Button>
                  </div>
                </form>

                <div className="rounded-[24px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-alt)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-tertiary)]">
                    Message body
                  </p>
                  <textarea
                    rows={5}
                    value={testSendForm.message}
                    onChange={(event) =>
                      setTestSendForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    className="mt-3 w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                  />
                  {testSendStatus ? (
                    <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{testSendStatus}</p>
                  ) : null}
                </div>
              </div>
            </DashboardPanel>
          </section>

          <AdvancedOperationsSection
            queueHealth={queueHealth}
            isLoading={queueHealthQuery.isLoading}
            isError={queueHealthQuery.isError}
            selectedQueueName={resolvedSelectedQueueName ?? null}
            onQueueDrillDown={setSelectedQueueName}
            failedJobs={failedQueueJobs}
            failedJobsLoading={queueFailedJobsQuery.isLoading}
            failedJobsError={queueFailedJobsQuery.isError}
            queueActionPending={queueAction.isPending}
            queueActionStatus={queueActionStatus}
            onPauseQueue={() => handleQueueAction("pause")}
            onResumeQueue={() => handleQueueAction("resume")}
            onRetryFailedJobs={() => handleQueueAction("retry-failed", 8)}
            onRetryFailedJob={handleRetryFailedJob}
          />
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedProvider)}
        onClose={() => setSelectedProvider(null)}
        title={selectedProvider ? `Edit ${formatEmailProvider(selectedProvider.provider)}` : undefined}
        dialogClassName="max-w-6xl"
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