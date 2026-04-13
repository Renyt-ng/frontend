import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyCard } from "@/components/property";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => false,
}));

vi.mock("@/lib/hooks/usePropertyInteractions", () => ({
  usePropertyEngagementStatus: () => ({
    data: { data: { wishlist: false, like: false } },
  }),
  useTogglePropertyEngagement: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock("@/components/property/PropertyEngagementButtons", () => ({
  PropertyEngagementButtons: () => <div data-testid="engagement-buttons" />,
}));

vi.mock("@/components/referrals", () => ({
  ReferralShareTriggerButton: ({ label }: { label?: string }) => (
    <button type="button">{label ?? "Share"}</button>
  ),
}));

const property = {
  id: "property-1",
  agent_id: "agent-1",
  title: "Urban Modern Studio",
  description: "A modern listing in Victoria Island.",
  area: "Victoria Island",
  address_line: "1 Example Street",
  property_type: "self_contain",
  listing_purpose: "rent",
  bedrooms: 1,
  bathrooms: 1,
  rent_amount: 72000000,
  asking_price: null,
  service_charge: null,
  caution_deposit: null,
  agency_fee: null,
  application_mode: "message_agent",
  status: "active",
  verification_status: "approved",
  is_verified: true,
  availability_confirmed_at: "2026-03-30T09:00:00.000Z",
  freshness_state: "fresh",
  last_updated_at: "2026-03-30T09:00:00.000Z",
  created_at: "2026-03-29T09:00:00.000Z",
  updated_at: "2026-03-30T09:00:00.000Z",
  agent_contact: {
    business_name: "Prime Homes",
    full_name: "Ayo Agent",
    phone: "+234 803 000 0000",
    whatsapp_phone: "+234 805 111 2222",
    avatar_url: null,
  },
};

describe("PropertyCard", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("renders a share action for property list cards", () => {
    render(
      <PropertyCard
        property={property as never}
        images={[
          {
            id: "image-1",
            property_id: "property-1",
            image_url: "https://example.com/image.jpg",
            display_order: 0,
            is_cover: true,
            created_at: "2026-03-29T09:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("shows the asking qualifier only when a sale listing is negotiable", () => {
    render(
      <>
        <PropertyCard
          property={{
            ...property,
            id: "sale-property-1",
            listing_purpose: "sale",
            rent_amount: null,
            asking_price: 95000000,
            is_price_negotiable: true,
          } as never}
          images={[]}
        />
        <PropertyCard
          property={{
            ...property,
            id: "sale-property-2",
            title: "Fixed Sale Listing",
            listing_purpose: "sale",
            rent_amount: null,
            asking_price: 88000000,
            is_price_negotiable: false,
          } as never}
          images={[]}
        />
      </>,
    );

    expect(screen.getByText("asking")).toBeInTheDocument();
    expect(screen.getByText("₦95,000,000")).toBeInTheDocument();
    expect(screen.getByText("₦88,000,000")).toBeInTheDocument();
    expect(screen.getAllByText("asking")).toHaveLength(1);
  });

  it("shows per night for shortlet rent listings", () => {
    render(
      <PropertyCard
        property={{
          ...property,
          id: "shortlet-1",
          property_type: "shortlet",
          rent_amount: 70000,
        } as never}
        images={[]}
      />,
    );

    expect(screen.getByText("₦70,000")).toBeInTheDocument();
    expect(screen.getByText("per night")).toBeInTheDocument();
    expect(screen.queryByText("per year")).toBeNull();
  });
});