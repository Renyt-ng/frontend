import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReferralDashboardView } from "@/components/referrals/ReferralDashboardView";

const hooks = vi.hoisted(() => ({
  useReferralDashboard: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ReferralDashboardView", () => {
  beforeEach(() => {
    hooks.useReferralDashboard.mockReturnValue({
      data: {
        data: {
          profile: {
            id: "profile-1",
            user_id: "user-1",
            referral_code: "ADA123",
            accepted_terms_at: "2026-04-05T00:00:00.000Z",
            accepted_terms_version: "launch-v1",
            created_at: "2026-04-05T00:00:00.000Z",
            updated_at: "2026-04-05T00:00:00.000Z",
          },
          summary: {
            potential_earnings: 125000,
            under_review_earnings: 50000,
            confirmed_earnings: 40000,
            paid_earnings: 30000,
            qualified_referrals: 6,
          },
          recent_activity: [],
          property_performance: [],
        },
      },
      isLoading: false,
      isError: false,
    });
  });

  it("explains that rent referral earnings are reviewed against confirmed duration", () => {
    render(<ReferralDashboardView />);

    expect(screen.getByText(/How rent referral earnings are reviewed/i)).toBeInTheDocument();
    expect(screen.getByText(/Potential earnings for rent listings are examples, not final payouts/i)).toBeInTheDocument();
    expect(screen.getByText(/For apartments, final earnings can increase when the confirmed lease duration is longer/i)).toBeInTheDocument();
    expect(screen.getByText(/For shortlets, final earnings can increase when the confirmed stay runs for more nights/i)).toBeInTheDocument();
    expect(screen.getByText(/Renyt reviews the final payout after the booking or lease duration is recorded/i)).toBeInTheDocument();
  });
});