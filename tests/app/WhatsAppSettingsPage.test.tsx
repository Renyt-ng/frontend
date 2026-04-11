import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WhatsAppSettingsPage from "@/app/(dashboard)/dashboard/whatsapp-settings/page";

const hooks = vi.hoisted(() => ({
  useAdminWhatsAppOverview: vi.fn(),
  useAdminWhatsAppEvents: vi.fn(),
  useAdminWhatsAppActionControls: vi.fn(),
  useAdminWhatsAppAgentAccessList: vi.fn(),
  useAdminWhatsAppListingCreationReport: vi.fn(),
  useAdminWhatsAppTasks: vi.fn(),
  useDispatchAdminWhatsAppListingCreation: vi.fn(),
  useDispatchAdminWhatsAppFinalOutcome: vi.fn(),
  useRecoverAdminWhatsAppTask: vi.fn(),
  useSendAdminWhatsAppTest: vi.fn(),
  useUpdateAdminWhatsAppActionControl: vi.fn(),
  useUpdateAdminWhatsAppAgentAccess: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

describe("WhatsAppSettingsPage", () => {
  beforeEach(() => {
    hooks.useAdminWhatsAppOverview.mockReturnValue({
      data: {
        data: {
          provider: "meta_cloud_api",
          status: "configured",
          phone_number_id: "phone-123",
          display_phone_number: "+2348030000000",
          waba_id: "waba-1",
          webhook_configured: true,
          action_summary: {
            total_enabled: 3,
            total_paused: 1,
            total_agents_enrolled: 4,
          },
          recent_summary: {
            total: 12,
            delivered: 9,
            read: 6,
            failed: 1,
            last_sent_at: "2026-04-09T09:00:00.000Z",
          },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useAdminWhatsAppEvents.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useAdminWhatsAppActionControls.mockReturnValue({
      data: {
        data: [
          {
            id: "action-1",
            action_type: "listing_creation",
            status: "enabled",
            paused_reason: null,
            updated_at: "2026-04-09T09:00:00.000Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useAdminWhatsAppAgentAccessList.mockReturnValue({
      data: {
        data: [
          {
            id: "access-1",
            agent_id: "agent-1",
            access_status: "eligible_paid",
            enabled_actions: ["listing_creation"],
            business_name: "Prime Homes",
            whatsapp_phone: "+2348030000000",
            primary_phone: "+2348030000000",
            verification_status: "approved",
            trial_expires_at: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useAdminWhatsAppListingCreationReport.mockReturnValue({
      data: {
        data: {
          flow_version: "listing_creation_v2",
          summary: {
            active_tasks: 5,
            offered_tasks: 2,
            in_progress_tasks: 3,
            completed_tasks: 4,
            stale_tasks: 2,
            reminders_sent_last_24h: 3,
            publish_ready_drafts: 1,
          },
          step_breakdown: [
            { step: "awaiting_images", count: 2 },
            { step: "capture_rent_amount", count: 1 },
          ],
          charts: {
            age_buckets: [
              { label: "<3h", count: 1 },
              { label: "3-12h", count: 2 },
              { label: "12-24h", count: 1 },
              { label: "24h+", count: 1 },
            ],
            reminder_distribution: [
              { label: "0", count: 2 },
              { label: "1", count: 2 },
              { label: "2", count: 1 },
              { label: "3+", count: 0 },
            ],
            pending_field_hotspots: [
              { field: "service_charge", count: 3 },
              { field: "address_line", count: 2 },
            ],
          },
          stale_drafts: [
            {
              task_id: "task-1",
              agent_id: "agent-1",
              property_id: "property-1",
              property_title: "Draft in Yaba",
              current_step: "awaiting_images",
              next_recommended_step: "publish_prompt",
              pending_fields: ["service_charge", "address_line"],
              uploaded_image_count: 3,
              age_hours: 25.4,
              reminder_count: 1,
              last_reminder_sent_at: "2026-04-09T08:00:00.000Z",
              updated_at: "2026-04-08T08:00:00.000Z",
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useAdminWhatsAppTasks.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useDispatchAdminWhatsAppListingCreation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useDispatchAdminWhatsAppFinalOutcome.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useRecoverAdminWhatsAppTask.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useSendAdminWhatsAppTest.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useUpdateAdminWhatsAppActionControl.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useUpdateAdminWhatsAppAgentAccess.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("renders the reminder-health charts and hotspot panel", () => {
    render(<WhatsAppSettingsPage />);

    expect(screen.getByRole("heading", { name: /listing flow report/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /draft age spread/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /reminder saturation/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /top missing fields/i })).toBeInTheDocument();
    expect(screen.getByText(/service charge/i)).toBeInTheDocument();
    expect(screen.getByText(/24h\+/i)).toBeInTheDocument();
  });
});