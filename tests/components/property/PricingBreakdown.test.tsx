import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PricingBreakdown } from "@/components/property/PricingBreakdown";

describe("PricingBreakdown", () => {
  it("shows a centered sale price without a pricing breakdown heading", () => {
    render(
      <PricingBreakdown
        property={{
          id: "sale-1",
          agent_id: "agent-1",
          title: "Sale property",
          description: "Sale property description",
          area: "Ikoyi",
          address_line: "Plot 3",
          property_type: "duplex",
          listing_purpose: "sale",
          bedrooms: 5,
          bathrooms: 5,
          rent_amount: null,
          asking_price: 390000000,
          is_price_negotiable: true,
          service_charge: null,
          caution_deposit: null,
          agency_fee: 0,
          application_mode: "message_agent",
          is_verified: true,
          verification_status: "approved",
          status: "active",
          availability_confirmed_at: null,
          last_updated_at: "2026-04-06T08:00:00.000Z",
          created_at: "2026-04-05T08:00:00.000Z",
          property_fees: [],
        } as never}
      />,
    );

    expect(screen.getByText("₦390,000,000")).toBeInTheDocument();
    expect(screen.getByText("Asking")).toBeInTheDocument();
    expect(screen.queryByText("Pricing Breakdown")).not.toBeInTheDocument();
  });

  it("shows total move-in cost first and reveals the breakdown on demand for rent listings", () => {
    render(
      <PricingBreakdown
        property={{
          id: "rent-1",
          agent_id: "agent-1",
          title: "Rent property",
          description: "Rent property description",
          area: "Yaba",
          address_line: "12 Herbert Macaulay",
          property_type: "flat",
          listing_purpose: "rent",
          bedrooms: 2,
          bathrooms: 2,
          rent_amount: 2500000,
          asking_price: null,
          is_price_negotiable: false,
          service_charge: 300000,
          caution_deposit: 250000,
          agency_fee: 250000,
          application_mode: "message_agent",
          is_verified: true,
          verification_status: "approved",
          status: "active",
          availability_confirmed_at: null,
          last_updated_at: "2026-04-06T08:00:00.000Z",
          created_at: "2026-04-05T08:00:00.000Z",
          property_fees: [],
          pricing_summary: {
            annual_rent: 2500000,
            monthly_equivalent: 208333.33,
            asking_price: 0,
            fees_total: 800000,
            total_move_in_cost: 3300000,
          },
        } as never}
      />,
    );

    expect(screen.getByText("₦3,300,000")).toBeInTheDocument();
    expect(screen.queryByText("Annual Rent")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show move-in cost breakdown/i }));

    expect(screen.getByText("Annual Rent")).toBeInTheDocument();
    expect(screen.getByText("Monthly Equivalent")).toBeInTheDocument();
    expect(screen.getByText("Service Charge")).toBeInTheDocument();
    expect(screen.getByText("Caution Deposit")).toBeInTheDocument();
    expect(screen.getByText("Agency Fee")).toBeInTheDocument();
  });
});