import { describe, expect, it } from "vitest";
import {
  deriveDraftAgencyFeeAmount,
  buildDraftReferralBasisSummary,
  buildDraftChecklist,
  buildDraftPricingSummary,
  calculateDraftFeeAmount,
} from "@/lib/utils";

describe("propertyComposer utilities", () => {
  it("calculates fixed and percentage fee amounts", () => {
    expect(
      calculateDraftFeeAmount(1_200_000, {
        fee_type_id: "fee-1",
        value_type: "fixed",
        amount: 150_000,
      }),
    ).toBe(150_000);

    expect(
      calculateDraftFeeAmount(1_200_000, {
        fee_type_id: "fee-2",
        value_type: "percentage",
        percentage: 10,
      }),
    ).toBe(120_000);
  });

  it("builds a pricing summary from rent and fee lines", () => {
    const summary = buildDraftPricingSummary("rent", 1_200_000, 0, [
      {
        fee_type_id: "fee-1",
        value_type: "fixed",
        amount: 150_000,
      },
      {
        fee_type_id: "fee-2",
        value_type: "percentage",
        percentage: 10,
      },
    ]);

    expect(summary.fees_total).toBe(270_000);
    expect(summary.total_move_in_cost).toBe(1_470_000);
    expect(summary.monthly_equivalent).toBe(100_000);
  });

  it("builds a pricing summary from asking price and fee lines for sale listings", () => {
    const summary = buildDraftPricingSummary("sale", 0, 95_000_000, [
      {
        fee_type_id: "fee-1",
        value_type: "fixed",
        amount: 4_000_000,
      },
      {
        fee_type_id: "fee-2",
        value_type: "percentage",
        percentage: 1,
      },
    ]);

    expect(summary.asking_price).toBe(95_000_000);
    expect(summary.fees_total).toBe(4_950_000);
    expect(summary.total_move_in_cost).toBe(99_950_000);
    expect(summary.monthly_equivalent).toBe(0);
  });

  it("marks listing as publish-ready only when core checks pass", () => {
    const incomplete = buildDraftChecklist({
      title: "Short title",
      description: "Too short",
      area: "Lekki",
      address_line: "12 Admiralty Way",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      rent_amount: 1_200_000,
      fees: [],
      feeTypes: [],
      fallback_agency_fee: null,
      listing_authority_mode: null,
      declared_commission_share_percent: null,
      imageCount: 2,
    });

    expect(incomplete.ready_to_publish).toBe(false);
    expect(incomplete.blockers).toContain(
      "Write at least 150 characters of description",
    );
    expect(incomplete.blockers).toContain("Upload at least 5 photos");
    expect(incomplete.blockers).toContain(
      "Choose who controls the commission side of this listing",
    );

    const ready = buildDraftChecklist({
      title: "Elegant 2-bedroom apartment in Lekki Phase 1",
      description:
        "A bright, well-finished apartment with fitted kitchen, water treatment, secure parking, stable estate power, and quick access to Admiralty Way, restaurants, and work hubs for young professionals and families.",
      area: "Lekki",
      address_line: "12 Admiralty Way",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      rent_amount: 1_200_000,
      fees: [
        {
          fee_type_id: "agency-fee-type",
          value_type: "fixed",
          amount: 120_000,
        },
      ],
      feeTypes: [
        {
          id: "agency-fee-type",
          name: "Agency Fee",
          slug: "agency_fee",
          description: null,
          supports_fixed: true,
          supports_percentage: true,
          is_active: true,
          created_by: null,
          created_at: "2026-04-05T00:00:00.000Z",
        },
      ],
      fallback_agency_fee: null,
      listing_authority_mode: "owner_agent",
      declared_commission_share_percent: null,
      imageCount: 5,
    });

    expect(ready.ready_to_publish).toBe(true);
    expect(ready.progress_percentage).toBe(100);
  });

  it("derives the eligible referral basis for authorized listing agents", () => {
    const summary = buildDraftReferralBasisSummary({
      listing_purpose: "rent",
      rent_amount: 1_200_000,
      fees: [
        {
          fee_type_id: "agency-fee-type",
          value_type: "fixed",
          amount: 500_000,
        },
      ],
      feeTypes: [
        {
          id: "agency-fee-type",
          name: "Agency Fee",
          slug: "agency_fee",
          description: null,
          supports_fixed: true,
          supports_percentage: true,
          is_active: true,
          created_by: null,
          created_at: "2026-04-05T00:00:00.000Z",
        },
      ],
      listing_authority_mode: "authorized_listing_agent",
      declared_commission_share_percent: 40,
    });

    expect(summary.referral_eligibility_status).toBe("eligible");
    expect(summary.public_commission_basis_amount).toBe(500_000);
    expect(summary.eligible_referral_basis_amount).toBe(200_000);
    expect(summary.publish_blocker).toBeNull();
  });

  it("derives agency fee from fee lines", () => {
    const amount = deriveDraftAgencyFeeAmount({
      listingPurpose: "rent",
      rentAmount: 1_200_000,
      fees: [
        {
          fee_type_id: "agency-fee-type",
          value_type: "percentage",
          percentage: 10,
        },
      ],
      feeTypes: [
        {
          id: "agency-fee-type",
          name: "Agency Fee",
          slug: "agency_fee",
          description: null,
          supports_fixed: true,
          supports_percentage: true,
          is_active: true,
          created_by: null,
          created_at: "2026-04-05T00:00:00.000Z",
        },
      ],
    });

    expect(amount).toBe(120_000);
  });
});