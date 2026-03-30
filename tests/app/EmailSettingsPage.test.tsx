import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import EmailSettingsPage from "@/app/(dashboard)/dashboard/email-settings/page";

const hooks = vi.hoisted(() => ({
  useAdminEmailEvents: vi.fn(),
  useAdminEmailHealth: vi.fn(),
  useAdminEmailNotifications: vi.fn(),
  useAdminEmailProviders: vi.fn(),
  useAdminQueueAction: vi.fn(),
  useAdminQueueFailedJobs: vi.fn(),
  useAdminQueueHealth: vi.fn(),
  useSendAdminTestEmail: vi.fn(),
  useUpdateAdminEmailNotification: vi.fn(),
  useUpdateAdminEmailProvider: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

vi.mock("@/components/admin/EmailTemplateWorkspace", () => ({
  EmailTemplateWorkspace: () => <div>Email template workspace</div>,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("EmailSettingsPage", () => {
  beforeEach(() => {
    hooks.useAdminEmailEvents.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    });
    hooks.useAdminEmailHealth.mockReturnValue({
      data: {
        data: [
          {
            provider: "ses",
            provider_id: "provider-1",
            status: "primary",
            is_enabled: true,
            is_primary: true,
            fallback_order: null,
            issues: [],
            deliverable: true,
            delivery_issues: [],
            webhook_issues: [],
            webhook_verifiable: true,
            last_tested_at: null,
            last_healthcheck_at: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    hooks.useAdminEmailProviders.mockReturnValue({
      data: {
        data: [
          {
            id: "provider-1",
            provider: "ses",
            status: "primary",
            is_enabled: true,
            is_primary: true,
            fallback_order: null,
            from_email: "ops@renyt.ng",
            from_name: "Renyt",
            configuration: {},
            health_metadata: {},
            last_tested_at: null,
            last_healthcheck_at: null,
            created_by: null,
            updated_by: null,
            created_at: "2026-03-30T00:00:00.000Z",
            updated_at: "2026-03-30T00:00:00.000Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    hooks.useAdminEmailNotifications.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    });
    hooks.useAdminQueueHealth.mockReturnValue({
      data: {
        data: {
          checkedAt: "2026-03-30T08:30:00.000Z",
          status: "degraded",
          redis: {
            configured: true,
            reachable: true,
            latencyMs: 4,
            queuePrefix: "renyt",
            error: null,
          },
          workerTopology: {
            mode: "external",
            apiStartsWorkers: false,
            standaloneWorkerCommand: "pnpm worker",
            publishWorkerConcurrency: 4,
            emailWorkerConcurrency: 4,
          },
          emailDelivery: {
            providersConfigured: 1,
            deliverableProviders: 1,
            ready: true,
            error: null,
          },
          queues: [
            {
              name: "property-publish",
              jobName: "finalize-property-publish",
              counts: {
                waiting: 2,
                active: 1,
                completed: 5,
                failed: 3,
                delayed: 0,
                paused: 0,
              },
              isPaused: false,
              error: null,
            },
            {
              name: "email-notifications",
              jobName: "send-transactional-email",
              counts: {
                waiting: 0,
                active: 0,
                completed: 1,
                failed: 1,
                delayed: 0,
                paused: 0,
              },
              isPaused: true,
              error: null,
            },
          ],
          conditions: [
            {
              key: "queue_consumer_topology",
              state: "unverified",
              message: "The API expects an external worker process. Run `pnpm worker` in the backend deployment.",
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
    });
    hooks.useAdminQueueFailedJobs.mockImplementation((queueName?: string) => ({
      data: {
        data:
          queueName === "email-notifications"
            ? [
                {
                  id: "job-email-1",
                  queueName: "email-notifications",
                  name: "send-transactional-email",
                  failedReason: "Webhook signing key missing",
                  attemptsMade: 2,
                  attemptsConfigured: 5,
                  timestamp: "2026-03-30T08:20:00.000Z",
                  processedOn: "2026-03-30T08:21:00.000Z",
                  finishedOn: "2026-03-30T08:22:00.000Z",
                  payloadSummary: {
                    title: "tenant@renyt.ng",
                    subtitle: "lease fully signed",
                    fields: [{ label: "Subject", value: "Lease signed" }],
                  },
                  error: null,
                },
              ]
            : [
                {
                  id: "job-property-1",
                  queueName: "property-publish",
                  name: "finalize-property-publish",
                  failedReason: "Property approval lock timeout",
                  attemptsMade: 3,
                  attemptsConfigured: 5,
                  timestamp: "2026-03-30T08:10:00.000Z",
                  processedOn: "2026-03-30T08:11:00.000Z",
                  finishedOn: "2026-03-30T08:12:00.000Z",
                  payloadSummary: {
                    title: "property-44",
                    subtitle: "finalize-property-publish",
                    fields: [{ label: "Requested by", value: "user-22" }],
                  },
                  error: null,
                },
              ],
      },
      isLoading: false,
      isError: false,
    }));
    hooks.useAdminQueueAction.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        message: "Queue action applied.",
      }),
      isPending: false,
    });
    hooks.useUpdateAdminEmailProvider.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useUpdateAdminEmailNotification.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useSendAdminTestEmail.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("renders the advanced operations diagnostics section", () => {
    render(<EmailSettingsPage />);

    expect(screen.getByText(/Advanced operations/i)).toBeInTheDocument();
    expect(screen.getByText(/Queue depth/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Property Publish/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Operational conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/Queue Consumer Topology/i)).toBeInTheDocument();
    expect(screen.getAllByText(/pnpm worker/i).length).toBeGreaterThan(0);
  });

  it("enables live polling for readiness and queue diagnostics", () => {
    render(<EmailSettingsPage />);

    expect(hooks.useAdminEmailHealth).toHaveBeenCalledWith(
      expect.objectContaining({
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        staleTime: 10000,
      }),
    );
    expect(hooks.useAdminQueueHealth).toHaveBeenCalledWith(
      expect.objectContaining({
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        staleTime: 10000,
      }),
    );
    expect(hooks.useAdminQueueFailedJobs).toHaveBeenCalledWith(
      "property-publish",
      { limit: 8 },
      expect.objectContaining({
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        staleTime: 10000,
      }),
    );
  });

  it("drills into queue details when a failed count is clicked", () => {
    render(<EmailSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /4 failed/i }));

    expect(screen.getByText(/Queue detail/i)).toBeInTheDocument();
    expect(screen.getByText(/3 failed jobs/i)).toBeInTheDocument();
  }, 15000);

  it("switches the selected queue and shows failed job details for that queue", () => {
    render(<EmailSettingsPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Email Notifications send-transactional-email Paused/i,
      }),
    );

    expect(screen.getAllByText(/Email Notifications/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/tenant@renyt.ng/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resume queue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry failed jobs/i })).toBeInTheDocument();
  }, 15000);
});