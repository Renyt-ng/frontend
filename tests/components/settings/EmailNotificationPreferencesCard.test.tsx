import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EmailNotificationPreferencesCard } from "@/components/settings/EmailNotificationPreferencesCard";

const hooks = vi.hoisted(() => ({
  useUpdateEmailNotificationPreferences: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

describe("EmailNotificationPreferencesCard", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({
      data: {
        id: "user-1",
        email: "agent@renyt.ng",
        full_name: "Agent Test",
        phone: null,
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        role: "agent",
        email_notification_preferences: {
          listing_freshness_reminder: true,
          referral_status_update: false,
        },
        created_at: "2026-03-29T00:00:00.000Z",
      },
    });

    hooks.useUpdateEmailNotificationPreferences.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
  });

  it("renders optional controls only for the active role", () => {
    render(
      <EmailNotificationPreferencesCard
        profile={{
          id: "user-1",
          email: "agent@renyt.ng",
          full_name: "Agent Test",
          phone: null,
          avatar_url: null,
          avatar_review_status: "pending",
          avatar_review_note: null,
          role: "agent",
          email_notification_preferences: {
            listing_freshness_reminder: true,
            referral_status_update: false,
          },
          created_at: "2026-03-29T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.queryByText(/agent verification approved/i)).toBeNull();
    expect(screen.queryByText(/^always on$/i)).toBeNull();
    expect(screen.getByText(/listing freshness reminders/i)).toBeInTheDocument();
    expect(screen.getByText(/optional reminders only\. critical account emails stay on\./i)).toBeInTheDocument();
    expect(
      screen.queryByText(/mandatory account emails are still delivered/i),
    ).toBeNull();
    expect(
      screen.getByRole("switch", {
        name: /email preference: listing freshness reminders/i,
      }),
    ).toBeInTheDocument();
  });

  it("saves optional preference changes", async () => {
    render(
      <EmailNotificationPreferencesCard
        profile={{
          id: "user-1",
          email: "agent@renyt.ng",
          full_name: "Agent Test",
          phone: null,
          avatar_url: null,
          avatar_review_status: "pending",
          avatar_review_note: null,
          role: "agent",
          email_notification_preferences: {
            listing_freshness_reminder: false,
            referral_status_update: false,
          },
          created_at: "2026-03-29T00:00:00.000Z",
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("switch", {
        name: /email preference: listing freshness reminders/i,
      }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        listing_freshness_reminder: true,
      });
    });
  });
});