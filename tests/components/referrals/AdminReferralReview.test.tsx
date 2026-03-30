import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminReferralReview } from "@/components/referrals/AdminReferralReview";

const hooks = vi.hoisted(() => ({
  useAdminListingFreshnessPolicy: vi.fn(),
  useAdminReferralEvents: vi.fn(),
  useAdminReferralProgram: vi.fn(),
  useCreateReferralCampaign: vi.fn(),
  useUpdateListingFreshnessPolicy: vi.fn(),
  useUpdateReferralCampaign: vi.fn(),
  useUpdateReferralEvent: vi.fn(),
  useUpdateReferralProgramSettings: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AdminReferralReview", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close() {
      this.open = false;
    });
    hooks.useAdminListingFreshnessPolicy.mockReturnValue({
      data: {
        data: {
          id: "policy-1",
          fresh_window_days: 14,
          confirmation_grace_days: 7,
          reminder_start_days: 10,
          reminder_interval_days: 2,
          auto_mark_unavailable: true,
          created_at: "2026-03-30T00:00:00.000Z",
          updated_at: "2026-03-30T00:00:00.000Z",
        },
      },
      isLoading: false,
    });
    hooks.useAdminReferralProgram.mockReturnValue({
      data: {
        data: {
          settings: {
            id: "settings-1",
            is_enabled: true,
            default_commission_type: "fixed",
            default_commission_value: 20000,
            default_basis_source: "none",
            fallback_commission_amount: 20000,
            terms_version: "launch-v1",
            updated_by: null,
            created_at: "2026-03-30T00:00:00.000Z",
            updated_at: "2026-03-30T00:00:00.000Z",
          },
          campaigns: [
            {
              id: "campaign-1",
              name: "Festive push",
              description: "A targeted campaign",
              is_active: true,
              priority: 2,
              property_id: null,
              listing_purpose: "rent",
              area: "Lekki",
              starts_at: null,
              ends_at: null,
              commission_type: "percentage",
              commission_value: 5,
              commission_basis_source: "agency_fee",
              fallback_commission_amount: 20000,
              created_by: null,
              updated_by: null,
              created_at: "2026-03-30T00:00:00.000Z",
              updated_at: "2026-03-30T00:00:00.000Z",
            },
          ],
        },
      },
      isLoading: false,
    });
    hooks.useAdminReferralEvents.mockReturnValue({
      data: {
        data: [
          {
            id: "event-1",
            referrer_user_id: "user-1",
            referrer_name: "Ada",
            referrer_email: "ada@example.com",
            referrer_phone: "08030000000",
            referred_user_id: "user-2",
            referred_name: "Tobi",
            property_id: "property-1",
            property_title: "Lekki 2-bed",
            property_area: "Lekki",
            property_status: "active",
            property_is_verified: true,
            qualification_type: "message_agent",
            source_channel: "whatsapp",
            status: "under_review",
            amount: 30000,
            commission_type: "fixed",
            commission_value: 30000,
            commission_basis_label: null,
            commission_basis_amount: null,
            campaign_name: "Festive push",
            close_status: null,
            close_source: null,
            close_type: null,
            close_recorded_at: null,
            inquiry_id: null,
            referral_code: "ADA123",
            matched_user_id: "user-2",
            matched_user_name: "Tobi",
            matched_user_email: "tobi@example.com",
            matched_user_phone: "08031111111",
            is_winning_referral: true,
            ineligible_reason: null,
            rejection_reason: null,
            admin_note: null,
            fraud_flags: [],
            created_at: "2026-03-30T00:00:00.000Z",
            confirmed_at: null,
            paid_at: null,
          },
        ],
      },
      isLoading: false,
    });
    hooks.useCreateReferralCampaign.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useUpdateListingFreshnessPolicy.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useUpdateReferralCampaign.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useUpdateReferralEvent.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useUpdateReferralProgramSettings.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("renders the refined admin sections and affixed inputs", () => {
    render(<AdminReferralReview />);

    expect(screen.getByText(/Referral operations/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Listing freshness policy/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Program defaults/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Campaign overrides/i)).toBeInTheDocument();
    expect(screen.getByText(/Referral review queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Matched account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Configure policy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Configure defaults/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Configure override/i }).length).toBeGreaterThan(0);
  });

  it("opens compact configuration in a modal editor", () => {
    render(<AdminReferralReview />);

    fireEvent.click(screen.getByRole("button", { name: /Configure defaults/i }));

    expect(screen.getByText(/Configure program defaults/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save defaults/i })).toBeInTheDocument();
  });
});