import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReferralProgramModal } from "@/components/referrals/ReferralProgramModal";

const hooks = vi.hoisted(() => ({
  useReferralDashboard: vi.fn(),
  useReferralPropertyPreview: vi.fn(),
  useEnrollReferralProgram: vi.fn(),
  useCreateReferralShareLink: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

describe("ReferralProgramModal", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
      this.open = false;
    });

    hooks.useReferralDashboard.mockReturnValue({
      data: {
        data: {
          profile: {
            id: "profile-1",
            user_id: "user-1",
            referral_code: "G7853E095FC",
            accepted_terms_at: "2026-04-05T00:00:00.000Z",
            accepted_terms_version: "launch-v1",
            created_at: "2026-04-05T00:00:00.000Z",
            updated_at: "2026-04-05T00:00:00.000Z",
          },
        },
      },
      isLoading: false,
    });
    hooks.useReferralPropertyPreview.mockReturnValue({
      data: {
        data: {
          program_enabled: true,
          campaign_name: "Launch rent referral bonus",
          terms_version: "launch-v1",
          listing_authority_mode: "authorized_listing_agent",
          declared_commission_share_percent: 40,
          public_commission_basis_amount: 750000,
          eligible_referral_basis_amount: 300000,
          preview: {
            commission_type: "percentage",
            commission_value: 5,
            commission_basis_label: "agency fee",
            commission_basis_amount: 300000,
            estimated_amount: 37500,
          },
        },
      },
      isLoading: false,
    });
    hooks.useEnrollReferralProgram.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useCreateReferralShareLink.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("explains when potential earnings use an authorized listing agent share", async () => {
    render(
      <ReferralProgramModal
        isOpen
        onClose={() => {}}
        property={{
          id: "property-1",
          agent_id: "agent-1",
          title: "Modern/Luxury Apartment",
          area: "Ikoyi",
          property_type: "apartment",
          is_verified: true,
        }}
      />,
    );

    expect(await screen.findByText(/authorized listing agent/i)).toBeInTheDocument();
    expect(screen.getByText(/declared 40% share of the agency fee/i)).toBeInTheDocument();
  });
});