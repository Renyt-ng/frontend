import { describe, expect, it } from "vitest";
import {
  getPropertyFreshnessBadgeVariant,
  getPropertyFreshnessLabel,
  getPropertyFreshnessState,
  getPropertyFreshnessMeta,
} from "@/lib/utils/listingFreshness";
import type { Property } from "@/types";

describe("listingFreshness utilities", () => {
  it("returns the backend-provided freshness state when available", () => {
    expect(
      getPropertyFreshnessState({
        status: "active",
        availability_confirmed_at: null,
        freshness_state: "fresh",
      }),
    ).toBe("fresh");
  });

  it("uses publishing-specific copy before a listing goes live", () => {
    expect(
      getPropertyFreshnessLabel({
        status: "publishing",
        availability_confirmed_at: null,
        freshness_state: "confirmation_due",
      }),
    ).toBe("Publishing in progress");

    expect(
      getPropertyFreshnessMeta({
        status: "publishing",
        availability_confirmed_at: null,
        freshness_state: "confirmation_due",
      }),
    ).toBe("Not live yet");
  });

  it("maps confirmation due listings to the warning label and badge", () => {
    const property: Pick<
      Property,
      "status" | "availability_confirmed_at" | "freshness_state"
    > = {
      status: "confirmation_due",
      availability_confirmed_at: "2026-03-10T10:00:00.000Z",
      freshness_state: undefined,
    };

    expect(getPropertyFreshnessState(property)).toBe("confirmation_due");
    expect(getPropertyFreshnessLabel(property)).toBe(
      "Availability being confirmed",
    );
    expect(getPropertyFreshnessBadgeVariant(property)).toBe("pending");
  });

  it("maps unavailable listings to the unavailable label", () => {
    expect(
      getPropertyFreshnessLabel({
        status: "unavailable",
        availability_confirmed_at: "2026-03-01T10:00:00.000Z",
        freshness_state: undefined,
      }),
    ).toBe("No longer available");
  });

  it("treats explicit final outcomes as unavailable in freshness cues", () => {
    expect(
      getPropertyFreshnessLabel({
        status: "rented_off_platform",
        availability_confirmed_at: "2026-03-01T10:00:00.000Z",
        freshness_state: undefined,
      }),
    ).toBe("No longer available");
  });
});