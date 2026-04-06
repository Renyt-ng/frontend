import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const getProperty = vi.fn();

vi.mock("@/lib/api", () => ({
  propertiesApi: {
    getProperty,
  },
}));

vi.mock("@/components/property", async () => {
  const actual = await vi.importActual<typeof import("@/components/property")>(
    "@/components/property",
  );

  return {
    ...actual,
    PropertyGallery: () => <div>Gallery</div>,
    PropertyAgentCard: () => <div>Agent card</div>,
    PropertySpecs: () => <div>Specs</div>,
    PricingBreakdown: () => <div data-testid="pricing-breakdown">Pricing</div>,
    PropertyEngagementButtons: () => <div>Engagement</div>,
    PropertyViewTracker: () => null,
  };
});

vi.mock("@/components/property/PropertyActionPanel", () => ({
  PropertyActionPanel: () => <div>Action panel</div>,
}));

vi.mock("@/components/property/WalkthroughVideoPlayer", () => ({
  WalkthroughVideoPlayer: () => <div>Video player</div>,
}));

vi.mock("@/components/property/PropertyStickyCta", () => ({
  PropertyStickyCta: () => <div data-testid="sticky-cta">Sticky CTA</div>,
}));

vi.mock("@/components/referrals", () => ({
  ReferralShareTriggerButton: ({ label }: { label?: string }) => (
    <button type="button">{label ?? "Share"}</button>
  ),
}));

vi.mock("@/components/shared", () => ({
  VerifiedBadge: () => <span>Verified</span>,
}));

describe("PropertyDetailPage", () => {
  beforeEach(() => {
    getProperty.mockReset();
  });

  it("renders pricing directly beneath the gallery and keeps the sticky CTA available", async () => {
    getProperty.mockResolvedValue({
      data: {
        id: "sale-property-1",
        agent_id: "agent-1",
        title: "Modern Luxury Apartment",
        description: "A sale listing with clear fee structure.",
        area: "Ikoyi",
        address_line: "Plot 2, Sky View Street",
        property_type: "apartment",
        listing_purpose: "sale",
        bedrooms: 4,
        bathrooms: 4,
        rent_amount: null,
        asking_price: 150000000,
        is_price_negotiable: false,
        service_charge: null,
        caution_deposit: null,
        agency_fee: 7500000,
        application_mode: "message_agent",
        is_verified: true,
        verification_status: "approved",
        status: "active",
        availability_confirmed_at: "2026-04-06T08:00:00.000Z",
        last_updated_at: "2026-04-06T08:00:00.000Z",
        created_at: "2026-04-05T08:00:00.000Z",
        images: [],
        property_fees: [
          {
            id: "fee-1",
            property_id: "sale-property-1",
            fee_type_id: "fee-type-1",
            label: "Legal Fee",
            value_type: "percentage",
            amount: null,
            percentage: 5,
            calculated_amount: 7500000,
            display_order: 0,
            created_at: "2026-04-05T08:00:00.000Z",
          },
          {
            id: "fee-2",
            property_id: "sale-property-1",
            fee_type_id: "fee-type-2",
            label: "Documentation",
            value_type: "fixed",
            amount: 250000,
            percentage: null,
            calculated_amount: 250000,
            display_order: 1,
            created_at: "2026-04-05T08:00:00.000Z",
          },
        ],
        pricing_summary: {
          annual_rent: 0,
          monthly_equivalent: 0,
          asking_price: 150000000,
          fees_total: 7750000,
          total_move_in_cost: 157750000,
        },
      },
    });

    const module = await import("@/app/(marketing)/properties/[id]/page");
    const Page = module.default;

    render(await Page({ params: Promise.resolve({ id: "sale-property-1" }) }));

    const gallery = screen.getByText("Gallery");
    const pricing = screen.getByTestId("pricing-breakdown");
    const title = screen.getByRole("heading", { name: "Modern Luxury Apartment" });

    expect(gallery.compareDocumentPosition(pricing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(pricing.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("sticky-cta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share and earn/i })).toBeInTheDocument();
  }, 15000);

  it("keeps the pricing block above the property title for negotiable sale listings too", async () => {
    getProperty.mockResolvedValue({
      data: {
        id: "sale-property-2",
        agent_id: "agent-1",
        title: "Negotiable Family Duplex",
        description: "A negotiable sale listing.",
        area: "Lekki",
        address_line: "12 Admiralty Way",
        property_type: "duplex",
        listing_purpose: "sale",
        bedrooms: 5,
        bathrooms: 5,
        rent_amount: null,
        asking_price: 95000000,
        is_price_negotiable: true,
        service_charge: null,
        caution_deposit: null,
        agency_fee: 4500000,
        application_mode: "message_agent",
        is_verified: true,
        verification_status: "approved",
        status: "active",
        availability_confirmed_at: "2026-04-06T08:00:00.000Z",
        last_updated_at: "2026-04-06T08:00:00.000Z",
        created_at: "2026-04-05T08:00:00.000Z",
        images: [],
        property_fees: [],
      },
    });

    const module = await import("@/app/(marketing)/properties/[id]/page");
    const Page = module.default;

    render(await Page({ params: Promise.resolve({ id: "sale-property-2" }) }));

    const gallery = screen.getByText("Gallery");
    const pricing = screen.getByTestId("pricing-breakdown");
    const title = screen.getByRole("heading", { name: "Negotiable Family Duplex" });

    expect(gallery.compareDocumentPosition(pricing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(pricing.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }, 15000);
});