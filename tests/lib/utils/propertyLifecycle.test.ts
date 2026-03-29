import { describe, expect, it } from "vitest";
import {
  getListingHealthGroup,
  getOutcomeActions,
  getPropertyFinalOutcomeLabel,
  summarizeListingHealth,
} from "@/lib/utils";
import type { Property } from "@/types";

describe("propertyLifecycle utilities", () => {
  it("groups confirmation-due listings ahead of healthy active listings", () => {
    expect(
      getListingHealthGroup({
        status: "active",
        availability_confirmed_at: null,
        freshness_state: "confirmation_due",
      }),
    ).toBe("needs_confirmation");
  });

  it("keeps publishing listings in a dedicated operational group", () => {
    expect(
      getListingHealthGroup({
        status: "publishing",
        availability_confirmed_at: null,
        freshness_state: "confirmation_due",
      }),
    ).toBe("publishing");
  });

  it("returns explicit Renyt and off-platform outcome labels", () => {
    expect(getPropertyFinalOutcomeLabel("rented_renyt")).toBe("Rented via Renyt");
    expect(getPropertyFinalOutcomeLabel("sold_off_platform")).toBe("Sold off-platform");
  });

  it("returns listing-purpose-specific outcome actions", () => {
    expect(getOutcomeActions("rent")).toEqual([
      { status: "rented_renyt", label: "Mark rented via Renyt" },
      { status: "rented_off_platform", label: "Mark rented off-platform" },
    ]);
    expect(getOutcomeActions("sale")).toEqual([
      { status: "sold_renyt", label: "Mark sold via Renyt" },
      { status: "sold_off_platform", label: "Mark sold off-platform" },
    ]);
  });

  it("summarizes listing health by operational group", () => {
    const properties: Property[] = [
      {
        id: "1",
        agent_id: "a1",
        title: "Fresh listing",
        description: "description",
        area: "Lekki",
        address_line: "12 Street",
        property_type: "apartment",
        listing_purpose: "rent",
        bedrooms: 2,
        bathrooms: 2,
        rent_amount: 100,
        asking_price: null,
        service_charge: null,
        caution_deposit: null,
        agency_fee: null,
        application_mode: "message_agent",
        is_verified: true,
        verification_status: "approved",
        status: "active",
        availability_confirmed_at: "2026-03-28T10:00:00.000Z",
        freshness_state: "fresh",
        last_updated_at: "2026-03-28T10:00:00.000Z",
        created_at: "2026-03-28T10:00:00.000Z",
      },
      {
        id: "2",
        agent_id: "a1",
        title: "Publishing listing",
        description: "description",
        area: "Lekki",
        address_line: "14 Street",
        property_type: "duplex",
        listing_purpose: "rent",
        bedrooms: 3,
        bathrooms: 3,
        rent_amount: 180,
        asking_price: null,
        service_charge: null,
        caution_deposit: null,
        agency_fee: null,
        application_mode: "message_agent",
        is_verified: false,
        verification_status: "none",
        status: "publishing",
        availability_confirmed_at: null,
        freshness_state: "confirmation_due",
        last_updated_at: "2026-03-28T10:00:00.000Z",
        created_at: "2026-03-28T10:00:00.000Z",
      },
      {
        id: "3",
        agent_id: "a1",
        title: "Closed listing",
        description: "description",
        area: "Lekki",
        address_line: "15 Street",
        property_type: "duplex",
        listing_purpose: "sale",
        bedrooms: 4,
        bathrooms: 4,
        rent_amount: null,
        asking_price: 200,
        service_charge: null,
        caution_deposit: null,
        agency_fee: null,
        application_mode: "message_agent",
        is_verified: true,
        verification_status: "approved",
        status: "sold_renyt",
        availability_confirmed_at: "2026-03-10T10:00:00.000Z",
        freshness_state: "unavailable",
        last_updated_at: "2026-03-28T10:00:00.000Z",
        created_at: "2026-03-28T10:00:00.000Z",
      },
    ];

    expect(summarizeListingHealth(properties)).toEqual({
      publishing: 1,
      needs_confirmation: 0,
      active: 1,
      final_outcomes: 1,
      unavailable: 0,
      archived: 0,
      draft: 0,
    });
  });
});