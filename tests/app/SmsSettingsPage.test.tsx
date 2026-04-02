import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SmsSettingsPage from "@/app/(dashboard)/dashboard/sms-settings/page";

const hooks = vi.hoisted(() => ({
  useAdminSmsOverview: vi.fn(),
  useAdminSmsEvents: vi.fn(),
  useSendAdminTestSms: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

describe("SmsSettingsPage", () => {
  beforeEach(() => {
    hooks.useAdminSmsOverview.mockReturnValue({
      data: {
        data: {
          provider: "bulksmsnigeria",
          status: "sandbox",
          sender_id: "Renyt",
          base_url: "https://www.bulksmsnigeria.com/api/sandbox/v2",
          callback_url: "https://renyt.ng/api/v1/webhooks/sms",
          sandbox_mode: true,
          balance: {
            balance: 500,
            currency: "NGN",
            fetched_at: "2026-04-02T10:00:00.000Z",
            error: null,
          },
          recent_summary: {
            total: 6,
            sent: 5,
            failed: 1,
            verification: 4,
            tests: 2,
            last_sent_at: "2026-04-02T09:55:00.000Z",
          },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useAdminSmsEvents.mockReturnValue({
      data: {
        data: [
          {
            id: "sms-1",
            provider: "bulksmsnigeria",
            event_status: "sent",
            event_type: "phone_verification_code",
            recipient_phone: "+234 803 000 0000",
            provider_message_id: "msg-123",
            provider_event_id: null,
            source: "system",
            cost: 5.62,
            balance_after: 194.38,
            currency: "NGN",
            payload: {},
            headers: {},
            occurred_at: "2026-04-02T09:55:00.000Z",
            created_at: "2026-04-02T09:55:00.000Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useSendAdminTestSms.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        data: {
          provider: "bulksmsnigeria",
          provider_message_id: "msg-test-1",
          cost: 5.62,
          balance: 194.38,
          recipient_phone: "08030000000",
        },
      }),
      isPending: false,
    });
  });

  it("renders SMS overview, balance, and recent activity", () => {
    render(<SmsSettingsPage />);

    expect(screen.getByRole("heading", { name: /sms operations/i })).toBeInTheDocument();
    expect(screen.getAllByText(/bulksmsnigeria/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/wallet balance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/verification sends/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /recent sms activity/i })).toBeInTheDocument();
    expect(screen.getByText(/\+234 803 000 0000/i)).toBeInTheDocument();
    expect(screen.getByText(/msg-123/i)).toBeInTheDocument();
  });

  it("submits a test SMS from the admin form", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      data: {
        provider: "bulksmsnigeria",
        provider_message_id: "msg-test-1",
        cost: 5.62,
        balance: 194.38,
        recipient_phone: "08030000000",
      },
    });
    hooks.useSendAdminTestSms.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<SmsSettingsPage />);

    fireEvent.change(screen.getByLabelText(/recipient phone/i), {
      target: { value: "08030000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send test sms/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        recipient_phone: "08030000000",
        message: "This is a Renyt admin SMS provider test from BulkSMSNigeria.",
      });
    });
  });
});