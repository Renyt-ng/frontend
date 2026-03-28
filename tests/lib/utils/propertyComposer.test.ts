import { describe, expect, it } from "vitest";
import {
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
    const summary = buildDraftPricingSummary(1_200_000, [
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
      imageCount: 2,
    });

    expect(incomplete.ready_to_publish).toBe(false);
    expect(incomplete.blockers).toContain(
      "Write at least 150 characters of description",
    );
    expect(incomplete.blockers).toContain("Upload at least 5 photos");

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
      imageCount: 5,
    });

    expect(ready.ready_to_publish).toBe(true);
    expect(ready.progress_percentage).toBe(100);
  });
});