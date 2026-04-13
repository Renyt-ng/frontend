import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ListingHealthPage from "@/app/(dashboard)/dashboard/listing-health/page";

const hooks = vi.hoisted(() => ({
  useAdminAgents: vi.fn(),
  useAdminProperties: vi.fn(),
  useConfirmPropertyAvailability: vi.fn(),
  useMyAgent: vi.fn(),
  usePropertyOutcomeCandidates: vi.fn(),
  useUpdateProperty: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/components/referrals", () => ({
  ReferralShareTriggerButton: ({ label = "Share" }: { label?: string }) => (
    <button type="button">{label}</button>
  ),
}));

describe("ListingHealthPage", () => {
  beforeEach(() => {
    hooks.useAdminAgents.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    hooks.useAdminProperties.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    hooks.useConfirmPropertyAvailability.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useMyAgent.mockReturnValue({ data: { data: { id: "agent-99" } }, isLoading: false });
    hooks.usePropertyOutcomeCandidates.mockReturnValue({ data: { data: [] }, isLoading: false });
    hooks.useUpdateProperty.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("shows non-blocking loading placeholders while admin listing data resolves", () => {
    const { container } = render(<ListingHealthPage />);

    expect(screen.getByRole("heading", { name: /listing health/i })).toBeInTheDocument();
    expect(screen.getAllByText("...").length).toBeGreaterThan(0);
    expect(screen.queryByText(/No needs confirmation/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  }, 15000);

  it("keeps admin sections contained on loaded mobile layouts", () => {
    hooks.useAdminAgents.mockReturnValue({
      data: {
        data: [
          {
            id: "agent-1",
            business_name: "Harbourline Homes and Estates",
          },
        ],
      },
      isLoading: false,
    });
    hooks.useAdminProperties.mockReturnValue({
      data: {
        data: [
          {
            id: "property-1",
            agent_id: "agent-1",
            title: "Fresh 2-Bed Terrace in Surulere with an intentionally long name for mobile containment",
            area: "Surulere",
            listing_purpose: "rent",
            property_type: "apartment",
            rent_amount: 3600000,
            asking_price: null,
            is_price_negotiable: false,
            status: "active",
            listing_segment: "organic",
            availability_confirmed_at: null,
            freshness_state: "confirmation_due",
          },
          {
            id: "property-2",
            agent_id: "agent-1",
            title: "Live listing",
            area: "Yaba",
            listing_purpose: "rent",
            property_type: "apartment",
            rent_amount: 2400000,
            asking_price: null,
            is_price_negotiable: false,
            status: "active",
            listing_segment: "admin_assisted_listing",
            availability_confirmed_at: "2026-04-10T00:00:00.000Z",
            freshness_state: "fresh",
          },
          {
            id: "property-3",
            agent_id: "agent-1",
            title: "Draft listing",
            area: "Lekki",
            listing_purpose: "rent",
            property_type: "apartment",
            rent_amount: 1800000,
            asking_price: null,
            is_price_negotiable: false,
            status: "draft",
            listing_segment: "organic",
            availability_confirmed_at: null,
            freshness_state: "stale",
          },
          {
            id: "property-4",
            agent_id: "agent-1",
            title: "Closed listing",
            area: "Ikeja",
            listing_purpose: "rent",
            property_type: "apartment",
            rent_amount: 2100000,
            asking_price: null,
            is_price_negotiable: false,
            status: "rented_renyt",
            listing_segment: "organic",
            availability_confirmed_at: null,
            freshness_state: "fresh",
          },
        ],
      },
      isLoading: false,
    });

    const { container } = render(<ListingHealthPage />);

    expect(screen.getByRole("heading", { name: /needs confirmation/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^active$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /drafts/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /final outcomes/i })).toBeInTheDocument();
    expect(container.querySelector("nav > div.grid.sm\\:grid-cols-2")).toBeTruthy();
    expect(screen.getByText(/intentionally long name for mobile containment/i)).toHaveClass("break-words");
  });

  it("shows lifecycle action buttons for needs confirmation listings", () => {
    hooks.useAdminAgents.mockReturnValue({
      data: {
        data: [
          {
            id: "agent-1",
            business_name: "Harbourline Homes",
          },
        ],
      },
      isLoading: false,
    });
    hooks.useAdminProperties.mockReturnValue({
      data: {
        data: [
          {
            id: "property-1",
            agent_id: "agent-1",
            title: "Fresh 2-Bed Terrace in Surulere",
            area: "Surulere",
            listing_purpose: "rent",
            property_type: "apartment",
            rent_amount: 3600000,
            asking_price: null,
            is_price_negotiable: false,
            status: "active",
            listing_segment: "organic",
            availability_confirmed_at: null,
            freshness_state: "confirmation_due",
            is_verified: true,
          },
        ],
      },
      isLoading: false,
    });

    render(<ListingHealthPage />);

    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm live/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unavailable/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /archive/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /via renyt/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /off-platform/i })).toBeInTheDocument();
  });
});